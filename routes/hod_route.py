from flask import Blueprint, render_template, session, redirect, url_for, jsonify, request
from model import get_db_connection
from datetime import datetime

hod_dashboard_bp = Blueprint("hod_dashboard", __name__)

# =========================================================
# DASHBOARD PAGE
# =========================================================
@hod_dashboard_bp.route("/", methods=["GET"])
def hod_dashboard():

    if session.get("user_role") != "hod":
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
            COALESCE(a.hod_approved_at,'-') AS hod_approved_at,

            COALESCE(a.ceo_status,'Pending') AS ceo_status,
            COALESCE(a.ceo_approved_at,'-') AS ceo_approved_at

        FROM requisitions r

        LEFT JOIN departments d 
            ON r.department_id = d.department_id

        LEFT JOIN approvals a 
            ON a.module_name = 'PRS'
            AND a.document_id = r.requisition_id

        ORDER BY r.requisition_id DESC
    """)

    requisitions = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("hod_dashboard.html", requisitions=requisitions)


# =========================================================
# REQUISITION DETAILS API
# =========================================================
@hod_dashboard_bp.route("/requisition/api/<int:requisition_id>")
def requisition_api(requisition_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================================
        # HEADER + APPROVALS + USERS
        # =====================================================
        cursor.execute("""
            SELECT 
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.ceo_status,'PENDING') AS ceo_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                u.user_id AS creator_id,
                u.username AS creator_name,
                u.signature AS creator_signature

            FROM requisitions r

            LEFT JOIN departments d 
                ON r.department_id = d.department_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PRS'
                AND a.document_id = r.requisition_id

            LEFT JOIN users u 
                ON u.user_id = r.user_id

            WHERE r.requisition_id = %s
        """, (requisition_id,))

        requisition = cursor.fetchone()

        if not requisition:
            return jsonify({"success": False, "message": "Not found"}), 404

        # =====================================================
        # ITEMS
        # =====================================================
        cursor.execute("""
            SELECT 
                item_id,
                material_name,
                uom,
                qty_required
            FROM requisition_items
            WHERE requisition_id = %s
        """, (requisition_id,))

        items = cursor.fetchall()

        # =====================================================
        # HOD SIGNATURE
        # =====================================================
        cursor.execute("""
            SELECT 
                u.username,
                u.signature,
                a.hod_approved_at
            FROM approvals a
            LEFT JOIN users u ON u.user_id = a.hod_user_id
            WHERE a.module_name = 'PRS'
              AND a.document_id = %s
              AND a.hod_status = 'APPROVED'
            LIMIT 1
        """, (requisition_id,))

        hod_sig = cursor.fetchone()

        # =====================================================
        # CEO SIGNATURE
        # =====================================================
        cursor.execute("""
            SELECT 
                u.username,
                u.signature,
                a.ceo_approved_at
            FROM approvals a
            LEFT JOIN users u ON u.user_id = a.ceo_user_id
            WHERE a.module_name = 'PRS'
              AND a.document_id = %s
              AND a.ceo_status = 'APPROVED'
            LIMIT 1
        """, (requisition_id,))

        ceo_sig = cursor.fetchone()

        return jsonify({
            "success": True,
            "requisition": requisition,
            "items": items,
            "created_by": {
                "name": requisition["creator_name"],
                "signature": requisition["creator_signature"]
            },
            "hod_signature": hod_sig,
            "ceo_signature": ceo_sig
        })

    finally:
        cursor.close()
        conn.close()


# =========================================================
# UNIVERSAL APPROVAL API (HOD + CEO)
# =========================================================
@hod_dashboard_bp.route("/approve", methods=["POST"])
def approve_document():

    data = request.get_json()

    module_name = data.get("module_name")
    document_id = data.get("document_id")
    action = data.get("action", "APPROVED").upper()

    user_id = session.get("user_id")
    role = session.get("user_role")

    if not module_name or not document_id:
        return jsonify({
            "success": False,
            "message": "Missing data"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        table_map = {
            "PRS": ("requisitions", "requisition_id"),
            "QRF": ("quotation_requests", "qrf_id"),
            "QUOTATION": ("quotations", "quotation_id"),
            "PO": ("purchase_orders", "purchase_order_id"),
            "GRN": ("grn", "grn_id"),
            "INVOICE": ("invoices", "invoice_id"),
            "PAYMENT": ("payments", "payment_id")
        }

        # -----------------------------
        # Create approval row if missing
        # -----------------------------
        cursor.execute("""
            SELECT *
            FROM approvals
            WHERE module_name=%s
            AND document_id=%s
        """, (module_name, document_id))

        approval = cursor.fetchone()

        if not approval:

            cursor.execute("""
                INSERT INTO approvals(
                    module_name,
                    document_id
                )
                VALUES(%s,%s)
            """, (module_name, document_id))

            conn.commit()

            cursor.execute("""
                SELECT *
                FROM approvals
                WHERE module_name=%s
                AND document_id=%s
            """, (module_name, document_id))

            approval = cursor.fetchone()

        # ==========================================
        # HOD
        # ==========================================
        if role == "hod":

            if approval["hod_status"] in ("APPROVED", "REJECTED"):

                return jsonify({
                    "success": False,
                    "message": "This document has already been processed by HOD."
                })

            cursor.execute("""
                UPDATE approvals
                SET
                    hod_status=%s,
                    hod_user_id=%s,
                    hod_approved_at=NOW(),
                    final_status=
                        CASE
                            WHEN %s='REJECTED'
                            THEN 'REJECTED'
                            ELSE final_status
                        END
                WHERE module_name=%s
                AND document_id=%s
            """, (
                action,
                user_id,
                action,
                module_name,
                document_id
            ))

            if action == "REJECTED":

                table, pk = table_map[module_name]

                cursor.execute(f"""
                    UPDATE {table}
                    SET status='REJECTED'
                    WHERE {pk}=%s
                """, (document_id,))

        # ==========================================
        # CEO
        # ==========================================
        elif role == "ceo":

            if approval["hod_status"] != "APPROVED":

                return jsonify({
                    "success": False,
                    "message": "HOD must approve first."
                })

            if approval["ceo_status"] in ("APPROVED", "REJECTED"):

                return jsonify({
                    "success": False,
                    "message": "This document has already been processed by CEO."
                })

            cursor.execute("""
                UPDATE approvals
                SET
                    ceo_status=%s,
                    ceo_user_id=%s,
                    ceo_approved_at=NOW(),
                    final_status=%s
                WHERE module_name=%s
                AND document_id=%s
            """, (
                action,
                user_id,
                action,
                module_name,
                document_id
            ))

            table, pk = table_map[module_name]

            cursor.execute(f"""
                UPDATE {table}
                SET status=%s
                WHERE {pk}=%s
            """, (
                action,
                document_id
            ))

        else:

            return jsonify({
                "success": False,
                "message": "Unauthorized"
            }), 403

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"{role.upper()} {action} successfully."
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
# =========================================================
# SIGNATURE API
# =========================================================
@hod_dashboard_bp.route("/document/signature/<int:document_id>/<string:module_name>")
def get_signature(document_id, module_name):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # CREATED BY
    cursor.execute("""
        SELECT u.user_id, u.username, u.signature
        FROM requisitions r
        JOIN users u ON u.user_id = r.user_id
        WHERE r.requisition_id = %s
    """, (document_id,))

    created_by = cursor.fetchone()

    # HOD SIGNATURE
    cursor.execute("""
        SELECT 
            u.user_id,
            u.username,
            u.signature,
            a.hod_approved_at,
            a.hod_status
        FROM approvals a
        LEFT JOIN users u ON u.user_id = a.hod_user_id
        WHERE a.module_name = %s
          AND a.document_id = %s
          AND a.hod_status = 'APPROVED'
        ORDER BY a.hod_approved_at DESC
        LIMIT 1
    """, (module_name, document_id))

    hod = cursor.fetchone()

    # CEO SIGNATURE
    cursor.execute("""
        SELECT 
            u.user_id,
            u.username,
            u.signature,
            a.ceo_approved_at,
            a.ceo_status
        FROM approvals a
        LEFT JOIN users u ON u.user_id = a.ceo_user_id
        WHERE a.module_name = %s
          AND a.document_id = %s
          AND a.ceo_status = 'APPROVED'
        ORDER BY a.ceo_approved_at DESC
        LIMIT 1
    """, (module_name, document_id))

    ceo = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "created_by": created_by,
        "hod": hod,
        "ceo": ceo
    })




# =========================================================
# QRF MODULE (HOD DASHBOARD EXTENSION)
# =========================================================

@hod_dashboard_bp.route("/qrf/data")
def qrf_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            qr.qrf_id,
            qr.qrf_no,
            qr.request_date,

            COALESCE(a.final_status, 'PENDING') AS status,

            r.prs_no,
            d.department_name,
            u.username AS requester_name

        FROM quotation_requests qr

        LEFT JOIN approvals a 
            ON a.module_name = 'QRF'
            AND a.document_id = qr.qrf_id

        LEFT JOIN requisitions r 
            ON qr.requisition_id = r.requisition_id

        LEFT JOIN departments d 
            ON r.department_id = d.department_id

        LEFT JOIN users u 
            ON qr.requested_by = u.user_id

        ORDER BY qr.qrf_id DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(rows)




#inserting budget



@hod_dashboard_bp.route("/api/departments", methods=["GET"])
def get_departments():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT department_id, department_name
            FROM departments
            ORDER BY department_name
        """)

        departments = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": departments
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()

