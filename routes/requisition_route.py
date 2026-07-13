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
# REQUISITION FORM
# =====================================================
# =====================================================
# LOAD REQUISITION FORM DATA
# =====================================================

@requisition_bp.route("/form_data")
def requisition_form_data():

    if "user_id" not in session:

        return jsonify({
            "success": False,
            "message": "Login required"
        }), 401


    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)


    try:

        # ===============================
        # DEPARTMENTS
        # ===============================

        cursor.execute("""
            SELECT 
                department_id,
                department_name
            FROM departments
            ORDER BY department_name
        """)

        departments = cursor.fetchall()



        # ===============================
        # USERS
        # ===============================

        cursor.execute("""
            SELECT
                user_id,
                username
            FROM users
            WHERE status='active'
            ORDER BY username
        """)

        users = cursor.fetchall()



        return jsonify({

            "success": True,

            "departments": departments,

            "users": users

        })


    except Exception as e:


        print(
            "FORM DATA ERROR:",
            e
        )


        return jsonify({

            "success":False,

            "message":"Server error"

        }),500



    finally:

        cursor.close()
        conn.close()



# =====================================================
# SUBMIT REQUISITION
# =====================================================
# =====================================================
# SUBMIT REQUISITION
# =====================================================

@requisition_bp.route("/submit", methods=["POST"])
def submit_requisition():

    try:

        # ===============================
        # CHECK LOGIN
        # ===============================

        if "user_id" not in session:

            flash(
                "Please login first",
                "error"
            )

            return redirect(
                url_for("auth.user_login")
            )



        user_id = session["user_id"]

        user_role = session.get("user_role")



        # ===============================
        # GET USER DEPARTMENT
        # ===============================

        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)



        cursor.execute("""
            SELECT 
                department_id
            FROM users
            WHERE user_id=%s
        """,(user_id,))


        user = cursor.fetchone()



        if not user:


            flash(
                "User department not found",
                "error"
            )


            cursor.close()
            conn.close()


            return redirect(
                url_for("maindashboard.home")
            )



        department_id = user["department_id"]



        submission_date = request.form.get(
            "submission_date"
        )



        # ===============================
        # GET ITEMS FROM FORM
        # ===============================


        items=[]

        row=0



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





        cursor.close()
        conn.close()




        # ===============================
        # SAVE REQUISITION
        # ===============================


        result = create_requisition(

            user_id,

            department_id,

            submission_date,

            items

        )





        # ===============================
        # SUCCESS
        # ===============================


        if result["success"]:


            session["success_alert"] = (

                f"Requisition {result['prs_no']} "
                "created successfully!"

            )


        else:


            session["error_alert"] = (

                result["message"]

            )






        # ===============================
        # REDIRECT
        # ===============================


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
            "System error occurred while creating requisition"
        )



        return redirect(
            url_for(
                "maindashboard.home"
            )
        )





# =====================================================
# REQUISITION API
# =====================================================


@requisition_bp.route(
    "/api/<int:requisition_id>"
)
def requisition_api(requisition_id):


    try:


        requisition = get_requisition_by_id(
            requisition_id
        )


        if not requisition:


            return jsonify({

                "success":False,

                "message":
                "Requisition not found"

            }),404





        items = get_requisition_items(
            requisition_id
        )


        approvals = get_requisition_approvals(
            requisition_id
        )



        return jsonify({

            "success":True,

            "requisition":requisition,

            "items":items,

            "approvals":approvals

        })




    except Exception as e:


        print(
            "REQUISITION API ERROR:",
            e
        )


        return jsonify({

            "success":False,

            "message":
            "Server error"

        }),500