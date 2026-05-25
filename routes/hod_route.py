from flask import Blueprint, render_template, session, redirect, url_for, jsonify
from model import get_db_connection

hod_dashboard_bp = Blueprint("hod_dashboard", __name__)


# =========================
# DASHBOARD PAGE
# =========================
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
            COALESCE(a.hod_approval_date,'-') AS hod_approval_date
        FROM requisitions r
        LEFT JOIN departments d ON r.department_id = d.department_id
        LEFT JOIN approvals a ON r.requisition_id = a.requisition_id
        ORDER BY r.requisition_id DESC
    """)

    requisitions = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("hod_dashboard.html", requisitions=requisitions)


# =========================
# PRS DETAILS API (AJAX)
# =========================
@hod_dashboard_bp.route("/requisition/api/<int:requisition_id>")
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
@hod_dashboard_bp.route("/approve", methods=["POST"])
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



@hod_dashboard_bp.route("/requisition/hod-signature/<int:requisition_id>")
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