def insert_budget(
    budget_no,
    department_id,
    budget_item,
    budget_type,
    budget_amount,
    start_date,
    end_date,
    created_by
):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO budgets(
            budget_no,
            department_id,
            budget_item,
            budget_type,
            budget_amount,
            start_date,
            end_date,
            created_by
        )
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
    """,(
        budget_no,
        department_id,
        budget_item,
        budget_type,
        budget_amount,
        start_date,
        end_date,
        created_by
    ))

    conn.commit()

    budget_id = cursor.lastrowid

    cursor.close()
    conn.close()

    return budget_id


from flask import request, jsonify, session
from datetime import datetime

@hod_dashboard_bp.route("/api/budget/create", methods=["POST"])
def create_budget():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    try:
        data = request.get_json()

        budget_no = "BUD-" + datetime.now().strftime("%Y%m%d%H%M%S")

        budget_id = insert_budget(
            budget_no=budget_no,
            department_id=data["department_id"],
            budget_item=data["budget_item"],
            budget_type=data["budget_type"],
            budget_amount=data["budget_amount"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            created_by=session["user_id"]      # Logged in user
        )

        return jsonify({
            "success": True,
            "budget_id": budget_id,
            "budget_no": budget_no,
            "message": "Budget created successfully."
        })

    except Exception as e:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500






@hod_dashboard_bp.route("/api/budgets", methods=["GET"])
def get_budgets():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                b.budget_id,
                b.budget_no,
                b.created_at,
                d.department_name,
                b.budget_item,
                b.budget_type,
                b.start_date,
                b.end_date,
                b.budget_amount,

                COALESCE(b.spent_amount,0) AS spent,

                (b.budget_amount - COALESCE(b.spent_amount,0)) AS balance,

                DATEDIFF(b.end_date,CURDATE()) AS due_days,

                COALESCE(a.ceo_status,'PENDING') AS ceo_status,
                a.ceo_approved_at

            FROM budgets b

            LEFT JOIN departments d
                ON b.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.module_name='BUDGET'
               AND a.document_id=b.budget_id

            ORDER BY b.created_at DESC
        """)

        budgets = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": budgets
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }),500

    finally:
        cursor.close()
        conn.close()