from flask import Blueprint, flash, render_template, session, redirect, url_for, jsonify
from model import get_db_connection

procurement_dashboard_bp = Blueprint("procurement_dashboard", __name__)


# =========================
# DASHBOARD PAGE
# =========================
@procurement_dashboard_bp.route("/", methods=["GET"])
def procurement_dashboard():

    if session.get("user_role") != "procurement":
        return redirect(url_for("auth.login"))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            r.requisition_id,
            r.prs_no,
            d.department_name,
            COALESCE(a.hod_status,'Pending') AS hod_status,
            r.submission_date,
            COALESCE(a.hod_approval_date,'-') AS hod_approval_date
        FROM requisitions r
        LEFT JOIN departments d ON r.department_id = d.department_id
        LEFT JOIN approvals a ON r.requisition_id = a.requisition_id
        ORDER BY r.requisition_id DESC
    """)

    requisitions = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("procurement_dashboard.html", requisitions=requisitions)


# =========================
# PRS DETAILS API (AJAX)
# =========================
@procurement_dashboard_bp.route("/requisition/api/<int:requisition_id>")
def requisition_api(requisition_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # HEADER
    cursor.execute("""
        SELECT 
            r.requisition_id,
            r.prs_no,
            d.department_name,
            r.submission_date,
            a.hod_status,
            a.ceo_status,
            a.hod_approval_date,
            a.ceo_approval_date
        FROM requisitions r
        LEFT JOIN departments d ON r.department_id = d.department_id
        LEFT JOIN approvals a ON r.requisition_id = a.requisition_id
        WHERE r.requisition_id = %s
    """, (requisition_id,))

    requisition = cursor.fetchone()

    # ITEMS
    cursor.execute("""
        SELECT material_name, uom, qty_required
        FROM requisition_items
        WHERE requisition_id = %s
    """, (requisition_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "requisition": requisition,
        "items": items
    })


from flask import request
from datetime import datetime
@procurement_dashboard_bp.route("/approve", methods=["POST"])
def approve_requisition():

    requisition_id = request.form.get("requisition_id")
    approver_id = session.get("user_id")  # IMPORTANT FIX

    if not requisition_id:
        return "No requisition selected", 400

    if not approver_id:
        return "User not logged in properly", 401

    conn = get_db_connection()
    cursor = conn.cursor()

    # check existing approval
    cursor.execute("""
        SELECT approval_id FROM approvals
        WHERE requisition_id = %s
    """, (requisition_id,))

    existing = cursor.fetchone()

    from datetime import datetime
    now = datetime.now()

    if existing:
        cursor.execute("""
            UPDATE approvals
            SET hod_status = 'APPROVED',
                hod_approval_date = %s,
                approver_id = %s
            WHERE requisition_id = %s
        """, (now, approver_id, requisition_id))

    else:
        cursor.execute("""
            INSERT INTO approvals
            (requisition_id, hod_status, hod_approval_date, approver_id)
            VALUES (%s, 'APPROVED', %s, %s)
        """, (requisition_id, now, approver_id))

    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for("hod_dashboard.hod_dashboard"))



@procurement_dashboard_bp.route("/requisition/hod-signature/<int:requisition_id>")
def get_hod_signature(requisition_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
    SELECT 
        r.requisition_id,
        r.prs_no,
        d.department_name,
        r.submission_date,

        u.user_id AS hod_id,
        u.username AS hod_name,
        u.signature AS hod_signature,
        a.hod_approval_date

    FROM requisitions r
    JOIN departments d 
        ON r.department_id = d.department_id
    JOIN users u 
        ON u.department = d.department_name
    LEFT JOIN approvals a 
        ON a.requisition_id = r.requisition_id
       AND a.role = 'HOD'

    WHERE r.requisition_id = %s
      AND u.user_role = 'hod'
""", (requisition_id,))

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(result)



