from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from model import get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role

finance_dashboard_bp = Blueprint("finance_dashboard", __name__, template_folder="../templates")

@finance_dashboard_bp.route("/dashboard")
def dashboard():
    if session.get("user_role") != "finance":
        flash("Unauthorized access", "danger")
        return redirect(url_for("auth.user_login"))
    requisitions = get_pending_requisitions_for_role("Finance")
    return render_template("finanance_dashboard.html", requisitions=requisitions)

@finance_dashboard_bp.route("/view/<int:requisition_id>")
def view_requisition_finance(requisition_id):
    if session.get("user_role") != "finance":
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

@finance_dashboard_bp.route("/approve/<int:requisition_id>", methods=["POST"])
def finance_approve(requisition_id):
    if session.get("user_role") != "finance":
        flash("Unauthorized", "danger")
        return redirect(url_for("auth.user_login"))

    user_id = session.get("user_id")
    result = approve_requisition(requisition_id, user_id, "Finance")

    if result["success"]:
        flash("Requisition approved successfully", "success")
    else:
        flash("Failed to approve requisition", "danger")

    return redirect(url_for("finance_dashboard.dashboard"))


@finance_dashboard_bp.route("/reject/<int:requisition_id>", methods=["POST"])
def finance_reject(requisition_id):
    if session.get("user_role") != "finance":
        flash("Unauthorized", "danger")
        return redirect(url_for("auth.user_login"))

    user_id = session.get("user_id")
    reason = request.form.get("reason", "")
    result = reject_requisition(requisition_id, user_id, "Finance", reason)

    if result["success"]:
        flash("Requisition rejected", "danger")
    else:
        flash("Failed to reject requisition", "danger")

    return redirect(url_for("finance_dashboard.dashboard"))