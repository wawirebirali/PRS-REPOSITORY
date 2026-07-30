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
@procurement_dashboard_bp.route(
    "/api/quotation-request/<int:qrf_id>",
    methods=["GET"]
)
def get_quotation_request_details(qrf_id):

    conn = None
    cursor = None

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ==========================================
        # LOAD QRF
        # ==========================================

        cursor.execute("""
            SELECT
                qrf_id,
                qrf_no,
                requisition_id,
                request_date,
                deadline_date,
                status,
                remarks
            FROM quotation_requests
            WHERE qrf_id = %s
        """, (qrf_id,))

        qrf = cursor.fetchone()

        if not qrf:

            return jsonify({
                "success": False,
                "message": "Quotation Request not found."
            }), 404


        # ==========================================
        # LOAD SUPPLIERS ATTACHED TO QRF
        # ==========================================

        cursor.execute("""
            SELECT
                qrs.id,
                qrs.supplier_id,
                s.supplier_name,
                qrs.supplier_response,
                qrs.selected_supplier
            FROM quotation_request_suppliers qrs
            JOIN suppliers s
                ON qrs.supplier_id = s.supplier_id
            WHERE qrs.qrf_id = %s
            ORDER BY s.supplier_name ASC
        """, (qrf_id,))

        suppliers = cursor.fetchall()


        # ==========================================
        # LOAD QRF ITEMS
        # ==========================================

        cursor.execute("""
            SELECT
                *
            FROM quotation_request_items
            WHERE qrf_id = %s
        """, (qrf_id,))

        items = cursor.fetchall()


        return jsonify({

            "success": True,

            "qrf": qrf,

            "suppliers": suppliers,

            "items": items

        })


    except Exception as e:

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
# SAVE QUOTATION (POST)
# ==========================================================
# SAVE QUOTATION
# ==========================================================
@procurement_dashboard_bp.route(
    "/api/quotation/save",
    methods=["POST"]
)
def save_quotation():

    conn = None
    cursor = None

    try:

        # ==============================================
        # GET JSON DATA
        # ==============================================

        data = request.get_json(
            silent=True
        )

        print(
            "RECEIVED QUOTATION DATA:",
            data
        )


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No quotation data received."

            }), 400


        # ==============================================
        # GET DATA
        # ==============================================

        qrf_id = data.get(
            "qrf_id"
        )

        supplier_id = data.get(
            "supplier_id"
        )

        delivery_date = data.get(
            "delivery_date"
        )

        payment_terms = data.get(
            "payment_terms"
        )

        warranty = data.get(
            "warranty"
        )

        total_amount = data.get(
            "total_amount",
            0
        )

        items = data.get(
            "items",
            []
        )


        # ==============================================
        # VALIDATE HEADER
        # ==============================================

        if not qrf_id:

            return jsonify({

                "success": False,

                "message":
                    "QRF is required."

            }), 400


        if not supplier_id:

            return jsonify({

                "success": False,

                "message":
                    "Supplier is required."

            }), 400


        # ==============================================
        # VALIDATE ITEMS
        # ==============================================

        if not items:

            return jsonify({

                "success": False,

                "message":
                    "Add at least one item."

            }), 400


        # ==============================================
        # GET LOGGED-IN USER
        # ==============================================

        created_by = session.get(
            "user_id"
        )


        if not created_by:

            return jsonify({

                "success": False,

                "message":
                    "User session not found."

            }), 401


        # ==============================================
        # DATABASE CONNECTION
        # ==============================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ==============================================
        # GENERATE QUOTATION NUMBER
        # ==============================================

        cursor.execute("""
            SELECT
                COUNT(*) AS total
            FROM quotations
        """)

        result = cursor.fetchone()

        quotation_count = (
            result["total"] or 0
        ) + 1


        quotation_no = (
            f"QT/"
            f"{datetime.now().year}/"
            f"{quotation_count:04d}"
        )


        # ==============================================
        # INSERT QUOTATION HEADER
        # ==============================================

        cursor.execute("""

            INSERT INTO quotations (

                qrf_id,
                supplier_id,
                quotation_no,
                quotation_date,
                total_amount,
                warranty,
                payment_terms,
                status,
                delivery_date,
                created_by

            )

            VALUES (

                %s,
                %s,
                %s,
                CURDATE(),
                %s,
                %s,
                %s,
                'PENDING',
                %s,
                %s

            )

        """, (

            qrf_id,
            supplier_id,
            quotation_no,
            total_amount,
            warranty,
            payment_terms,
            delivery_date,
            created_by

        ))


        # ==============================================
        # GET QUOTATION ID
        # ==============================================

        quotation_id = cursor.lastrowid


        # ==============================================
        # INSERT QUOTATION ITEMS
        # ==============================================

        for item in items:

            item_name = item.get(
                "item_name"
            )

            description = item.get(
                "description"
            )

            quantity = item.get(
                "quantity",
                0
            )

            unit_price = item.get(
                "unit_price",
                0
            )


            # ------------------------------------------
            # UOM
            # ------------------------------------------

            uom = item.get(
                "uom"
            )


            # ------------------------------------------
            # VALIDATE ITEM
            # ------------------------------------------

            if not item_name:

                continue


            # ------------------------------------------
            # INSERT ITEM
            # ------------------------------------------

            cursor.execute("""

                INSERT INTO quotation_records_items (

                    quotation_id,
                    item_name,
                    description,
                    quantity,
                    uom,
                    unit_price

                )

                VALUES (

                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s

                )

            """, (

                quotation_id,
                item_name,
                description,
                quantity,
                uom,
                unit_price

            ))


        # ==============================================
        # COMMIT
        # ==============================================

        conn.commit()


        # ==============================================
        # CLOSE
        # ==============================================

        cursor.close()

        conn.close()


        # ==============================================
        # RETURN SUCCESS
        # ==============================================

        return jsonify({

            "success": True,

            "message":
                "Quotation saved successfully.",

            "quotation_id":
                quotation_id,

            "quotation_no":
                quotation_no

        }), 201


    except Exception as e:

        # ==============================================
        # ROLLBACK
        # ==============================================

        if conn:

            conn.rollback()


        if cursor:

            cursor.close()


        if conn:

            conn.close()


        print(
            "SAVE QUOTATION ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500

    
@procurement_dashboard_bp.route("/api/next-quotation-number")
def next_quotation_number():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        current_year = datetime.now().year

        cursor.execute("""
            SELECT quotation_no
            FROM quotations
            WHERE quotation_no LIKE %s
            ORDER BY quotation_id DESC
            LIMIT 1
        """, (
            f"QT/{current_year}/%",
        ))

        result = cursor.fetchone()

        if result and result["quotation_no"]:

            # Example:
            # QT/2026/005

            last_number = int(
                result["quotation_no"].split("/")[-1]
            )

            next_number = last_number + 1

        else:

            next_number = 1


        quotation_no = (
            f"QT/"
            f"{current_year}/"
            f"{next_number:03d}"
        )


        return {
            "success": True,
            "quotation_no": quotation_no
        }


    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }, 500


    finally:

        cursor.close()
        conn.close()

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






