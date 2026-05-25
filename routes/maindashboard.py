from flask import Blueprint, render_template, jsonify
import mysql.connector
from db_connect import get_db_connection as get_conn

maindashboard_bp = Blueprint("maindashboard", __name__, template_folder="../templates")


# ================= DASHBOARD PAGE =================
@maindashboard_bp.route("/")
def home():
    return render_template("main_dashboard.html")


# ================= DASHBOARD API =================
@maindashboard_bp.route("/api/dashboard")
def dashboard_api():

    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    # -------- STATS --------
    cursor.execute("SELECT COUNT(*) AS total FROM requisitions")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS pending FROM requisitions WHERE status='Pending'")
    pending = cursor.fetchone()["pending"]
    cursor.execute("SELECT COUNT(*) AS pending FROM requisitions WHERE status='Pending'")
    pending = cursor.fetchone()["pending"]

    cursor.execute("SELECT COUNT(*) AS approved FROM requisitions WHERE status='Completed'")
    approved = cursor.fetchone()["approved"]

    cursor.execute("SELECT COUNT(*) AS rejected FROM requisitions WHERE status='Rejected'")
    rejected = cursor.fetchone()["rejected"]

    # -------- RECENT --------
    cursor.execute("""
        SELECT r.prs_no, d.department_name, r.submission_date, r.status
        FROM requisitions r
        JOIN departments d ON r.department_id = d.department_id
        ORDER BY r.requisition_id DESC
        LIMIT 5
    """)
    recent = cursor.fetchall()

    # -------- DEPARTMENTS --------
    cursor.execute("""
        SELECT d.department_name, COUNT(r.requisition_id) AS total
        FROM departments d
        LEFT JOIN requisitions r ON d.department_id = r.department_id
        GROUP BY d.department_name
    """)
    dept = cursor.fetchall()

    conn.close()

    return jsonify({
        "stats": {
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected
        },
        "recent": recent,
        "departments": {
            "labels": [d["department_name"] for d in dept],
            "values": [d["total"] for d in dept]
        }
    })