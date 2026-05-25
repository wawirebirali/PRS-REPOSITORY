from flask import Blueprint, render_template
from model import get_all_requisitions, get_all_users, get_requisition_by_id, get_requisition_items, get_requisition_approvals

admin_dashboard_bp = Blueprint(
    "admin_dashboard",
    __name__,
    url_prefix="/admin"
)

@admin_dashboard_bp.route('/dashboard')
def admin_dashboard():
    requisitions = get_all_requisitions()
    users = get_all_users()
    return render_template("admin_dashboard.html", requisitions=requisitions, users=users)

@admin_dashboard_bp.route('/view/<int:requisition_id>')
def view_requisition(requisition_id):
    requisition = get_requisition_by_id(requisition_id)
    if not requisition:
        return "Requisition not found", 404
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
        approval_dates=approval_dates
    )