# ============================================================
# PURCHASE ORDER / QUOTATION WORKFLOW
# ============================================================


# ============================================================
# 1. GET PRS LIST FOR PO FORM
# ============================================================

@procurement_dashboard_bp.route("/get_prs_list", methods=["GET"])
def get_prs_list():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                requisition_id,
                prs_no
            FROM requisitions
            ORDER BY requisition_id DESC
        """)

        prs_list = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": prs_list
        })

    except Exception as e:

        print("Error loading PRS list:", e)

        return jsonify({
            "success": False,
            "message": str(e),
            "data": []
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# 2. GET ALL QUOTATIONS FOR SELECTED PRS
# ============================================================

@procurement_dashboard_bp.route(
    "/get_po_prs_quotations/<int:prs_id>",
    methods=["GET"]
)
def get_po_prs_quotations(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.quotation_no,
                q.quotation_date,
                q.total_amount,
                q.delivery_date,
                q.warranty,
                q.payment_terms,
                q.status,

                s.supplier_id,
                s.supplier_name,
                s.address,
                s.phone,

                qr.qrf_id,
                qr.qrf_no,
                qr.requisition_id

            FROM quotations q

            INNER JOIN quotation_requests qr
                ON q.qrf_id = qr.qrf_id

            INNER JOIN suppliers s
                ON q.supplier_id = s.supplier_id

            WHERE qr.requisition_id = %s

            ORDER BY q.total_amount ASC,
                     q.quotation_id DESC

        """, (prs_id,))

        quotations = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": quotations
        })

    except Exception as e:

        print(
            "Error loading PO quotations:",
            e
        )

        return jsonify({
            "success": False,
            "message": str(e),
            "data": []
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# 3. SAVE SELECTED / APPROVED QUOTATION
# ============================================================

@procurement_dashboard_bp.route(
    "/save_best_supplier",
    methods=["POST"]
)
def save_best_supplier():

    data = request.get_json() or {}

    quotation_id = data.get("quotation_id")

    if not quotation_id:

        return jsonify({
            "success": False,
            "message": "Quotation ID is required."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================================
        # GET QUOTATION DETAILS
        # =====================================================

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.qrf_id,
                q.supplier_id,
                qr.requisition_id

            FROM quotations q

            INNER JOIN quotation_requests qr
                ON q.qrf_id = qr.qrf_id

            WHERE q.quotation_id = %s

        """, (quotation_id,))

        quotation = cursor.fetchone()

        if not quotation:

            return jsonify({
                "success": False,
                "message": "Quotation not found."
            }), 404


        qrf_id = quotation["qrf_id"]


        # =====================================================
        # RESET ALL SUPPLIERS FOR THIS QRF
        # =====================================================

        cursor.execute("""
            UPDATE quotation_request_suppliers

            SET selected_supplier = 'NO'

            WHERE qrf_id = %s
        """, (qrf_id,))


        # =====================================================
        # SELECT SUPPLIER FOR THIS QUOTATION
        # =====================================================

        cursor.execute("""
            UPDATE quotation_request_suppliers

            SET selected_supplier = 'YES'

            WHERE qrf_id = %s
            AND quotation_id = %s
        """, (
            qrf_id,
            quotation_id
        ))


        # =====================================================
        # RESET QUOTATION STATUS
        # =====================================================

        cursor.execute("""
            UPDATE quotations

            SET status = 'REJECTED'

            WHERE qrf_id = %s
        """, (qrf_id,))


        # =====================================================
        # MARK SELECTED QUOTATION
        # =====================================================

        cursor.execute("""
            UPDATE quotations

            SET status = 'SELECTED'

            WHERE quotation_id = %s
        """, (quotation_id,))


        conn.commit()


        return jsonify({

            "success": True,

            "message":
                "Quotation selected successfully.",

            "quotation_id":
                quotation_id,

            "qrf_id":
                qrf_id,

            "requisition_id":
                quotation["requisition_id"]

        })


    except Exception as e:

        conn.rollback()

        print(
            "Error selecting quotation:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        cursor.close()
        conn.close()


# ============================================================
# 4. GET SELECTED QUOTATION FOR PRS
# ============================================================

@procurement_dashboard_bp.route(
    "/get_selected_quotation/<int:prs_id>",
    methods=["GET"]
)
def get_selected_quotation(prs_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT

                q.quotation_id,
                q.quotation_no,
                q.quotation_date,
                q.total_amount,
                q.delivery_date,
                q.warranty,
                q.payment_terms,
                q.status,

                s.supplier_id,
                s.supplier_name,

                qr.qrf_id,
                qr.qrf_no,
                qr.requisition_id

            FROM quotations q

            INNER JOIN quotation_requests qr
                ON q.qrf_id = qr.qrf_id

            INNER JOIN suppliers s
                ON q.supplier_id = s.supplier_id

            WHERE qr.requisition_id = %s

            AND q.status = 'SELECTED'

            LIMIT 1

        """, (prs_id,))

        quotation = cursor.fetchone()

        if not quotation:

            return jsonify({

                "success": False,

                "message":
                    "No approved quotation found."

            }), 404


        return jsonify({

            "success": True,

            "data": quotation

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


    finally:

        cursor.close()
        conn.close()


# ============================================================
# GET NEXT PURCHASE ORDER NUMBER
# FORMAT: PO/YEAR/0001
# ============================================================

@procurement_dashboard_bp.route(
    "/api/next-po-number",
    methods=["GET"]
)
def next_po_number():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ====================================================
        # CURRENT YEAR
        # ====================================================

        current_year = datetime.now().year


        # ====================================================
        # GET LAST PO FOR CURRENT YEAR
        # ====================================================

        cursor.execute("""
            SELECT po_number
            FROM purchase_orders
            WHERE po_number LIKE %s
            ORDER BY purchase_order_id DESC
            LIMIT 1
        """, (
            f"PO/{current_year}/%",
        ))

        last_po = cursor.fetchone()


        # ====================================================
        # GENERATE NEXT SEQUENCE
        # ====================================================

        if last_po and last_po.get("po_number"):

            last_po_number = str(
                last_po["po_number"]
            ).strip()


            try:

                # Example:
                # PO/2026/0001
                #
                # Split:
                # ["PO", "2026", "0001"]

                parts = last_po_number.split("/")


                if (
                    len(parts) == 3 and
                    parts[0] == "PO"
                ):

                    last_number = int(
                        parts[2]
                    )

                else:

                    last_number = 0


            except (
                ValueError,
                IndexError
            ):

                last_number = 0

        else:

            last_number = 0


        # ====================================================
        # NEXT NUMBER
        # ====================================================

        next_number = (
            last_number + 1
        )


        # ====================================================
        # FINAL PO NUMBER
        # ====================================================

        po_number = (
            f"PO/{current_year}/"
            f"{next_number:04d}"
        )


        return jsonify({

            "success":
                True,

            "po_number":
                po_number

        })


    except Exception as e:

        print(
            "Error generating next PO number:",
            e
        )


        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500


    finally:

        cursor.close()
        conn.close()




# ==========================================================
# GET SINGLE QUOTATION FOR PURCHASE ORDER
# API NAME:
# /procurement/api/quotation-for-po/<quotation_id>
# ==========================================================
# ==========================================================
# GET SINGLE QUOTATION FOR PURCHASE ORDER
# UNIQUE API NAME:
# /procurement/api/quotation-for-po/<quotation_id>
# ==========================================================

@procurement_dashboard_bp.route(
    "/api/quotation-for-po/<int:quotation_id>",
    methods=["GET"]
)
def get_quotation_for_po_details(quotation_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ==================================================
        # GET QUOTATION HEADER
        # ==================================================

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.qrf_id,
                q.supplier_id,
                q.quotation_no,
                q.quotation_date,
                q.total_amount,
                q.delivery_date,
                q.warranty,
                q.payment_terms,
                q.status,

                s.supplier_name,

                qr.qrf_no,
                qr.requisition_id,

                r.prs_no,
                r.department_id,

                d.department_name

            FROM quotations q

            INNER JOIN suppliers s
                ON s.supplier_id = q.supplier_id

            INNER JOIN quotation_requests qr
                ON qr.qrf_id = q.qrf_id

            INNER JOIN requisitions r
                ON r.requisition_id = qr.requisition_id

            LEFT JOIN departments d
                ON d.department_id = r.department_id

            WHERE q.quotation_id = %s

            LIMIT 1
        """, (quotation_id,))

        quotation = cursor.fetchone()

        # ==================================================
        # CHECK QUOTATION
        # ==================================================

        if not quotation:

            return jsonify({
                "success": False,
                "message": "Quotation not found."
            }), 404


        # ==================================================
        # GET QUOTATION ITEMS
        # ==================================================

        cursor.execute("""
            SELECT
                item_id,
                quotation_id,
                item_name,
                description,
                quantity,
                unit_price,
                amount

            FROM quotation_records_items

            WHERE quotation_id = %s

            ORDER BY item_id ASC
        """, (quotation_id,))

        items = cursor.fetchall()


        # ==================================================
        # RETURN DATA
        # ==================================================

        return jsonify({

            "success": True,

            "quotation": quotation,

            "items": items

        }), 200


    except Exception as e:

        print(
            "ERROR GETTING QUOTATION FOR PO:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load quotation for Purchase Order.",

            "error":
                str(e)

        }), 500


    finally:

        cursor.close()
        conn.close()




# ==========================================================
# CREATE PURCHASE ORDER FROM SELECTED QUOTATION
# ==========================================================

@procurement_dashboard_bp.route(
    "/create_po_from_selected",
    methods=["POST"]
)
def create_po_from_selected():

    data = request.get_json(silent=True) or {}

    quotation_id = data.get("quotation_id")

    prs_id = data.get("prs_id")


    # ======================================================
    # VALIDATE INPUT
    # ======================================================

    if not quotation_id:

        return jsonify({
            "success": False,
            "message": "Quotation ID is required."
        }), 400


    if not prs_id:

        return jsonify({
            "success": False,
            "message": "PRS ID is required."
        }), 400


    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)


    try:

        # ==================================================
        # CHECK IF PURCHASE ORDER ALREADY EXISTS
        # ==================================================

        cursor.execute("""
            SELECT
                purchase_order_id,
                po_number

            FROM purchase_orders

            WHERE quotation_id = %s

            LIMIT 1

        """, (quotation_id,))


        existing_po = cursor.fetchone()


        if existing_po:

            return jsonify({

                "success": False,

                "message":
                    f"Purchase Order {existing_po['po_number']} "
                    f"already exists for this quotation.",

                "po_id":
                    existing_po["purchase_order_id"],

                "po_number":
                    existing_po["po_number"]

            }), 409


        # ==================================================
        # GET QUOTATION
        # ==================================================

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.qrf_id,
                q.supplier_id,
                q.quotation_no,
                q.total_amount,
                q.status,

                qr.requisition_id,

                s.supplier_name

            FROM quotations q

            INNER JOIN quotation_requests qr
                ON qr.qrf_id = q.qrf_id

            INNER JOIN suppliers s
                ON s.supplier_id = q.supplier_id

            WHERE q.quotation_id = %s

            LIMIT 1

        """, (quotation_id,))


        quotation = cursor.fetchone()


        if not quotation:

            return jsonify({

                "success": False,

                "message":
                    "Quotation not found."

            }), 404


        # ==================================================
        # VERIFY PRS MATCHES QUOTATION
        # ==================================================

        if int(
            quotation["requisition_id"]
        ) != int(prs_id):

            return jsonify({

                "success": False,

                "message":
                    "The selected quotation does not belong "
                    "to the selected PRS."

            }), 400


        requisition_id = quotation["requisition_id"]


        supplier_id = quotation["supplier_id"]


        supplier_name = quotation["supplier_name"]


        quotation_no = quotation["quotation_no"]


        # ==================================================
        # GET QUOTATION ITEMS
        # ==================================================

        cursor.execute("""
            SELECT
                item_name,
                description,
                quantity,
                unit_price

            FROM quotation_records_items

            WHERE quotation_id = %s

            ORDER BY item_id ASC

        """, (quotation_id,))


        items = cursor.fetchall()


        if not items:

            return jsonify({

                "success": False,

                "message":
                    "No quotation items found."

            }), 404


        # ==================================================
        # CALCULATE TOTAL
        # ==================================================

        total_amount = 0


        for item in items:

            quantity = float(
                    item["quantity"] or 0
                )


            unit_price =float(
                    item["unit_price"] or 0
                )


            total_amount += (
                quantity *
                unit_price
            )


        # ==================================================
        # GENERATE PO NUMBER
        #
        # FORMAT:
        # PO/2026/0001
        # PO/2026/0002
        # PO/2026/0003
        # ==================================================

        current_year = datetime.now().year


        cursor.execute("""
            SELECT
                po_number

            FROM purchase_orders

            WHERE po_number LIKE %s

            ORDER BY purchase_order_id DESC

            LIMIT 1

        """, (
            f"PO/{current_year}/%",
        ))


        last_po = cursor.fetchone()


        if last_po and last_po["po_number"]:

            try:

                last_number =int(
                        last_po["po_number"]
                        .split("/")[-1]
                    )

            except (
                ValueError,
                IndexError
            ):

                last_number = 0

        else:

            last_number = 0


        next_number = last_number + 1


        po_number = f"PO/{current_year}/{next_number:04d}"


        # ==================================================
        # INSERT PURCHASE ORDER
        #
        # YOUR TABLE HAS:
        #
        # purchase_order_id
        # requisition_id
        # quotation_id
        # po_number
        # order_date
        # status
        # total_amount
        # supplier_id
        # ==================================================

        cursor.execute("""
            INSERT INTO purchase_orders (
                requisition_id,
                quotation_id,
                po_number,
                order_date,
                status,
                total_amount,
                supplier_id
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

            requisition_id,

            quotation_id,

            po_number,

            datetime.now(),

            "Pending",

            total_amount,

            supplier_id

        ))


        # ==================================================
        # GET NEW PO ID
        # ==================================================

        po_id = cursor.lastrowid


        # ==================================================
        # INSERT PURCHASE ORDER ITEMS
        # ==================================================

        for item in items:

            cursor.execute("""
                INSERT INTO purchase_order_items (
                    purchase_order_id,
                    item_name,
                    description,
                    quantity,
                    unit_price
                )

                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )

            """, (

                po_id,

                item["item_name"],

                item["description"],

                item["quantity"],

                item["unit_price"]

            ))


        # ==================================================
        # MARK SELECTED QUOTATION
        # ==================================================

        cursor.execute("""
            UPDATE quotations

            SET status = 'SELECTED'

            WHERE quotation_id = %s

        """, (quotation_id,))


        # ==================================================
        # MARK OTHER QUOTATIONS AS REJECTED
        # ==================================================

        cursor.execute("""
            UPDATE quotations

            SET status = 'REJECTED'

            WHERE qrf_id = %s

            AND quotation_id != %s

        """, (
            quotation["qrf_id"],
            quotation_id
        ))


        # ==================================================
        # MARK SELECTED SUPPLIER
        # ==================================================

        cursor.execute("""
            UPDATE quotation_request_suppliers

            SET selected_supplier = 'NO'

            WHERE qrf_id = %s

        """, (
            quotation["qrf_id"],
        ))


        cursor.execute("""
            UPDATE quotation_request_suppliers

            SET selected_supplier = 'YES'

            WHERE qrf_id = %s

            AND quotation_id = %s

        """, (
            quotation["qrf_id"],
            quotation_id
        ))


        # ==================================================
        # COMMIT EVERYTHING
        # ==================================================

        conn.commit()


        # ==================================================
        # SUCCESS RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "message":
                "Purchase Order created successfully.",

            "po_id":
                po_id,

            "po_number":
                po_number,

            "quotation_id":
                quotation_id,

            "quotation_no":
                quotation_no,

            "supplier_id":
                supplier_id,

            "supplier_name":
                supplier_name,

            "requisition_id":
                requisition_id,

            "total_amount":
                total_amount

        }), 201


    except Exception as e:

        conn.rollback()


        print(
            "CREATE PO ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to create Purchase Order.",

            "error":
                str(e)

        }), 500


    finally:

        cursor.close()

        conn.close()







from datetime import datetime

# Make sure these already exist in your project:
# from your_database_file import get_db_connection
# from your procurement blueprint import procurement_dashboard_bp


# ============================================================
# CREATE GRN PAGE
# PROCUREMENT DASHBOARD
# URL:
# /procurement/create_grn
# ============================================================

@procurement_dashboard_bp.route("/create_grn", methods=["GET"])
def create_grn():

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    try:

        # ====================================================
        # LOAD PURCHASE ORDERS
        # Only load POs that can still receive goods
        # ====================================================

        cursor.execute("""
            SELECT
                po.purchase_order_id,
                po.po_number,
                po.supplier_id,
                s.supplier_name,
                po.requisition_id,
                po.status

            FROM purchase_orders po

            LEFT JOIN suppliers s
                ON s.supplier_id = po.supplier_id

            WHERE po.status IN (
                'Pending',
                'Approved'
            )

            ORDER BY
                po.purchase_order_id DESC
        """)

        pos = cursor.fetchall()


        # ====================================================
        # LOAD USERS
        # ====================================================

        cursor.execute("""
            SELECT
                user_id,
                username

            FROM users

            ORDER BY username ASC
        """)

        users = cursor.fetchall()


        # ====================================================
        # RETURN PAGE
        # ====================================================

        return render_template(
            "create_grn.html",
            pos=pos,
            users=users
        )


    except Exception as e:

        print(
            "CREATE GRN PAGE ERROR:",
            e
        )

        flash(
            f"Error loading Create GRN page: {str(e)}",
            "danger"
        )

        return redirect(
            url_for(
                "procurement_dashboard.procurement_dashboard"
            )
        )


    finally:

        cursor.close()

        conn.close()


# ============================================================
# GENERATE NEXT GRN NUMBER
#
# Example:
# GRN/2026/0001
# GRN/2026/0002
# GRN/2026/0003
# ============================================================
# ============================================================
# GENERATE NEXT GRN NUMBER
#
# Format:
# GRN/2026/0001
# GRN/2026/0002
# GRN/2026/0003
# ============================================================
from datetime import datetime
from flask import jsonify

# ============================================================
# GENERATE NEXT GRN NUMBER
#
# FORMAT:
# GRN/2026/0001
# GRN/2026/0002
# GRN/2026/0003
# ============================================================

@procurement_dashboard_bp.route(
    "/api/next_grn_number",
    methods=["GET"]
)
def next_grn_number():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ====================================================
        # CURRENT YEAR
        # ====================================================

        current_year = datetime.now().year


        # ====================================================
        # FIND LAST GRN NUMBER FOR CURRENT YEAR
        # ====================================================

        cursor.execute("""
            SELECT
                grn_no
            FROM grn
            WHERE grn_no LIKE %s
            ORDER BY grn_id DESC
            LIMIT 1
        """, (
            f"GRN/{current_year}/%",
        ))


        last_grn = cursor.fetchone()


        # ====================================================
        # DETERMINE NEXT SEQUENCE NUMBER
        # ====================================================

        if not last_grn:

            next_number = 1

        else:

            last_grn_no = (
                last_grn.get("grn_no")
                or ""
            )


            try:

                # Example:
                # GRN/2026/0005
                #
                # Split:
                # ["GRN", "2026", "0005"]

                last_sequence = int(
                    last_grn_no.split("/")[-1]
                )


                next_number = (
                    last_sequence + 1
                )


            except (ValueError, IndexError):

                next_number = 1


        # ====================================================
        # CREATE NEXT GRN NUMBER
        # ====================================================

        grn_number = (

            f"GRN/{current_year}/"
            f"{next_number:04d}"

        )


        # ====================================================
        # RETURN TO JAVASCRIPT
        # ====================================================

        return jsonify({

            "success": True,

            "grn_no":
                grn_number

        })


    except Exception as e:

        print(
            "NEXT GRN NUMBER ERROR:",
            e
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        cursor.close()

        conn.close()

        
# ============================================================
# GET PO DETAILS AND ITEMS
#
# URL:
# /procurement/get_po_items/5
# ============================================================

@procurement_dashboard_bp.route(
    "/get_po_items/<int:po_id>",
    methods=["GET"]
)
def get_po_items(po_id):

    conn = get_db_connection()

    cursor = conn.cursor(dictionary=True)

    try:

        # ====================================================
        # LOAD PO HEADER
        # ====================================================

        cursor.execute("""
            SELECT
                po.purchase_order_id,
                po.po_number,
                po.supplier_id,
                s.supplier_name,
                po.requisition_id,
                po.status

            FROM purchase_orders po

            LEFT JOIN suppliers s
                ON s.supplier_id =
                   po.supplier_id

            WHERE
                po.purchase_order_id = %s

            LIMIT 1
        """, (
            po_id,
        ))


        po = cursor.fetchone()


        # ====================================================
        # CHECK PO
        # ====================================================

        if not po:

            return jsonify({

                "success": False,

                "message":
                    "Purchase Order not found."

            }), 404


        # ====================================================
        # LOAD PO ITEMS
        # ====================================================

        cursor.execute("""
            SELECT

                poi.po_item_id,

                poi.item_name,

                poi.description,

                poi.quantity,

                poi.unit_price,

                poi.total_price,

                COALESCE(
                    (
                        SELECT
                            SUM(
                                gi.quantity_received
                            )
                        FROM grn_items gi

                        INNER JOIN grn g
                            ON g.grn_id =
                               gi.grn_id

                        WHERE
                            g.po_id = %s

                        AND gi.material_name =
                            poi.item_name
                    ),
                    0
                ) AS already_received

            FROM purchase_order_items poi

            WHERE
                poi.purchase_order_id = %s

            ORDER BY
                poi.po_item_id ASC

        """, (
            po_id,
            po_id
        ))


        items = cursor.fetchall()


        # ====================================================
        # CALCULATE BALANCE
        # ====================================================

        for item in items:

            ordered = float(
                item["quantity"]
                or 0
            )

            received = float(
                item["already_received"]
                or 0
            )


            balance = (
                ordered -
                received
            )


            if balance < 0:

                balance = 0


            item[
                "balance"
            ] = balance


        # ====================================================
        # RETURN DATA
        # ====================================================

        return jsonify({

            "success": True,

            "po": {

                "purchase_order_id":
                    po[
                        "purchase_order_id"
                    ],

                "po_number":
                    po[
                        "po_number"
                    ],

                "supplier_id":
                    po[
                        "supplier_id"
                    ],

                "supplier_name":
                    po[
                        "supplier_name"
                    ],

                "requisition_id":
                    po[
                        "requisition_id"
                    ],

                "status":
                    po[
                        "status"
                    ]

            },

            "items":
                items

        })


    except Exception as e:

        print(
            "GET PO ITEMS ERROR:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        cursor.close()

        conn.close()


# ============================================================
# SAVE GRN
#
# URL:
# POST /procurement/save_grn
# ============================================================

@procurement_dashboard_bp.route(
    "/save_grn",
    methods=["POST"]
)
def save_grn():

    conn = get_db_connection()

    cursor = conn.cursor(
        dictionary=True
    )

    try:

        # ====================================================
        # CHECK LOGIN
        # ====================================================

        received_by = session.get(
            "user_id"
        )


        if not received_by:

            flash(
                "User not logged in.",
                "danger"
            )

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        # ====================================================
        # GET FORM DATA
        # ====================================================

        po_id = request.form.get(
            "po_id"
        )

        received_date = request.form.get(
            "received_date"
        )

        delivery_note_no = (
            request.form.get(
                "delivery_note_no"
            )
            or None
        )

        main_remarks = (
            request.form.get(
                "main_remarks"
            )
            or ""
        )


        # ====================================================
        # VALIDATE PO
        # ====================================================

        if not po_id:

            flash(
                "Please select a Purchase Order.",
                "danger"
            )

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        # ====================================================
        # GENERATE GRN NUMBER
        # SERVER SIDE
        # ====================================================

        current_year = datetime.now().year


        cursor.execute("""
            SELECT
                grn_no

            FROM grn

            WHERE grn_no LIKE %s

            ORDER BY grn_id DESC

            LIMIT 1
        """, (
            f"GRN/{current_year}/%",
        ))


        last_grn = cursor.fetchone()


        if not last_grn:

            next_number = 1

        else:

            try:

                next_number = (
                    int(
                        last_grn[
                            "grn_no"
                        ].split("/")[-1]
                    )
                    + 1
                )

            except Exception:

                next_number = 1


        grn_no = (
            f"GRN/{current_year}/"
            f"{next_number:04d}"
        )


        # ====================================================
        # LOAD PO
        # ====================================================

        cursor.execute("""
            SELECT

                po.purchase_order_id,

                po.po_number,

                po.supplier_id,

                po.requisition_id,

                s.supplier_name

            FROM purchase_orders po

            LEFT JOIN suppliers s

                ON s.supplier_id =
                   po.supplier_id

            WHERE
                po.purchase_order_id = %s

            LIMIT 1

        """, (
            po_id,
        ))


        po = cursor.fetchone()


        if not po:

            flash(
                "Purchase Order not found.",
                "danger"
            )

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        # ====================================================
        # GET PO ITEMS
        # ====================================================

        cursor.execute("""
            SELECT

                po_item_id,

                item_name,

                description,

                quantity

            FROM purchase_order_items

            WHERE
                purchase_order_id = %s

            ORDER BY
                po_item_id ASC

        """, (
            po_id,
        ))


        po_items = cursor.fetchall()


        if not po_items:

            flash(
                "This Purchase Order has no items.",
                "danger"
            )

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        # ====================================================
        # GET RECEIVED ARRAYS
        # ====================================================

        qty_received = (
            request.form.getlist(
                "quantity_received[]"
            )
        )


        qty_rejected = (
            request.form.getlist(
                "quantity_rejected[]"
            )
        )


        remarks = (
            request.form.getlist(
                "remarks[]"
            )
        )


        # ====================================================
        # VALIDATE QUANTITIES
        # ====================================================

        valid_item_found = False

        inspection_status = "ACCEPTED"


        for i, po_item in enumerate(
            po_items
        ):

            received_qty = 0

            rejected_qty = 0


            if i < len(
                qty_received
            ):

                try:

                    received_qty = float(
                        qty_received[i]
                        or 0
                    )

                except Exception:

                    received_qty = 0


            if i < len(
                qty_rejected
            ):

                try:

                    rejected_qty = float(
                        qty_rejected[i]
                        or 0
                    )

                except Exception:

                    rejected_qty = 0


            if (
                received_qty > 0
                or rejected_qty > 0
            ):

                valid_item_found = True


            if (
                rejected_qty > 0
            ):

                inspection_status = (
                    "PARTIAL"
                )


        if not valid_item_found:

            flash(
                "Enter at least one received or rejected quantity.",
                "danger"
            )

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        # ====================================================
        # INSERT GRN HEADER
        # ====================================================

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

            po[
                "supplier_id"
            ],

            received_by,

            received_date,

            delivery_note_no,

            inspection_status,

            main_remarks

        ))


        grn_id = cursor.lastrowid


        # ====================================================
        # INSERT GRN ITEMS
        # ====================================================

        for i, po_item in enumerate(
            po_items
        ):

            received_qty = 0

            rejected_qty = 0

            remark_value = ""


            if i < len(
                qty_received
            ):

                try:

                    received_qty = float(
                        qty_received[i]
                        or 0
                    )

                except Exception:

                    received_qty = 0


            if i < len(
                qty_rejected
            ):

                try:

                    rejected_qty = float(
                        qty_rejected[i]
                        or 0
                    )

                except Exception:

                    rejected_qty = 0


            if i < len(
                remarks
            ):

                remark_value = (
                    remarks[i]
                    or ""
                )


            # Skip completely empty items

            if (
                received_qty <= 0
                and rejected_qty <= 0
            ):

                continue


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

                po_item[
                    "item_name"
                ],

                po_item[
                    "description"
                ],

                po_item[
                    "quantity"
                ],

                received_qty,

                rejected_qty,

                remark_value

            ))


        # ====================================================
        # DETERMINE PO STATUS
        #
        # Check all PO items against total received
        # ====================================================

        cursor.execute("""
            SELECT

                poi.item_name,

                poi.quantity,

                COALESCE(
                    SUM(
                        gi.quantity_received
                    ),
                    0
                ) AS total_received

            FROM purchase_order_items poi

            LEFT JOIN grn g

                ON g.po_id =
                   poi.purchase_order_id

            LEFT JOIN grn_items gi

                ON gi.grn_id =
                   g.grn_id

                AND gi.material_name =
                    poi.item_name

            WHERE
                poi.purchase_order_id = %s

            GROUP BY

                poi.po_item_id,

                poi.item_name,

                poi.quantity

        """, (
            po_id,
        ))


        status_items = (
            cursor.fetchall()
        )


        all_completed = True


        for item in status_items:

            ordered = float(
                item[
                    "quantity"
                ]
                or 0
            )


            total_received = float(
                item[
                    "total_received"
                ]
                or 0
            )


            if (
                total_received <
                ordered
            ):

                all_completed = False

                break


        # ====================================================
        # UPDATE PO STATUS
        # ====================================================

        if all_completed:

            cursor.execute("""
                UPDATE purchase_orders

                SET status = 'Delivered'

                WHERE
                    purchase_order_id = %s
            """, (
                po_id,
            ))

        else:

            cursor.execute("""
                UPDATE purchase_orders

                SET status = 'Approved'

                WHERE
                    purchase_order_id = %s
            """, (
                po_id,
            ))


        # ====================================================
        # COMMIT
        # ====================================================

        conn.commit()


        # ====================================================
        # SUCCESS
        # ====================================================

        flash(
            f"GRN {grn_no} saved successfully.",
            "success"
        )


        return redirect(
            url_for(
                "procurement_dashboard.procurement_dashboard"
            )
        )


    except Exception as e:

        conn.rollback()


        print(
            "SAVE GRN ERROR:",
            e
        )


        flash(
            f"Error saving GRN: {str(e)}",
            "danger"
        )


        return redirect(
            url_for(
                "procurement_dashboard.procurement_dashboard"
            )
        )


    finally:

        cursor.close()

        conn.close()


# ============================================================
# GET GRN ITEMS
#
# URL:
# /procurement/get_grn_items/1
# ============================================================

@procurement_dashboard_bp.route(
    "/get_grn_items/<int:grn_id>",
    methods=["GET"]
)
def get_grn_items(grn_id):

    conn = get_db_connection()

    cursor = conn.cursor(
        dictionary=True
    )

    try:

        cursor.execute("""
            SELECT

                gi.grn_id,

                gi.material_name,

                gi.description,

                gi.quantity_ordered,

                gi.quantity_received,

                gi.quantity_rejected,

                gi.remarks

            FROM grn_items gi

            WHERE
                gi.grn_id = %s

            ORDER BY
                gi.grn_item_id ASC

        """, (
            grn_id,
        ))


        items = cursor.fetchall()


        return jsonify({

            "success": True,

            "items":
                items

        })


    except Exception as e:

        print(
            "GET GRN ITEMS ERROR:",
            e
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        cursor.close()

        conn.close()


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