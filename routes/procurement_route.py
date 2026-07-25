from flask import Blueprint, flash, render_template, session, redirect, url_for, jsonify
from model import get_db_connection

procurement_dashboard_bp = Blueprint("procurement_dashboard", __name__)


# =========================
# DASHBOARD PAGE
# =========================

@procurement_dashboard_bp.route("/", methods=["GET"])
def procurement_dashboard():

    # =====================================================
    # CHECK PROCUREMENT LOGIN
    # =====================================================

    if session.get("user_role") != "procurement":

        return redirect(
            url_for("auth.login")
        )


    conn = None
    cursor = None


    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # =====================================================
        # LOAD REQUISITIONS FOR QRF
        #
        # USE approvals.final_status
        #
        # Only PRS requisitions that are NOT rejected
        # are loaded.
        # =====================================================

        cursor.execute("""
            SELECT

                r.requisition_id,

                r.prs_no,

                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS final_status

            FROM requisitions r

            LEFT JOIN approvals a

                ON a.module_name = 'PRS'

                AND a.document_id =
                    r.requisition_id

            WHERE COALESCE(
                a.final_status,
                'PENDING'
            ) != 'REJECTED'

            ORDER BY
                r.requisition_id DESC

        """)

        requisitions = cursor.fetchall()


        # =====================================================
        # LOAD SUPPLIERS
        # =====================================================

        cursor.execute("""
            SELECT

                supplier_id,

                supplier_name

            FROM suppliers

            ORDER BY
                supplier_name

        """)

        suppliers = cursor.fetchall()


        # =====================================================
        # LOAD PURCHASE ORDERS
        # =====================================================

        cursor.execute("""
            SELECT

                purchase_order_id,

                po_number

            FROM purchase_orders

            ORDER BY
                purchase_order_id DESC

        """)

        pos = cursor.fetchall()


        # =====================================================
        # LOAD QUOTATIONS
        # =====================================================

        cursor.execute("""
            SELECT

                quotation_id,

                quotation_no

            FROM quotations

            ORDER BY
                quotation_id DESC

        """)

        quotations = cursor.fetchall()


        # =====================================================
        # LOAD QUOTATION REQUESTS
        # =====================================================

        cursor.execute("""
            SELECT

                qrf_id,

                qrf_no

            FROM quotation_requests

            ORDER BY
                qrf_id DESC

        """)

        qrfs = cursor.fetchall()


        # =====================================================
        # RENDER PROCUREMENT DASHBOARD
        # =====================================================

        return render_template(

            "procurement_dashboard.html",

            requisitions=requisitions,

            suppliers=suppliers,

            pos=pos,

            quotations=quotations,

            qrfs=qrfs

        )


    except Exception as e:

        print(
            "Procurement Dashboard Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load Procurement Dashboard.",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()


            
@procurement_dashboard_bp.route("/api/procurement_requisition")
def procurement_requisition():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 

                r.requisition_id,

                r.prs_no,

                d.department_name,

                r.submission_date,

                -- FINAL STATUS FROM APPROVALS TABLE
                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS final_status,

                -- NUMBER OF DAYS SINCE SUBMISSION
                DATEDIFF(
                    CURRENT_DATE,
                    DATE(r.submission_date)
                ) AS due

            FROM requisitions r

            INNER JOIN departments d
                ON r.department_id =
                   d.department_id

            LEFT JOIN approvals a
                ON a.module_name = 'PRS'
                AND a.document_id =
                    r.requisition_id

            ORDER BY
                r.requisition_id DESC

        """)

        data = cursor.fetchall()

        return jsonify(data)

    except Exception as e:

        print(
            "Procurement Requisition API Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load procurement requisitions.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()
# =========================
# PRS DETAILS API (AJAX)
# =========================
@procurement_dashboard_bp.route("/api/procurement_requisition/<int:req_id>")
def procurement_requisition_details(req_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================
        # REQUISITION HEADER
        # =====================================
        cursor.execute("""
            SELECT

                r.requisition_id,
                r.prs_no,
                r.submission_date,

                d.department_name,

                u.username AS requester_name,
                u.email AS requester_email,
                u.signature AS requester_signature,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.ceo_status,'PENDING') AS ceo_status,
                COALESCE(a.final_status,'PENDING') AS status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                hod.signature AS hod_signature,

                ceo.username AS ceo_name,
                ceo.signature AS ceo_signature

            FROM requisitions r

            LEFT JOIN departments d
                ON d.department_id = r.department_id

            LEFT JOIN users u
                ON u.user_id = r.user_id

            LEFT JOIN approvals a
                ON a.module_name = 'PRS'
               AND a.document_id = r.requisition_id

            LEFT JOIN users hod
                ON hod.user_id = a.hod_user_id

            LEFT JOIN users ceo
                ON ceo.user_id = a.ceo_user_id

            WHERE r.requisition_id = %s

        """, (req_id,))

        requisition = cursor.fetchone()

        if not requisition:
            return jsonify({
                "success": False,
                "message": "Requisition not found"
            }), 404

        # =====================================
        # ITEMS
        # =====================================
        cursor.execute("""
            SELECT
                material_name,
                description,
                uom,
                qty_stock,
                qty_required,
                required_date,
                remark
            FROM requisition_items
            WHERE requisition_id = %s
        """, (req_id,))

        items = cursor.fetchall()

        return jsonify({
            "success": True,
            "requisition": requisition,
            "items": items
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()




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


# quotation request form page


@procurement_dashboard_bp.route("/create_rfq")
def create_rfq():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT requisition_id, prs_no
        FROM requisitions
    """)
    requisitions = cursor.fetchall()

    cursor.execute("""
        SELECT supplier_id, supplier_name
        FROM suppliers
    """)
    suppliers = cursor.fetchall()

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
        users=users,
        created_by=session.get("username")
    )
