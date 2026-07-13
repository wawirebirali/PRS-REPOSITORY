from flask import Blueprint, render_template, session, redirect, url_for


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


    # ==============================
    # CHECK LOGIN
    # ==============================

    if "user_id" not in session:
        return redirect(
            url_for("auth.user_login")
        )



    # ==============================
    # CHECK ROLE
    # ==============================

    if session.get("user_role") != "employee":
        return redirect(
            url_for("auth.user_login")
        )




    # ==============================
    # EMPTY DATA FOR TEMPLATE
    # ==============================


    return render_template(

        "employee_dashboard.html",


        # Dashboard Cards

        total_prs=0,

        pending_prs=0,

        approved_prs=0,

        rejected_prs=0,



        # Recent table

        recent_requests=[],



        # Requisition table

        requisitions=[]

    )