@procurement_dashboard_bp.route("/add_supplier", methods=["GET", "POST"])
def add_supplier():

    if request.method == "POST":

        supplier_name = request.form.get("supplier_name")
        contact_person = request.form.get("contact_person")
        email = request.form.get("email")
        phone = request.form.get("phone")
        address = request.form.get("address")
        tin_number = request.form.get("tin_number")
        registration_number = request.form.get("registration_number")
        bank_name = request.form.get("bank_name")
        account_number = request.form.get("account_number")

        # DATABASE CONNECTION
        conn = get_db_connection()
        cursor = conn.cursor()

        # INSERT QUERY
        cursor.execute("""
            INSERT INTO suppliers
            (
                supplier_name,
                contact_person,
                email,
                phone,
                address,
                tin_number,
                registration_number,
                bank_name,
                account_number
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            supplier_name,
            contact_person,
            email,
            phone,
            address,
            tin_number,
            registration_number,
            bank_name,
            account_number
        ))

        conn.commit()

        cursor.close()
        conn.close()

        # REDIRECT TO PROCUREMENT DASHBOARD
        return redirect(url_for(
            "procurement_dashboard.procurement_dashboard"
        ))

    return render_template("add_supplier.html")



@procurement_dashboard_bp.route("/create_rfq")
def create_rfq():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    # ====================================
    # GET REQUISITIONS
    # ====================================
    cursor.execute("""
        SELECT requisition_id, prs_no
        FROM requisitions
    """)

    requisitions = cursor.fetchall()

    # ====================================
    # GET SUPPLIERS
    # ====================================
    cursor.execute("""
        SELECT supplier_id, supplier_name
        FROM suppliers
    """)

    suppliers = cursor.fetchall()

    # ====================================
    # GET USERS
    # ====================================
    cursor.execute("""
        SELECT user_id, username
        FROM users
    """)

    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(

        "create_quotation_form.html",

        requisitions=requisitions,

        suppliers=suppliers,

        users=users
    )


from flask import request, jsonify, url_for
from model import get_db_connection

@procurement_dashboard_bp.route("/save_qrf", methods=["POST"])
def save_qrf():

    try:
        # =========================
        # GET JSON DATA
        # =========================
        data = request.get_json()

        requester_name = data.get("requester_name")
        submission_date = data.get("submission_date")
        prs_no = data.get("prs_no")
        supplier_id = data.get("supplier")
        items = data.get("items") or []

        # =========================
        # DB CONNECTION
        # =========================
        conn = get_db_connection()
        cursor = conn.cursor()

        # =========================
        # SAFE COUNT FOR QRF NO
        # =========================
        cursor.execute("SELECT COUNT(*) FROM quotation_requests")
        count = cursor.fetchone()[0]

        qrf_no = f"QRF-{count + 1:03d}"

        # =========================
        # INSERT QRF HEADER
        # =========================
        cursor.execute("""
            INSERT INTO quotation_requests (
                qrf_no,
                requisition_id,
                requested_by,
                request_date,
                status,
                remarks
            )
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            qrf_no,
            prs_no,
            1,
            submission_date,
            "PENDING",
            requester_name
        ))

        # GET INSERTED ID
        qrf_id = cursor.lastrowid

        # =========================
        # INSERT SUPPLIER
        # =========================
        cursor.execute("""
            INSERT INTO quotation_request_suppliers (
                qrf_id,
                supplier_id,
                sent_date,
                supplier_response
            )
            VALUES (%s,%s,%s,%s)
        """, (
            qrf_id,
            supplier_id,
            submission_date,
            "PENDING"
        ))

        # =========================
        # INSERT ITEMS
        # =========================
        for item in items:
            cursor.execute("""
                INSERT INTO quotation_items (
                    qrf_id,
                    material_name,
                    description,
                    brand,
                    qty
                )
                VALUES (%s,%s,%s,%s,%s)
            """, (
                qrf_id,
                item.get("item"),
                item.get("description", ""),
                "N/A",
                item.get("qty")
            ))

        # =========================
        # COMMIT + CLOSE
        # =========================
        conn.commit()
        cursor.close()
        conn.close()

        # =========================
        # SUCCESS RESPONSE
        # =========================
        return jsonify({
            "message": "QRF created successfully",
            "redirect": url_for("procurement_dashboard.procurement_dashboard")
        })

    except Exception as e:
        print("ERROR IN SAVE_QRF:", str(e))

        return jsonify({
            "error": str(e),
            "message": "Something went wrong while saving QRF"
        }), 500
    



