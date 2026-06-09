from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from db_connect import get_db_connection
from model import create_requisition, get_requisition_by_id, get_requisition_items, get_requisition_approvals

requisition_bp = Blueprint(
    "requisition",
    __name__,
    url_prefix="/requisition"
)

# =========================
# REQUISITION PAGE
# =========================
@requisition_bp.route("/")
def requisition_home():
    return render_template("requisition_form.html")


@requisition_bp.route("/form")
def requisition_form():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # departments
    cursor.execute("""
        SELECT department_id, department_name
        FROM departments
        ORDER BY department_name
    """)
    departments = cursor.fetchall()

    # USERS (created by)
    cursor.execute("""
        SELECT user_id, username
        FROM users
        WHERE status = 'active'
        ORDER BY username
    """)
    users = cursor.fetchall()

    conn.close()

    return render_template(
        "requisition_form.html",
        departments=departments,
        users=users
    )


# =========================
# SUBMIT REQUISITION
# =========================
@requisition_bp.route("/submit", methods=["POST"])
def submit_requisition():

    try:
        user_id = request.form.get("user_id")
        user_id = int(user_id)

        if not user_id:
            flash("You must login first", "error")
            return redirect(url_for("requisition.requisition_form"))

        department_id = request.form.get("department_id")
        submission_date = request.form.get("submission_date")

        if not department_id:
            flash("Select department", "error")
            return redirect(url_for("requisition.requisition_form"))

        items = []
        row = 0

        while True:
            material_name = request.form.get(f"material_name_{row}")

            if not material_name:
                break

            items.append({
                "material_name": material_name,
                "description": request.form.get(f"description_{row}", ""),
                "uom": request.form.get(f"uom_{row}", ""),
                "qty_stock": request.form.get(f"qty_stock_{row}") or 0,
                "qty_required": request.form.get(f"qty_required_{row}") or 0,
                "required_date": request.form.get(f"required_date_{row}"),
                "remark": request.form.get(f"remark_{row}", "")
            })

            row += 1

        result = create_requisition(user_id, department_id, submission_date, items)

        if result["success"]:
            flash(f"Requisition {result['prs_no']} created successfully!", "success")
            return redirect(url_for("maindashboard.home"))

        flash(result["message"], "error")
        return redirect(url_for("requisition.requisition_form"))

    except Exception as e:
        print("SUBMIT ERROR:", e)
        flash("System error occurred", "error")
        return redirect(url_for("requisition.requisition_form"))

# =========================
# API VIEW
# =========================
@requisition_bp.route("/api/<int:requisition_id>")
def requisition_api(requisition_id):

    requisition = get_requisition_by_id(requisition_id)
    items = get_requisition_items(requisition_id)
    approvals = get_requisition_approvals(requisition_id)

    return jsonify({
        "requisition": requisition,
        "items": items,
        "approvals": approvals
    })