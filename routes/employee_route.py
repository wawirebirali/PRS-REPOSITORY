from flask import Blueprint, render_template, session, redirect, url_for
from db_connect import get_db_connection


employee_dashboard_bp = Blueprint(
    "employee_dashboard",
    __name__,
    url_prefix="/employee"
)



# ==========================================
# EMPLOYEE DASHBOARD
# ==========================================

@employee_dashboard_bp.route("/dashboard")
def employee_dashboard():
    if "user_id" not in session:
        return redirect(url_for("auth.user_login"))

    if (session.get("user_role") or "").lower() != "employee":
        return redirect(url_for("auth.user_login"))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,
                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                COALESCE(a.final_status, 'PENDING') AS final_status
            FROM requisitions r
            JOIN departments d ON d.department_id = r.department_id
            LEFT JOIN approvals a
                ON a.document_id = r.requisition_id
               AND a.module_name = 'PRS'
            WHERE r.user_id = %s
            ORDER BY r.created_at DESC, r.requisition_id DESC
        """, (session["user_id"],))
        requisitions = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    statuses = [str(req["final_status"]).upper() for req in requisitions]
    pending_prs = sum(status not in ("APPROVED", "REJECTED") for status in statuses)
    approved_prs = statuses.count("APPROVED")
    rejected_prs = statuses.count("REJECTED")

    return render_template(
        "employee_dashboard.html",
        total_prs=len(requisitions),
        pending_prs=pending_prs,
        approved_prs=approved_prs,
        rejected_prs=rejected_prs,
        hod_pending=sum(str(req["hod_status"]).upper() == "PENDING" for req in requisitions),
        ceo_pending=sum(
            str(req["hod_status"]).upper() == "APPROVED"
            and str(req["ceo_status"]).upper() == "PENDING"
            for req in requisitions
        ),
        requisitions=requisitions,
    )