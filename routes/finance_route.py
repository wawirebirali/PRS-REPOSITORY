from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from model import get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role
from db_connect import get_db_connection
from flask import jsonify

finance_dashboard_bp = Blueprint("finance_dashboard", __name__, template_folder="../templates")

@finance_dashboard_bp.route("/dashboard")
def dashboard():
    if session.get("user_role") != "finance":
        flash("Unauthorized access", "danger")
        return redirect(url_for("auth.user_login"))
    requisitions = get_pending_requisitions_for_role("Finance")
    return render_template("finanance_dashboard.html", requisitions=requisitions)





@finance_dashboard_bp.route("/api/invoice/<int:invoice_id>")
def get_invoice(invoice_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            i.invoice_id,
            i.invoice_number,
            i.supplier_name,
            i.total_amount,

            po.purchase_order_id,
            po.po_number,

            r.requisition_id,
            r.prs_no

        FROM invoices i

        LEFT JOIN purchase_orders po 
            ON i.purchase_order_id = po.purchase_order_id

        LEFT JOIN requisitions r 
            ON po.requisition_id = r.requisition_id

        WHERE i.invoice_id = %s
    """, (invoice_id,))

    invoice = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(invoice)

from datetime import datetime

def generate_payment_no(cursor):
    from datetime import datetime

    year = datetime.now().year

    cursor.execute("""
        SELECT payment_no
        FROM payments
        WHERE payment_no LIKE %s
        ORDER BY payment_id DESC
        LIMIT 1
    """, (f"PAY/{year}/%",))

    last = cursor.fetchone()

    if not last:
        return f"PAY/{year}/0001"

    last_no = last["payment_no"]
    last_num = int(last_no.split("/")[-1])

    return f"PAY/{year}/{str(last_num + 1).zfill(4)}"

@finance_dashboard_bp.route("/create_payment", methods=["POST"])


def create_payment():
    data = request.json
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # =========================
    # GET requisition_id from invoice
    # =========================
    cursor.execute("""
        SELECT po.requisition_id
        FROM invoices i
        JOIN purchase_orders po 
            ON i.purchase_order_id = po.purchase_order_id
        WHERE i.invoice_id = %s
    """, (data["invoice_id"],))

    row = cursor.fetchone()
    requisition_id = row["requisition_id"] if row else None

    # =========================
    # generate payment number
    # =========================
    payment_no = generate_payment_no(cursor)

    # =========================
    # INSERT PAYMENT
    # =========================
    cursor.execute("""
        INSERT INTO payments (
            requisition_id,
            invoice_id,
            payment_no,
            paid_by,
            payment_method,
            amount,
            amount_paid,
            balance,
            payment_date,
            remarks
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        requisition_id,
        data["invoice_id"],
        payment_no,
        user_id,
        data["payment_method"],
        data["amount"],
        data["amount_paid"],
        data["balance"],
        datetime.now(),
        data["remarks"]
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "payment_no": payment_no
    })