@procurement_dashboard_bp.route("/Quotation_entry", methods=["GET"])
def enterQuotation():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    # =========================
    # GET REQUISITIONS
    # =========================
    cursor.execute("""
        SELECT
            requisition_id,
            prs_no
        FROM requisitions
        ORDER BY requisition_id DESC
    """)

    requisitions = cursor.fetchall()

    # =========================
    # GET SUPPLIERS
    # =========================
    cursor.execute("""
        SELECT
            supplier_id,
            supplier_name
        FROM suppliers
        ORDER BY supplier_name ASC
    """)

    suppliers = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(
        "quotations_entry.html",
        requisitions=requisitions,
        suppliers=suppliers
    )



@procurement_dashboard_bp.route("/Quotation_entry", methods=["POST"])
def save_quotation():

    try:
        data = request.get_json()

        qrf_id = data.get("qrf_id")
        supplier_id = data.get("supplier_id")
        quotation_no = data.get("quotation_no")
        quotation_date = data.get("quotation_date")

        delivery_days = data.get("delivery_days")
        payment_terms = data.get("payment_terms")
        warranty = data.get("warranty")
        remarks = data.get("remarks")

        items = data.get("items") or []

        conn = get_db_connection()
        cursor = conn.cursor()

        # =========================
        # CALCULATE TOTAL
        # =========================
        total_amount = sum(
            float(i.get("quantity", 0)) * float(i.get("unit_price", 0))
            for i in items
        )

        # =========================
        # INSERT INTO quotations
        # =========================
        cursor.execute("""
            INSERT INTO quotations (
                qrf_id, supplier_id, quotation_no, quotation_date,
                total_amount, delivery_days, payment_terms,
                warranty, status, remarks
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            qrf_id,
            supplier_id,
            quotation_no,
            quotation_date,
            total_amount,
            delivery_days,
            payment_terms,
            warranty,
            "PENDING",
            remarks
        ))

        quotation_id = cursor.lastrowid

        # =========================
        # INSERT ITEMS
        # =========================
        for item in items:
            cursor.execute("""
                INSERT INTO quotation_record_items (
                    qrf_id,
                    item_name,
                    description,
                    quantity,
                    unit_price
                )
                VALUES (%s,%s,%s,%s,%s)
            """, (
                qrf_id,
                item.get("item_name"),
                item.get("description"),
                item.get("quantity"),
                item.get("unit_price")
            ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Quotation saved successfully",
            "redirect": url_for("procurement_dashboard.procurement_dashboard")
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({
            "error": str(e),
            "message": "Failed to save quotation"
        }), 500


# =========================
# COMPARE SUPPLIERS PAGE


@procurement_dashboard_bp.route("/compare_suppliers")
def compare_suppliers():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # GET PRS LIST (better than quotations)
    cursor.execute("""
        SELECT requisition_id, prs_no
        FROM requisitions
        ORDER BY requisition_id DESC
    """)
    requisitions = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(
        "compare_supplier.html",
        requisitions=requisitions
    )

@procurement_dashboard_bp.route("/get_prs_quotations/<int:prs_id>")
def get_prs_quotations(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            quotation_id,
            quotation_no
        FROM quotations
        WHERE qrf_id = %s
        ORDER BY quotation_id DESC
    """, (prs_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)



@procurement_dashboard_bp.route("/get_quotation/<int:quotation_id>")
def get_quotation(quotation_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            q.quotation_id,
            q.qrf_id,
            q.quotation_no,
            q.total_amount,
            q.delivery_days,
            q.warranty,
            s.supplier_name
        FROM quotations q
        JOIN suppliers s ON q.supplier_id = s.supplier_id
        WHERE q.quotation_id = %s
    """, (quotation_id,))

    q = cursor.fetchone()

    cursor.close()
    conn.close()

    if not q:
        return jsonify({"error": "Quotation not found"}), 404

    return jsonify({
        "quotation_id": q["quotation_id"],
        "prs_id": q["qrf_id"],
        "quotation_no": q["quotation_no"],
        "supplier_name": q["supplier_name"],
        "total_amount": q["total_amount"],
        "delivery_days": q["delivery_days"],
        "warranty": q["warranty"]
    })


@procurement_dashboard_bp.route("/get_quotation_items/<int:qrf_id>")
def get_quotation_items(qrf_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            item_name,
            description,
            quantity,
            unit_price,
            (quantity * unit_price) AS total
        FROM quotation_record_items
        WHERE qrf_id = %s
    """, (qrf_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(items)


@procurement_dashboard_bp.route("/validate_quotation_prs/<int:quotation_id>/<int:prs_id>")
def validate_quotation_prs(quotation_id, prs_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*)
        FROM quotations
        WHERE quotation_id = %s
        AND qrf_id = %s
    """, (quotation_id, prs_id))

    valid = cursor.fetchone()[0] > 0

    cursor.close()
    conn.close()

    return jsonify({"valid": valid})



# PO STARTS HERE

from flask import Blueprint, request, jsonify, render_template
from model import get_db_connection
from datetime import datetime



# =========================
# PAGE LOAD
# =========================
@procurement_dashboard_bp.route("/create_po", methods=["GET"])
def create_po_page():
    return render_template("create_po.html")


# =========================
# GET PRS LIST
# =========================
@procurement_dashboard_bp.route("/get_prs_list")
def get_prs_list():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT requisition_id, prs_no
        FROM requisitions
        ORDER BY requisition_id DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# GET USERS
# ====================================================
@procurement_dashboard_bp.route("/get_users")
def get_users():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT user_id, username
        FROM users

    """)

    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(users)


# =========================
# GET SUPPLIERS LIST
# =========================
@procurement_dashboard_bp.route("/get_suppliers")
def get_suppliers():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT supplier_id, supplier_name
        FROM suppliers

    """)

    suppliers = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(suppliers)


# =========================
# CREATE PURCHASE ORDER (POST)
# =========================
@procurement_dashboard_bp.route("/create_po", methods=["POST"])
def create_po_post():

    data = request.get_json()

    po_number = data.get("po_number")
    order_date = data.get("order_date")
    created_by = data.get("created_by")

    requisition_id = data.get("requisition_id")
    supplier_id = data.get("supplier_id")

    items = data.get("items", [])

    # VALIDATION
    if not requisition_id:
        return jsonify({"success": False, "message": "PRS is required"}), 400

    if not supplier_id:
        return jsonify({"success": False, "message": "Supplier is required"}), 400

    if len(items) == 0:
        return jsonify({"success": False, "message": "No items provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # TOTAL CALCULATION
        total_amount = sum(
            float(i.get("quantity", 0)) * float(i.get("unit_price", 0))
            for i in items
        )

        # INSERT PURCHASE ORDER
        cursor.execute("""
            INSERT INTO purchase_orders
            (requisition_id, po_number, supplier_id, order_date, total_amount)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            requisition_id,
            po_number,
            supplier_id,
            order_date,
            total_amount
        ))

        po_id = cursor.lastrowid

        # INSERT ITEMS
        for i in items:
            cursor.execute("""
                INSERT INTO purchase_order_items
                (purchase_order_id, item_name, description, quantity, unit_price)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                po_id,
                i.get("item_name"),
                i.get("description"),
                i.get("quantity"),
                i.get("unit_price")
            ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Purchase Order created successfully",
            "po_id": po_id,
            "redirect": url_for("procurement_dashboard.procurement_dashboard")
        })

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()





# GRN STARTS HERE





# =========================================
# CREATE GRN PAGE
## =========================================
# CREATE GRN PAGE
# =========================================
@procurement_dashboard_bp.route("/create_grn")
def create_grn():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    # =====================================
    # PURCHASE ORDERS
    # =====================================
    cursor.execute("""

        SELECT
            purchase_order_id,
            po_number

        FROM purchase_orders

        ORDER BY purchase_order_id DESC

    """)

    pos = cursor.fetchall()


    # =====================================
    # SUPPLIERS
    # =====================================
    cursor.execute("""

        SELECT
            supplier_id,
            supplier_name

        FROM suppliers

        WHERE status='ACTIVE'

        ORDER BY supplier_name ASC

    """)

    suppliers = cursor.fetchall()


    # =====================================
    # USERS
    # =====================================
    cursor.execute("""

        SELECT
            user_id,
            username

        FROM users

        ORDER BY username ASC

    """)

    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(

        "create_grn.html",

        pos=pos,
        suppliers=suppliers,
        users=users

    )



# =========================================
# SAVE GRN
# =========================================
@procurement_dashboard_bp.route(
    "/save_grn",
    methods=["POST"]
)
def save_grn():

    conn = get_db_connection()

    cursor = conn.cursor()

    try:

        # =====================================
        # HEADER DATA
        # =====================================
        grn_no = request.form["grn_no"]

        po_id = request.form["po_id"]

        supplier_id = request.form["supplier_id"]

        received_by = request.form["received_by"]

        received_date = request.form["received_date"]

        delivery_note_no = request.form.get(
            "delivery_note_no"
        )

        main_remarks = request.form.get(
            "main_remarks"
        )


        # =====================================
        # DETERMINE STATUS
        # =====================================
        remarks_list = request.form.getlist(
            "remarks[]"
        )

        inspection_status = "ACCEPTED"

        if "PARTIAL" in remarks_list:

            inspection_status = "PARTIAL"

        if "REJECTED" in remarks_list:

            inspection_status = "REJECTED"


        # =====================================
        # INSERT GRN HEADER
        # =====================================
        cursor.execute("""

            INSERT INTO grn (

                grn_no,
                po_id,
                supplier_id,
                received_by,
                received_date,
                delivery_note_no,
                inspection_status,
                remarks

            )

            VALUES (

                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s

            )

        """, (

            grn_no,
            po_id,
            supplier_id,
            received_by,
            received_date,
            delivery_note_no,
            inspection_status,
            main_remarks

        ))


        # =====================================
        # GET NEW GRN ID
        # =====================================
        grn_id = cursor.lastrowid


        # =====================================
        # GET ITEM ARRAYS
        # =====================================
        material_names = request.form.getlist(
            "material_name[]"
        )

        descriptions = request.form.getlist(
            "description[]"
        )

        qty_ordered = request.form.getlist(
            "quantity_ordered[]"
        )

        qty_received = request.form.getlist(
            "quantity_received[]"
        )

        qty_rejected = request.form.getlist(
            "quantity_rejected[]"
        )

        remarks = request.form.getlist(
            "remarks[]"
        )


        # =====================================
        # INSERT ITEMS
        # =====================================
        for i in range(len(material_names)):

            cursor.execute("""

                INSERT INTO grn_items (

                    grn_id,
                    material_name,
                    description,
                    quantity_ordered,
                    quantity_received,
                    quantity_rejected,
                    remarks

                )

                VALUES (

                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s

                )

            """, (

                grn_id,
                material_names[i],
                descriptions[i],
                qty_ordered[i],
                qty_received[i],
                qty_rejected[i],
                remarks[i]

            ))


        # =====================================
        # UPDATE PO STATUS
        # =====================================
        cursor.execute("""

            UPDATE purchase_orders

            SET status='Delivered'

            WHERE purchase_order_id=%s

        """, (po_id,))


        # =====================================
        # SAVE
        # =====================================
        conn.commit()

        flash(
            "GRN Saved Successfully",
            "success"
        )

        return redirect(
            "/procurement/dashboard"
        )

    except Exception as e:

        conn.rollback()

        print(e)

        flash(
            f"Error Saving GRN: {str(e)}",
            "danger"
        )

        return redirect(
            "/procurement/create_grn"
        )

    finally:

        cursor.close()
        conn.close()



# =========================================
# GET PO ITEMS
# =========================================
@procurement_dashboard_bp.route(
    "/get_po_items/<int:po_id>"
)
def get_po_items(po_id):

    db = get_db_connection()

    cursor = db.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            po_item_id,
            item_name,
            description,
            quantity,
            unit_price

        FROM purchase_order_items

        WHERE purchase_order_id = %s

    """, (po_id,))

    items = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(items)


