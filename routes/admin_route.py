import base64
import binascii
import os
import uuid

from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from model import (
    create_user,
    get_all_requisitions,
    get_all_users,
    get_requisition_by_id,
    get_requisition_items,
    get_requisition_approvals,
    get_user_by_id,
    update_user,
)

admin_dashboard_bp = Blueprint(
    "admin_dashboard",
    __name__,
    url_prefix="/admin"
)

USER_ROLES = ("admin", "finance", "ceo", "hod", "procurement", "employee")
DEPARTMENTS = (
    "IT", "Finance", "HR", "Procurement", "Administration", "Operations",
    "Engineering", "Security", "QA", "QC", "Safety", "Warehouse",
    "Production", "Regulatory",
)


def require_admin():
    role = session.get("user_role") or session.get("role")
    if role and role.lower() == "admin":
        return None
    return redirect(url_for("auth.admin_login"))

@admin_dashboard_bp.route('/dashboard')
def admin_dashboard():
    denied = require_admin()
    if denied:
        return denied
    requisitions = get_all_requisitions()
    users = get_all_users()
    return render_template("admin_dashboard.html", requisitions=requisitions, users=users)


@admin_dashboard_bp.route('/users/new', methods=['GET', 'POST'])
def add_user():
    denied = require_admin()
    if denied:
        return denied

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        user_role = request.form.get("user_role", "").lower()
        password = request.form.get("password", "")
        department = request.form.get("department") or None
        signature_data = request.form.get("signature_data", "")

        if not username or not email or not password or user_role not in USER_ROLES:
            flash("Username, email, password, and a valid role are required.", "danger")
        elif department and department not in DEPARTMENTS:
            flash("Select a valid department.", "danger")
        elif not signature_data.startswith("data:image/png;base64,"):
            flash("A drawn signature is required.", "danger")
        else:
            try:
                signature_bytes = base64.b64decode(signature_data.split(",", 1)[1], validate=True)
                if not signature_bytes:
                    raise ValueError("Empty signature")
                signature_name = f"{uuid.uuid4().hex}.png"
                signature_directory = os.path.join("static", "signatures")
                os.makedirs(signature_directory, exist_ok=True)
                signature_file = os.path.join(signature_directory, signature_name)
                with open(signature_file, "wb") as signature_stream:
                    signature_stream.write(signature_bytes)
                result = create_user(
                    username=username,
                    email=email,
                    phone=request.form.get("phone", "").strip(),
                    password=password,
                    user_role=user_role,
                    department=department,
                    signature_path=f"signatures/{signature_name}",
                )
                if result["success"]:
                    flash("User account created.", "success")
                    return redirect(url_for("admin_dashboard.admin_dashboard"))
                os.remove(signature_file)
                flash(result["message"], "danger")
            except (binascii.Error, ValueError, OSError):
                flash("Signature data is invalid or could not be saved.", "danger")

    return render_template(
        "admin_user_form.html",
        page_title="Add User",
        user=None,
        roles=USER_ROLES,
        departments=DEPARTMENTS,
    )


@admin_dashboard_bp.route('/users/<int:user_id>')
def view_user(user_id):
    denied = require_admin()
    if denied:
        return denied
    user = get_user_by_id(user_id)
    if not user:
        return "User not found", 404
    return render_template("admin_user_detail.html", user=user)


@admin_dashboard_bp.route('/users/<int:user_id>/edit', methods=['GET', 'POST'])
def edit_user(user_id):
    denied = require_admin()
    if denied:
        return denied
    user = get_user_by_id(user_id)
    if not user:
        return "User not found", 404

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        user_role = request.form.get("user_role", "").lower()
        department = request.form.get("department") or None
        password = request.form.get("password", "")

        if not username or not email or user_role not in USER_ROLES:
            flash("Username, email, and a valid role are required.", "danger")
        elif department and department not in DEPARTMENTS:
            flash("Select a valid department.", "danger")
        else:
            result = update_user(
                user_id=user_id,
                username=username,
                email=email,
                phone=request.form.get("phone", "").strip(),
                user_role=user_role,
                department=department,
                password=password or None,
            )
            if result["success"]:
                flash("User account updated.", "success")
                return redirect(url_for("admin_dashboard.view_user", user_id=user_id))
            flash(result["message"], "danger")
            user.update(request.form.to_dict())

    return render_template(
        "admin_user_form.html",
        page_title="Edit User",
        user=user,
        roles=USER_ROLES,
        departments=DEPARTMENTS,
    )

@admin_dashboard_bp.route('/view/<int:requisition_id>')
def view_requisition(requisition_id):
    denied = require_admin()
    if denied:
        return denied
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