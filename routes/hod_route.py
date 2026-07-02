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
    action = data.get("action", "APPROVED")

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

        # ==========================================
        # CREATE APPROVAL ROW IF MISSING
        # ==========================================
        cursor.execute("""
            SELECT approval_id
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

        # ==========================================
        # HOD APPROVAL
        # ==========================================
        if role == "hod":

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

        # ==========================================
        # CEO APPROVAL
        # ==========================================
        elif role == "ceo":

            cursor.execute("""
                SELECT hod_status
                FROM approvals
                WHERE module_name=%s
                AND document_id=%s
            """, (module_name, document_id))

            row = cursor.fetchone()

            if not row or row["hod_status"] != "APPROVED":

                conn.rollback()

                cursor.close()
                conn.close()

                return jsonify({
                    "success": False,
                    "message": "HOD must approve first"
                }), 400

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

            # ==========================================
            # UPDATE MODULE STATUS
            # ==========================================
            table_map = {

                "PRS": (
                    "requisitions",
                    "requisition_id"
                ),

                "PO": (
                    "purchase_orders",
                    "purchase_order_id"
                ),

                "GRN": (
                    "grn",
                    "grn_id"
                ),

                "INVOICE": (
                    "invoices",
                    "invoice_id"
                ),

                "PAYMENT": (
                    "payments",
                    "payment_id"
                ),

                "QRF": (
                    "quotation_requests",
                    "qrf_id"
                ),
                "QUOTATION": (
                    "quotations",
                    "quotation_id"
                )

            }

            if module_name in table_map:

                table_name, pk = table_map[module_name]

                cursor.execute(f"""
                    UPDATE {table_name}
                    SET status=%s
                    WHERE {pk}=%s
                """, (
                    action,
                    document_id
                ))

        else:

            conn.rollback()

            cursor.close()
            conn.close()

            return jsonify({
                "success": False,
                "message": "Unauthorized"
            }), 403

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"{role.upper()} {action}"
        })

    except Exception as e:

        conn.rollback()

        cursor.close()
        conn.close()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


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