@finance_dashboard_bp.route("/next_payment_no")
def next_payment_no():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT payment_no 
        FROM payments
        ORDER BY payment_id DESC
        LIMIT 1
    """)
    last = cursor.fetchone()

    from datetime import datetime
    year = datetime.now().year

    if not last or last["payment_no"] is None:
        new_no = f"PAY/{year}/0001"
    else:
        last_no = last["payment_no"]
        try:
            last_num = int(last_no.split("/")[-1])
        except:
            last_num = 0

        new_no = f"PAY/{year}/{str(last_num + 1).zfill(4)}"

    cursor.close()
    conn.close()

    return jsonify({"payment_no": new_no})

# FINANCE REQUISITION MODULE
@finance_dashboard_bp.route("/api/finance_requisition")
def finance_requisition():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            r.requisition_id,
            r.prs_no,
            d.department_name,
            r.submission_date,
            r.status,

            COALESCE(a.hod_status, 'PENDING') AS hod_status,
            COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
            COALESCE(a.final_status, 'PENDING') AS final_status

        FROM requisitions r

        JOIN departments d 
            ON r.department_id = d.department_id

        LEFT JOIN approvals a 
            ON a.module_name = 'PRS'
            AND a.document_id = r.requisition_id

        ORDER BY r.requisition_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("submission_date"):
            row["submission_date"] = row["submission_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)



@finance_dashboard_bp.route("/api/finance_requisitiondetails/<int:req_id>")
def finance_requisition_details(req_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =========================
        # HEADER
        # =========================
        cursor.execute("""
            SELECT 
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,

                a.hod_approved_at,
                a.ceo_approved_at

            FROM requisitions r

            JOIN departments d 
                ON r.department_id = d.department_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PRS'
                AND a.document_id = r.requisition_id

            WHERE r.requisition_id = %s
            LIMIT 1
        """, (req_id,))

        req = cursor.fetchone()

        if not req:
            return jsonify({"error": "Requisition not found"}), 404

        # =========================
        # ITEMS
        # =========================
        cursor.execute("""
            SELECT 
                material_name,
                uom,
                qty_required
            FROM requisition_items
            WHERE requisition_id = %s
        """, (req_id,))

        items = cursor.fetchall()

        # =========================
        # FORMAT DATES
        # =========================
        if req.get("submission_date"):
            req["submission_date"] = req["submission_date"].isoformat()

        if req.get("hod_approved_at"):
            req["hod_approved_at"] = req["hod_approved_at"].isoformat()

        if req.get("ceo_approved_at"):
            req["ceo_approved_at"] = req["ceo_approved_at"].isoformat()

        # =========================
        # FINAL RESPONSE (CLEAN)
        # =========================
        return jsonify({
            "requisition_id": req["requisition_id"],
            "prs_no": req["prs_no"],
            "department": req["department_name"],
            "submission_date": req["submission_date"],

            "hod_status": req["hod_status"],
            "ceo_status": req["ceo_status"],

            "hod_approved_at": req["hod_approved_at"],
            "ceo_approved_at": req["ceo_approved_at"],

            "items": items
        })

    finally:
        cursor.close()
        conn.close()



# FINANCE PAYMENT MODULE
@finance_dashboard_bp.route("/payments/api")
def get_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                p.payment_id,
                p.payment_no,
                s.supplier_name,
                i.invoice_number AS invoice_no,
                p.amount_paid,
                a.final_status AS status,
                p.payment_date

            FROM payments p

            JOIN invoices i 
                ON p.invoice_id = i.invoice_id

            JOIN purchase_orders po 
                ON i.purchase_order_id = po.purchase_order_id

            JOIN suppliers s 
                ON po.supplier_id = s.supplier_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PAYMENT'
                AND a.document_id = p.payment_id

            ORDER BY p.payment_id DESC
        """

        cursor.execute(query)
        payments = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": payments
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@finance_dashboard_bp.route("/payment/<int:payment_id>")
def payment_slip(payment_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            p.payment_id,
            p.payment_no,
            p.amount AS amount,
            p.amount_paid,
            p.balance,
            p.payment_method,
            p.payment_date,
            i.invoice_number AS invoice_no,
            s.supplier_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN purchase_orders po ON i.purchase_order_id = po.purchase_order_id
        JOIN suppliers s ON po.supplier_id = s.supplier_id
        WHERE p.payment_id = %s
    """, (payment_id,))

    payment = cursor.fetchone()

    cursor.execute("""
        SELECT 
            description AS item_name,
            quantity,
            unit_price,
            total_price AS total
        FROM invoice_items
        WHERE invoice_id = (
            SELECT invoice_id FROM payments WHERE payment_id = %s
        )
    """, (payment_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "data": {
            **payment,
            "items": items
        }
    })





@finance_dashboard_bp.route("/finance_invoice_data")
def finance_invoice_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            i.invoice_id,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.supplier_name,

            i.invoice_date AS submission_date,

            r.prs_no,
            d.department_name AS department,

            COALESCE(a.final_status, 'PENDING') AS status,

            COALESCE(
                (
                    SELECT g2.grn_no
                    FROM grn g2
                    WHERE g2.po_id = p.purchase_order_id
                    ORDER BY g2.grn_id DESC
                    LIMIT 1
                ),
                ''
            ) AS grn_no

        FROM invoices i

        JOIN purchase_orders p
            ON i.purchase_order_id = p.purchase_order_id

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

        JOIN departments d
            ON r.department_id = d.department_id

        LEFT JOIN approvals a
            ON a.module_name = 'INVOICE'
            AND a.document_id = i.invoice_id

        ORDER BY i.invoice_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("invoice_date"):
            row["invoice_date"] = row["invoice_date"].isoformat()

        if row.get("submission_date"):
            row["submission_date"] = row["submission_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)


@finance_dashboard_bp.route("/finance_invoice_details/<int:invoice_id>")
def finance_invoice_details(invoice_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =========================
        # INVOICE HEADER + APPROVAL
        # =========================
        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.total_amount,
                i.supplier_name,

                r.prs_no,
                d.department_name AS department,
                p.po_number,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                COALESCE(a.final_status, 'PENDING') AS final_status,

                a.hod_approved_at,
                a.ceo_approved_at

            FROM invoices i

            JOIN purchase_orders p
                ON i.purchase_order_id = p.purchase_order_id

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.approval_id = (
                    SELECT MAX(a2.approval_id)
                    FROM approvals a2
                    WHERE a2.module_name = 'INVOICE'
                    AND a2.document_id = i.invoice_id
                )

            WHERE i.invoice_id = %s
            LIMIT 1
        """, (invoice_id,))

        invoice = cursor.fetchone()

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        # =========================
        # FORMAT DATES SAFELY
        # =========================
        def fmt(d):
            return d.isoformat() if d else None

        invoice["invoice_date"] = fmt(invoice.get("invoice_date"))
        invoice["hod_approved_at"] = fmt(invoice.get("hod_approved_at"))
        invoice["ceo_approved_at"] = fmt(invoice.get("ceo_approved_at"))

        # =========================
        # INVOICE ITEMS
        # =========================
        cursor.execute("""
            SELECT
                description,
                quantity,
                unit_price,
                total_price
            FROM invoice_items
            WHERE invoice_id = %s
        """, (invoice_id,))

        invoice["items"] = cursor.fetchall()

        return jsonify(invoice)

    finally:
        cursor.close()
        conn.close()