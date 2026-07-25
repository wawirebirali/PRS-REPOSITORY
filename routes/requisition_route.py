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


# =====================================================
# SUBMIT REQUISITION
# =====================================================

@requisition_bp.route(
    "/submit",
    methods=["POST"]
)
def submit_requisition():

    try:

        # =====================================================
        # CHECK LOGIN
        # =====================================================

        if "user_id" not in session:

            flash(
                "Please login first",
                "error"
            )

            return redirect(
                url_for("auth.user_login")
            )


        # =====================================================
        # GET LOGGED-IN USER
        # =====================================================

        user_id = session["user_id"]

        user_role = session.get(
            "user_role"
        )


        # =====================================================
        # GET SELECTED DEPARTMENT
        # =====================================================

        department_id = request.form.get(
            "department_id"
        )


        # =====================================================
        # GET SELECTED BUDGET ITEM
        #
        # This is actually the department_budget_id
        # =====================================================

        department_budget_id = request.form.get(
            "department_budget_id"
        )


        # =====================================================
        # GET SUBMISSION DATE
        # =====================================================

        submission_date = request.form.get(
            "submission_date"
        )


        # =====================================================
        # VALIDATE DEPARTMENT
        # =====================================================

        if not department_id:

            session["error_alert"] = (
                "Please select a department."
            )

            return redirect(
                url_for(
                    "hod_dashboard.hod_dashboard"
                )
            )


        # =====================================================
        # VALIDATE BUDGET ITEM
        # =====================================================

        if not department_budget_id:

            session["error_alert"] = (
                "Please select a budget item."
            )

            return redirect(
                url_for(
                    "hod_dashboard.hod_dashboard"
                )
            )


        # =====================================================
        # VERIFY SELECTED BUDGET BELONGS TO DEPARTMENT
        # =====================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        cursor.execute("""
            SELECT
                department_budget_id,
                department_id,
                budget_item
            FROM department_budget
            WHERE department_budget_id = %s
            AND department_id = %s
        """, (
            department_budget_id,
            department_id
        ))


        budget = cursor.fetchone()


        if not budget:

            cursor.close()
            conn.close()


            session["error_alert"] = (
                "Invalid budget item selected "
                "for the selected department."
            )


            return redirect(
                url_for(
                    "hod_dashboard.hod_dashboard"
                )
            )


        # =====================================================
        # GET REQUISITION ITEMS
        # =====================================================

        items = []

        row = 0


        while True:

            material_name = request.form.get(
                f"material_name_{row}"
            )


            if not material_name:

                break


            items.append({

                "material_name":
                    material_name,


                "description":
                    request.form.get(
                        f"description_{row}",
                        ""
                    ),


                "uom":
                    request.form.get(
                        f"uom_{row}",
                        ""
                    ),


                "qty_stock":
                    request.form.get(
                        f"qty_stock_{row}"
                    ) or 0,


                "qty_required":
                    request.form.get(
                        f"qty_required_{row}"
                    ) or 0,


                "required_date":
                    request.form.get(
                        f"required_date_{row}"
                    ),


                "remark":
                    request.form.get(
                        f"remark_{row}",
                        ""
                    )

            })


            row += 1


        # =====================================================
        # CLOSE DATABASE CONNECTION
        # =====================================================

        cursor.close()
        conn.close()


        # =====================================================
        # SAVE REQUISITION
        # =====================================================

        result = create_requisition(

            user_id,

            department_id,

            department_budget_id,

            submission_date,

            items

        )


        # =====================================================
        # SUCCESS / ERROR
        # =====================================================

        if result["success"]:

            session["success_alert"] = (

                f"Requisition "
                f"{result['prs_no']} "
                "created successfully!"

            )

        else:

            session["error_alert"] = (
                result["message"]
            )


        # =====================================================
        # REDIRECT
        # =====================================================

        if user_role == "employee":

            return redirect(
                url_for(
                    "employee_dashboard.employee_dashboard"
                )
            )


        elif user_role == "hod":

            return redirect(
                url_for(
                    "hod_dashboard.hod_dashboard"
                )
            )


        elif user_role == "procurement":

            return redirect(
                url_for(
                    "procurement_dashboard.procurement_dashboard"
                )
            )


        else:

            return redirect(
                url_for(
                    "maindashboard.home"
                )
            )


    except Exception as e:

        print(
            "SUBMIT REQUISITION ERROR:",
            e
        )


        session["error_alert"] = (
            "System error occurred while "
            "creating requisition"
        )


        return redirect(
            url_for(
                "hod_dashboard.hod_dashboard"
            )
        )





@requisition_bp.route(
    "/api/budget/department/<int:department_id>",
    methods=["GET"]
)
def get_department_budget_items(department_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                department_budget_id,
                budget_item
            FROM department_budget
            WHERE department_id = %s
            ORDER BY budget_item ASC
        """, (
            department_id,
        ))

        budgets = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": budgets
        })

    except Exception as e:

        print(
            "Error loading department budgets:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Failed to load department budgets.",
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()