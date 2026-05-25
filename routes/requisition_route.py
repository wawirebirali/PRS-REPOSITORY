from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from model import create_requisition

from flask import jsonify
from model import get_requisition_by_id, get_requisition_items, get_requisition_approvals

requisition_bp = Blueprint(
    "requisition",
    __name__,
    url_prefix="/requisition"
)

# =========================
# REQUISITION PAGE (UI ONLY)
# =========================
@requisition_bp.route("/")
def requisition_home():
    return render_template("requisition_form.html")

@requisition_bp.route("/form")
def requisition_form():
    return render_template("requisition_form.html")

@requisition_bp.route("/submit", methods=["POST"])
def submit_requisition():

    try:
        print("===== SUBMIT REQUISITION STARTED =====")

        # If user is logged in use their ID, otherwise None
        user_id = session.get("user_id", None)
        print("USER ID:", user_id)

        # Get form data
        department = request.form.get("department")
        submission_date = request.form.get("submission_date")

        print("DEPARTMENT:", department)
        print("SUBMISSION DATE:", submission_date)

        # Get dynamic table data
        items = []
        row_count = 0

        while True:
            material_name = request.form.get(f"material_name_{row_count}")
            print(f"Checking row {row_count} material_name:", material_name)

            if not material_name:
                print("No more rows found.")
                break

            item = {
                "material_name": material_name,
                "uom": request.form.get(f"uom_{row_count}"),
                "qty_stock": int(request.form.get(f"qty_stock_{row_count}", 0)),
                "qty_required": int(request.form.get(f"qty_required_{row_count}", 0)),
                "required_date": request.form.get(f"required_date_{row_count}"),
                "remark": request.form.get(f"remark_{row_count}", "")
            }

            print("ITEM ADDED:", item)

            items.append(item)
            row_count += 1

        print("TOTAL ITEMS:", len(items))
        print("ITEM LIST:", items)

        if not items:
            print("ERROR: No items were captured from the form.")
            flash("Please add at least one item", "error")
            return redirect(url_for("requisition.requisition_form"))

        # Create requisition
        print("CALLING create_requisition()")

        result = create_requisition(user_id, department, submission_date, items)

        print("RESULT FROM DATABASE FUNCTION:", result)

        if result["success"]:
            print("REQUISITION CREATED SUCCESSFULLY")
            flash(f"Requisition {result['prs_no']} created successfully!", "success")
            return redirect(url_for("maindashboard.home"))

        else:
            print("DATABASE INSERT FAILED:", result["message"])
            flash(result["message"], "error")
            return redirect(url_for("requisition.requisition_form"))

    except Exception as e:
        print("SUBMIT REQUISITION ERROR:", e)
        flash("An error occurred while submitting the requisition", "error")
        return redirect(url_for("requisition.requisition_form"))
    



# purshase slip page
# ==================================================
# VIEW REQUISITION (DISPLAY PRS)
# ==================================================





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