@procurement_dashboard_bp.route("/save_qrf", methods=["POST"])
def save_qrf():

    conn = None
    cursor = None

    try:

        # ==========================
        # RECEIVE JSON
        # ==========================
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No JSON data received"
            }), 400

        qrf_no = data.get("qrf_no")

        # FORCE logged-in user (correct approach)
        requested_by = session.get("user_id")

        submission_date = data.get("submission_date")
        requisition_id = data.get("requisition_id")
        supplier_id = data.get("supplier_id")
        items = data.get("items", [])

        # ==========================
        # VALIDATION
        # ==========================
        if not qrf_no:
            return jsonify({"success": False, "message": "QRF Number required"}), 400

        if not requested_by:
            return jsonify({"success": False, "message": "User not logged in"}), 400

        if not requisition_id:
            return jsonify({"success": False, "message": "Requisition required"}), 400

        if not supplier_id:
            return jsonify({"success": False, "message": "Supplier required"}), 400

        if len(items) == 0:
            return jsonify({"success": False, "message": "No items added"}), 400

        # ==========================
        # DB CONNECTION
        # ==========================
        conn = get_db_connection()
        cursor = conn.cursor()

        # ==========================
        # CHECK DUPLICATE QRF
        # ==========================
        cursor.execute("""
            SELECT qrf_id
            FROM quotation_requests
            WHERE qrf_no = %s
        """, (qrf_no,))

        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "QRF already exists"
            }), 400

        # ==========================
        # INSERT HEADER
        # ==========================
        cursor.execute("""
            INSERT INTO quotation_requests (
                qrf_no,
                requisition_id,
                requested_by,
                request_date,
                status
            )
            VALUES (%s,%s,%s,%s,%s)
        """, (
            qrf_no,
            requisition_id,
            requested_by,
            submission_date,
            "PENDING"
        ))

        qrf_id = cursor.lastrowid

        # ==========================
        # INSERT SUPPLIER
        # ==========================
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

        # ==========================
        # INSERT ITEMS (WITH UOM FIX)
        # ==========================
        for item in items:

            cursor.execute("""
                INSERT INTO quotation_request_items (
                    qrf_id,
                    material_name,
                    description,
                    quantity,
                    uom
                )
                VALUES (%s,%s,%s,%s,%s)
            """, (
                qrf_id,
                item.get("item"),
                item.get("description", ""),
                item.get("qty", 0),
                item.get("uom", "")   # ✅ IMPORTANT FIX
            ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "QRF created successfully",
            "qrf_id": qrf_id,
            "qrf_no": qrf_no,
            "redirect": url_for("procurement_dashboard.procurement_dashboard")
        })

    except Exception as e:

        if conn:
            conn.rollback()

        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================