@procurement_dashboard_bp.route("/get_grn_items/<int:grn_id>")
def get_grn_items(grn_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            material_name,
            remarks,
            quantity_received
        FROM grn_items
        WHERE grn_id = %s
    """, (grn_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(items)


@procurement_dashboard_bp.route("/create_invoice")
def create_invoice():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # GRNs
    cursor.execute("""
        SELECT grn_id, grn_no
        FROM grn
        ORDER BY grn_id DESC
    """)
    grns = cursor.fetchall()

    # SUPPLIERS
    cursor.execute("""
        SELECT supplier_id, supplier_name
        FROM suppliers
        WHERE status = 'ACTIVE'
    """)
    suppliers = cursor.fetchall()

    # USERS
    cursor.execute("""
        SELECT user_id, username
        FROM users
        WHERE status = 'active'
    """)
    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(
        "invoice_entry_form.html",
        grns=grns,
        suppliers=suppliers,
        users=users
    )



@procurement_dashboard_bp.route("/save_invoice", methods=["POST"])
def save_invoice():

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        # =========================
        # HEADER DATA
        # =========================
        grn_id = request.form["grn_id"]
        supplier_id = request.form["supplier_id"]
        created_by = request.form["created_by"]
        invoice_no = request.form["invoice_no"]
        invoice_date = request.form["invoice_date"]

        amounts = request.form.getlist("amount[]")
        total = sum(float(a) for a in amounts if a)

        # =========================
        # GET PO FROM GRN
        # =========================
        cursor.execute("""
            SELECT po_id
            FROM grn
            WHERE grn_id = %s
        """, (grn_id,))

        po_id = cursor.fetchone()[0]

        # =========================
        # GET SUPPLIER NAME
        # =========================
        cursor.execute("""
            SELECT supplier_name
            FROM suppliers
            WHERE supplier_id = %s
            LIMIT 1
        """, (supplier_id,))
        supplier = cursor.fetchone()
        supplier_name = supplier[0] if supplier else ""

        # =========================
        # INSERT INVOICE HEADER
        # =========================
        cursor.execute("""
            INSERT INTO invoices (
                purchase_order_id,
                invoice_number,
                supplier_name,
                invoice_date,
                total_amount,
                status
            )
            VALUES (%s,%s,%s,%s,%s,'Pending')
        """, (
            po_id,
            invoice_no,
            supplier_name,
            invoice_date,
            total
        ))

        invoice_id = cursor.lastrowid

        # =========================
        # INSERT ITEMS
        # =========================
        materials = request.form.getlist("material_name[]")
        descriptions = request.form.getlist("description[]")
        qtys = request.form.getlist("quantity[]")
        unit_prices = request.form.getlist("unit_price[]")
        amounts = request.form.getlist("amount[]")

        for i in range(len(materials)):

            cursor.execute("""
                INSERT INTO invoice_items (
                    invoice_id,
                    description,
                    quantity,
                    unit_price,
                    total_price
                )
                VALUES (%s,%s,%s,%s,%s)
            """, (
                invoice_id,
                descriptions[i],
                qtys[i],
                unit_prices[i],
                amounts[i]
            ))

        conn.commit()

        return redirect(url_for("procurement_dashboard.procurement_dashboard"))

    except Exception as e:
        conn.rollback()
        return str(e)

    finally:
        cursor.close()
        conn.close()