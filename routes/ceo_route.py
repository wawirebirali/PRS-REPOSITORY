from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from model import get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role, get_notifications_for_user
from flask import Blueprint, request, jsonify
from datetime import datetime
from db_connect import get_db_connection


ceo_dashboard_bp = Blueprint(
    "ceo",
    __name__,
    url_prefix="/ceo"
)
@ceo_dashboard_bp.route("/dashboard")
def ceo_dashboard():

    if session.get("user_role") != "ceo":
        flash("Unauthorized access", "danger")
        return redirect(url_for("auth.user_login"))


    requisitions = get_pending_requisitions_for_role("CEO")

    notifications = get_notifications_for_user(
        session.get("user_id")
    )


    return render_template(
        "ceo_dashboard.html",
        requisitions=requisitions,
        notifications=notifications
    )

@ceo_dashboard_bp.route("/view/<int:requisition_id>")
def view_requisition_ceo(requisition_id):
    if session.get("user_role") != "ceo":
        flash("Unauthorized", "danger")
        return redirect(url_for("auth.user_login"))

    requisition = get_requisition_by_id(requisition_id)
    items = get_requisition_items(requisition_id)
    approvals = get_requisition_approvals(requisition_id)

    signatures = {}
    approval_dates = {}
    date_column_map = {
        "HOD": "hod_approval_date",
        "CEO": "ceo_approval_date",
        "Finance": "finance_approval_date",
        "Procurement": "procurement_approval_date"
    }
    for approval in approvals:
        if approval['action'] == 'Approved':
            signatures[approval['role']] = approval['signature']
            date_col = date_column_map.get(approval['role'])
            if date_col and approval.get(date_col):
                approval_dates[approval['role']] = approval[date_col]

    return render_template(
        "view_form.html",
        requisition=requisition,
        items=items,
        approvals=approvals,
        signatures=signatures,
        approval_dates=approval_dates,
        print_mode=False
    )

@ceo_dashboard_bp.route("/approve/<int:requisition_id>", methods=["POST"])
def ceo_approve(requisition_id):
    if session.get("user_role") != "ceo":
        flash("Unauthorized", "danger")
        return redirect(url_for("auth.user_login"))

    user_id = session.get("user_id")
    result = approve_requisition(requisition_id, user_id, "CEO")

    if result["success"]:
        flash("Requisition approved successfully", "success")
    else:
        flash("Failed to approve requisition", "danger")

    return redirect(url_for("ceo.ceo_dashboard"))


@ceo_dashboard_bp.route("/reject/<int:requisition_id>", methods=["POST"])
def ceo_reject(requisition_id):
    if session.get("user_role") != "ceo":
        flash("Unauthorized", "danger")
        return redirect(url_for("auth.user_login"))

    user_id = session.get("user_id")
    reason = request.form.get("reason", "")
    result = reject_requisition(requisition_id, user_id, "CEO", reason)

    if result["success"]:
        flash("Requisition rejected", "danger")
    else:
        flash("Failed to reject requisition", "danger")

    return redirect(url_for("ceo.ceo_dashboard"))




# INSERTING BUDGET




@ceo_dashboard_bp.route("/api/company-budget/create", methods=["POST"])
def create_company_budget():

    data = request.get_json()

    financial_year = data.get("financial_year")
    department_id = data.get("department_id")
    budget_type = data.get("budget_type")
    total_budget = data.get("total_budget")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    remarks = data.get("remarks", "")

    if not financial_year:
        return jsonify({
            "success": False,
            "message": "Financial Year is required."
        })

    if not department_id:
        return jsonify({
            "success": False,
            "message": "Department is required."
        })

    if not budget_type:
        return jsonify({
            "success": False,
            "message": "Budget Type is required."
        })

    if not total_budget:
        return jsonify({
            "success": False,
            "message": "Budget Amount is required."
        })

    if not start_date or not end_date:
        return jsonify({
            "success": False,
            "message": "Start and End dates are required."
        })

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Generate Budget Number
        cursor.execute(
            "SELECT COUNT(*) AS total FROM company_budget"
        )

        count = cursor.fetchone()["total"] + 1

        budget_no = f"CB-{datetime.now().year}-{count:04d}"

        cursor.execute("""
            INSERT INTO company_budget
            (
                budget_no,
                financial_year,
                department_id,
                budget_type,
                total_budget,
                remaining_budget,
                start_date,
                end_date,
                remarks,
                ceo_status,
                created_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'Pending',
                NOW()
            )
        """,
        (
            budget_no,
            financial_year,
            department_id,
            budget_type,
            total_budget,
            total_budget,
            start_date,
            end_date,
            remarks
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Company Budget created successfully.",
            "budget_no": budget_no
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        })

    finally:

        cursor.close()
        conn.close()





@ceo_dashboard_bp.route("/api/departments", methods=["GET"])
def get_departments():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                department_id,
                department_name
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