# QUOTATION PAGE (GET)
# =========================
@procurement_dashboard_bp.route("/Quotation_entry", methods=["GET"])
def enterQuotation():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT qrf_id, qrf_no
        FROM quotation_requests
        ORDER BY qrf_id DESC
    """)

    qrfs = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("quotations_entry.html", qrfs=qrfs)


# =========================
# GET QRF DETAILS
# =========================
@procurement_dashboard_bp.route("/get_qrf_details/<int:qrf_id>")
def get_qrf_details(qrf_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            s.supplier_id,
            s.supplier_name
        FROM quotation_request_suppliers qrs
        INNER JOIN suppliers s
            ON qrs.supplier_id = s.supplier_id
        WHERE qrs.qrf_id = %s
        LIMIT 1
    """, (qrf_id,))

    supplier = cursor.fetchone()

    cursor.execute("""
        SELECT
            material_name,
            description,
            quantity
        FROM quotation_request_items
        WHERE qrf_id = %s
    """, (qrf_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "supplier_id": supplier["supplier_id"] if supplier else "",
        "supplier_name": supplier["supplier_name"] if supplier else "",
        "items": items
    })


# =========================
# SAVE QUOTATION (POST)
# =========================
@procurement_dashboard_bp.route("/Quotation_entry", methods=["POST"])
def save_quotation():

    conn = None
    cursor = None

    try:
        data = request.get_json()

        qrf_id = data.get("qrf_id")
        supplier_id = data.get("supplier_id")
        payment_terms = data.get("payment_terms")
        warranty = data.get("warranty")
        items = data.get("items", [])
        delivery_date = data.get("delivery_date")

        # =========================
        # VALIDATION
        # =========================
        if not qrf_id:
            return jsonify({"success": False, "message": "QRF is required"}), 400

        if not supplier_id:
            return jsonify({"success": False, "message": "Supplier is required"}), 400

        if not delivery_date:
            return jsonify({"success": False, "message": "Delivery date is required"}), 400

        if not items:
            return jsonify({"success": False, "message": "Add at least one item"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # =========================
        # GENERATE QUOTATION NO
        # =========================
        cursor.execute("""
            SELECT quotation_no
            FROM quotations
            ORDER BY quotation_id DESC
            LIMIT 1
        """)

        last_record = cursor.fetchone()

        if last_record and last_record[0]:
            try:
                last_no = last_record[0]
                number = int(last_no.split("/")[-1]) + 1
            except:
                number = 1
        else:
            number = 1

        quotation_no = f"QT/{datetime.now().year}/{number:04d}"

        # =========================
        # TOTAL AMOUNT
        # =========================
        total_amount = sum(
            float(i.get("quantity", 0)) * float(i.get("unit_price", 0))
            for i in items
        )

        quotation_date = datetime.now()

        # =========================
        # INSERT QUOTATION HEADER
        # =========================
        cursor.execute("""
            INSERT INTO quotations (
                qrf_id,
                supplier_id,
                quotation_no,
                quotation_date,
                total_amount,
                delivery_date,
                payment_terms,
                warranty,
                status
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            qrf_id,
            supplier_id,
            quotation_no,
            quotation_date,
            total_amount,
            delivery_date,
            payment_terms,
            warranty,
            "PENDING"
        ))

        quotation_id = cursor.lastrowid

        # =========================
        # INSERT ITEMS
        # =========================
        for item in items:
            cursor.execute("""
                INSERT INTO quotation_records_items (
                    quotation_id,
                    item_name,
                    description,
                    quantity,
                    unit_price
                )
                VALUES (%s,%s,%s,%s,%s)
            """, (
                quotation_id,
                item.get("item_name"),
                item.get("description"),
                item.get("quantity"),
                item.get("unit_price")
            ))

        # =========================
        # UPDATE QRF SUPPLIER STATUS
        # =========================
        cursor.execute("""
            UPDATE quotation_request_suppliers
            SET supplier_response = 'RESPONDED',
                quotation_id = %s
            WHERE qrf_id = %s
            AND supplier_id = %s
        """, (
            quotation_id,
            qrf_id,
            supplier_id
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Quotation saved successfully",
            "quotation_no": quotation_no,
            "quotation_id": quotation_id,
            "redirect": url_for("procurement_dashboard.procurement_dashboard")
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
# =========================
# COMPARE SUPPLIERS PAGE

@procurement_dashboard_bp.route("/compare_suppliers")
def compare_suppliers():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT requisition_id, prs_no
        FROM requisitions
        ORDER BY requisition_id DESC
    """)

    requisitions = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("compare_supplier.html", requisitions=requisitions)



@procurement_dashboard_bp.route("/get_prs_quotations/<int:prs_id>")
def get_prs_quotations(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
    q.supplier_id,
    q.quotation_id,
    q.quotation_no,
    q.total_amount,
    q.delivery_date,
    q.warranty,
    s.supplier_name
FROM quotations q
JOIN quotation_requests qr
    ON q.qrf_id = qr.qrf_id
JOIN suppliers s
    ON q.supplier_id = s.supplier_id
WHERE qr.requisition_id = %s
ORDER BY q.total_amount ASC
        """, (prs_id,))

        data = cursor.fetchall()

        return jsonify({
            "status": "success",
            "data": data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()
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
            q.delivery_date,
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
        "qrf_id": q["qrf_id"],
        "quotation_no": q["quotation_no"],
        "supplier_name": q["supplier_name"],
        "total_amount": q["total_amount"],
        "delivery_date": q["delivery_date"],
        "warranty": q["warranty"]
    })
@procurement_dashboard_bp.route("/get_quotation_items/<int:quotation_id>")
def get_quotation_items(quotation_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            item_name,
            description,
            quantity,
            unit_price
        FROM quotation_records_items
        WHERE quotation_id = %s
    """, (quotation_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(items)


@procurement_dashboard_bp.route("/save_best_supplier", methods=["POST"])
def save_best_supplier():

    data = request.get_json()

    quotation_id = data.get("quotation_id")

    if not quotation_id:
        return jsonify({
            "success": False,
            "message": "Quotation ID is required."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # Get QRF ID of the selected quotation
        cursor.execute("""
            SELECT qrf_id
            FROM quotations
            WHERE quotation_id = %s
        """, (quotation_id,))

        quotation = cursor.fetchone()

        if not quotation:
            return jsonify({
                "success": False,
                "message": "Quotation not found."
            }), 404

        qrf_id = quotation["qrf_id"]

        # Reset all suppliers to NO
        cursor.execute("""
            UPDATE quotation_request_suppliers
            SET selected_supplier = 'NO'
            WHERE qrf_id = %s
        """, (qrf_id,))

        # Set the selected supplier to YES
        cursor.execute("""
            UPDATE quotation_request_suppliers
            SET selected_supplier = 'YES'
            WHERE quotation_id = %s
        """, (quotation_id,))

        # Update quotation statuses
        cursor.execute("""
            UPDATE quotations
            SET status = 'REJECTED'
            WHERE qrf_id = %s
        """, (qrf_id,))

        cursor.execute("""
            UPDATE quotations
            SET status = 'SELECTED'
            WHERE quotation_id = %s
        """, (quotation_id,))

        conn.commit()


        return jsonify({
            "success": True,
            "message": "Best supplier saved successfully.",
            "redirect_url": "/procurement/create_po"
            
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

@procurement_dashboard_bp.route("/validate_quotation/<int:quotation_id>/<int:prs_id>")
def validate_quotation(quotation_id, prs_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*)
        FROM quotations q
        JOIN quotation_requests qr ON q.qrf_id = qr.qrf_id
        WHERE q.quotation_id = %s
        AND qr.requisition_id = %s
    """, (quotation_id, prs_id))

    valid = cursor.fetchone()[0] > 0

    cursor.close()
    conn.close()

    return jsonify({"valid": valid})

# PO STARTS HERE

# ==================================================
# PO STARTS HERE
# ==================================================

from flask import request, jsonify, render_template
from datetime import datetime


# ==================================================
# CREATE PO PAGE
# ==================================================
@procurement_dashboard_bp.route("/create_po")
def create_po_page():
    return render_template("create_PO.html")


# ==================================================
# GET PRS LIST
# ==================================================
@procurement_dashboard_bp.route("/get_prs_list")
def get_prs_list():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT requisition_id, prs_no
            FROM requisitions
            ORDER BY requisition_id DESC
        """)

        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET USERS
# ==================================================
@procurement_dashboard_bp.route("/get_users")
def get_users():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id, username
            FROM users
        """)

        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET SELECTED SUPPLIER
# ==================================================
@procurement_dashboard_bp.route("/get_selected_supplier/<int:prs_id>")
def get_selected_supplier(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                s.supplier_id,
                s.supplier_name,
                qrs.quotation_id,
                q.quotation_no
            FROM quotation_request_suppliers qrs
            JOIN suppliers s
                ON s.supplier_id = qrs.supplier_id
            JOIN quotations q
                ON q.quotation_id = qrs.quotation_id
            JOIN quotation_requests qr
                ON qr.qrf_id = qrs.qrf_id
            WHERE qr.requisition_id = %s
            AND LOWER(qrs.selected_supplier) = 'yes'
            LIMIT 1
        """, (prs_id,))

        return jsonify(cursor.fetchone())

    finally:
        cursor.close()
        conn.close()



@procurement_dashboard_bp.route("/create_po_from_selected", methods=["POST"])
def create_po_from_selected():

    data = request.get_json()
    quotation_id = data.get("quotation_id")

    if not quotation_id:
        return jsonify({
            "success": False,
            "message": "Quotation ID is required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ==================================================
        # CHECK IF PO ALREADY EXISTS
        # ==================================================
        cursor.execute("""
            SELECT purchase_order_id
            FROM purchase_orders
            WHERE quotation_id = %s
        """, (quotation_id,))

        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Purchase Order already exists"
            }), 409

        # ==================================================
        # FIND QRF AND REQUISITION FOR THIS QUOTATION
        # ==================================================
        cursor.execute("""
            SELECT
                q.qrf_id,
                qr.requisition_id
            FROM quotations q
            JOIN quotation_requests qr
                ON qr.qrf_id = q.qrf_id
            WHERE q.quotation_id = %s
        """, (quotation_id,))

        quotation_row = cursor.fetchone()

        if not quotation_row:
            return jsonify({
                "success": False,
                "message": "Quotation not found"
            }), 404

        qrf_id = quotation_row["qrf_id"]
        requisition_id = quotation_row["requisition_id"]

        # ==================================================
        # MARK THIS QUOTATION AS THE SELECTED SUPPLIER
        # ==================================================
        cursor.execute("""
            UPDATE quotation_request_suppliers
            SET selected_supplier = 'NO'
            WHERE qrf_id = %s
        """, (qrf_id,))

        cursor.execute("""
            UPDATE quotation_request_suppliers
            SET selected_supplier = 'YES'
            WHERE quotation_id = %s
        """, (quotation_id,))

        # ==================================================
        # GET SUPPLIER DETAILS
        # ==================================================
        cursor.execute("""
            SELECT
                qrs.supplier_id,
                s.supplier_name,
                q.quotation_no
            FROM quotation_request_suppliers qrs
            JOIN suppliers s ON s.supplier_id = qrs.supplier_id
            JOIN quotations q ON q.quotation_id = qrs.quotation_id
            WHERE qrs.qrf_id = %s
            AND qrs.quotation_id = %s
            AND LOWER(qrs.selected_supplier) = 'yes'
            LIMIT 1
        """, (qrf_id, quotation_id))

        supplier = cursor.fetchone()

        if not supplier:
            return jsonify({
                "success": False,
                "message": "Supplier not found"
            }), 404

        supplier_id = supplier["supplier_id"]
        supplier_name = supplier["supplier_name"]
        quotation_no = supplier["quotation_no"]

        # ==================================================
        # GET ITEMS
        # ==================================================
        cursor.execute("""
            SELECT item_name, description, quantity, unit_price
            FROM quotation_records_items
            WHERE quotation_id = %s
        """, (quotation_id,))

        items = cursor.fetchall()

        if not items:
            return jsonify({
                "success": False,
                "message": "No quotation items found"
            }), 404

        # ==================================================
        # CALCULATE TOTAL
        # ==================================================
        total_amount = sum(
            float(i["quantity"] or 0) * float(i["unit_price"] or 0)
            for i in items
        )

        # ==================================================
        # GENERATE SEQUENTIAL PO NUMBER (0001, 0002...)
        # ==================================================
        cursor.execute("""
            SELECT po_number
            FROM purchase_orders
            ORDER BY purchase_order_id DESC
            LIMIT 1
        """)

        last_po = cursor.fetchone()

        if last_po and last_po["po_number"]:
            try:
                last_number = int(last_po["po_number"])
            except:
                last_number = 0
            next_number = last_number + 1
        else:
            next_number = 1

        po_number = str(next_number).zfill(4)   # 0001 format

        # ==================================================
        # INSERT PO HEADER
        # ==================================================
        cursor.execute("""
            INSERT INTO purchase_orders(
                requisition_id,
                quotation_id,
                supplier_id,
                po_number,
                order_date,
                total_amount,
                status
            )
            VALUES(%s,%s,%s,%s,%s,%s,%s)
        """, (
            requisition_id,
            quotation_id,
            supplier_id,
            po_number,
            datetime.now(),
            total_amount,
            "PENDING"
        ))

        po_id = cursor.lastrowid

        # ==================================================
        # INSERT PO ITEMS
        # ==================================================
        for item in items:
            cursor.execute("""
                INSERT INTO purchase_order_items(
                    purchase_order_id,
                    item_name,
                    description,
                    quantity,
                    unit_price
                )
                VALUES(%s,%s,%s,%s,%s)
            """, (
                po_id,
                item["item_name"],
                item["description"],
                item["quantity"],
                item["unit_price"]
            ))

        # ==================================================
        # COMMIT ONLY AFTER SUCCESS
        # ==================================================
        conn.commit()

        return jsonify({
            "success": True,
            "po_id": po_id,
            "po_number": po_number,
            "quotation_no": quotation_no,
            "quotation_id": quotation_id,
            "supplier_id": supplier_id,
            "supplier_name": supplier_name
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

# ==================================================
# GET PRS QUOTATIONS
# ==================================================
# ==========================================
# GET PRS QUOTATIONS FOR PO
# ==========================================
@procurement_dashboard_bp.route("/get_po_prs_quotations/<int:prs_id>")
def get_po_prs_quotations(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.quotation_no,
                s.supplier_name,
                q.total_amount,
                q.delivery_date,
                q.warranty
            FROM quotation_request_suppliers qrs
            JOIN quotation_requests qr
                ON qr.qrf_id = qrs.qrf_id
            JOIN quotations q
                ON q.quotation_id = qrs.quotation_id
            JOIN suppliers s
                ON s.supplier_id = qrs.supplier_id
            WHERE qr.requisition_id = %s
            ORDER BY q.quotation_id DESC
        """, (prs_id,))

        quotations = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": quotations
        })

    except Exception as e:

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
            po_number,supplier_id

        FROM purchase_orders

        ORDER BY purchase_order_id DESC

    """)

    pos = cursor.fetchall()


    


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

    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================
        # HEADER DATA
        # =====================================
        grn_no = request.form["grn_no"]

        po_id = request.form["po_id"]

        received_by = session.get("user_id")

        if not received_by:
            flash("User not logged in", "danger")
            return redirect("/procurement/create_grn")

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
        # LOAD PO HEADER
        # =====================================
        cursor.execute("""
    SELECT
        po.supplier_id,
        s.supplier_name,
        po.requisition_id
    FROM purchase_orders po
    INNER JOIN suppliers s
        ON po.supplier_id = s.supplier_id
    WHERE po.purchase_order_id = %s
    LIMIT 1
""", (po_id,))



        po = cursor.fetchone()

        if not po:
            return redirect("/procurement/create_grn")

        supplier_id = po["supplier_id"]
        supplier_name = po["supplier_name"]
        requisition_id = po["requisition_id"]


        # =====================================
        # LOAD PO ITEMS
        # =====================================
        cursor.execute("""
            SELECT
                item_name,
                description,
                quantity
            FROM purchase_order_items
            WHERE purchase_order_id = %s
            ORDER BY po_item_id ASC
        """, (po_id,))

        po_items = cursor.fetchall()

        if not po_items:
            return redirect("/procurement/create_grn")


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
        for i, po_item in enumerate(po_items):

            received_qty = qty_received[i] if i < len(qty_received) else 0
            rejected_qty = qty_rejected[i] if i < len(qty_rejected) else 0
            remark_value = remarks[i] if i < len(remarks) else ""

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
                po_item[0],
                po_item[1],
                po_item[2],
                received_qty,
                rejected_qty,
                remark_value

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
            url_for("procurement_dashboard.procurement_dashboard")
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
            po.supplier_id,
            s.supplier_name
        FROM purchase_orders po
        LEFT JOIN suppliers s
            ON s.supplier_id = po.supplier_id
        WHERE po.purchase_order_id = %s
        LIMIT 1
    """, (po_id,))

    po = cursor.fetchone()

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

    return jsonify({
        "supplier_id": po["supplier_id"] if po else "",
        "supplier_name": po["supplier_name"] if po else "",
        "items": items
    })


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

        return redirect(url_for("finance_dashboard.dashboard"))

    except Exception as e:
        conn.rollback()
        return str(e)

    finally:
        cursor.close()
        conn.close()