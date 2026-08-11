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








@ceo_dashboard_bp.route("/api/departments", methods=["GET"])
def get_departments():

    conn = None
    cursor = None

    try:

        # Connect to MySQL
        conn = get_db_connection()

        # Create dictionary cursor
        cursor = conn.cursor(dictionary=True)


        # Get all departments
        cursor.execute("""
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        """)


        # Get database results
        departments = cursor.fetchall()


        # Return JSON response
        return jsonify({

            "success": True,

            "data": departments

        }), 200


    except Exception as e:

        print(
            "GET DEPARTMENTS ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to load departments.",

            "error":
                str(e)

        }), 500


    finally:

        # Close cursor
        if cursor:

            cursor.close()


        # Close database connection
        if conn:

            conn.close()

# ==========================================================
# CREATE COMPANY BUDGET
# AJAX URL:
# POST /ceo/api/budget/create
# ==========================================================





@ceo_dashboard_bp.route(
    "/api/budget/generate-number",
    methods=["GET"]
)
def generate_budget_number():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*)
            FROM company_budget
        """)

        result = cursor.fetchone()

        count = result[0] + 1

        budget_no = f"BUD-{count:04d}"

        return jsonify({
            "success": True,
            "budget_no": budget_no
        }), 200

    except Exception as e:

        print(
            "GENERATE BUDGET NUMBER ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": "Failed to generate budget number.",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()





@ceo_dashboard_bp.route(
    "/api/budget/create",
    methods=["POST"]
)
def create_company_budget():

    connection = None
    cursor = None

    try:

        # ==================================================
        # 1. GET JSON DATA SENT BY JAVASCRIPT
        # ==================================================

        data = request.get_json()

        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No budget data was received."

            }), 400


        # ==================================================
        # 2. GET VALUES FROM JSON
        # ==================================================

        budget_no = data.get(
            "budget_no"
        )

        financial_year = data.get(
            "financial_year"
        )

        department_id = data.get(
            "department_id"
        )

        allocated_amount = data.get(
            "allocated_amount"
        )

        budget_type = data.get(
            "budget_type"
        )

        start_date = data.get(
            "start_date"
        )

        end_date = data.get(
            "end_date"
        )

        remarks = data.get(
            "remarks"
        )


        # ==================================================
        # 3. VALIDATE REQUIRED FIELDS
        # ==================================================

        if not financial_year:

            return jsonify({

                "success": False,

                "message":
                    "Financial year is required."

            }), 400


        if not department_id:

            return jsonify({

                "success": False,

                "message":
                    "Department is required."

            }), 400


        if allocated_amount is None:

            return jsonify({

                "success": False,

                "message":
                    "Allocated amount is required."

            }), 400


        if float(allocated_amount) <= 0:

            return jsonify({

                "success": False,

                "message":
                    "Allocated amount must be greater than zero."

            }), 400


        if not budget_type:

            return jsonify({

                "success": False,

                "message":
                    "Budget type is required."

            }), 400


        if not start_date:

            return jsonify({

                "success": False,

                "message":
                    "Start date is required."

            }), 400


        if not end_date:

            return jsonify({

                "success": False,

                "message":
                    "End date is required."

            }), 400


        # ==================================================
        # 4. GET LOGGED-IN CEO
        # ==================================================

        created_by = session.get(
            "user_id"
        )


        if not created_by:

            return jsonify({

                "success": False,

                "message":
                    "User session has expired. Please login again."

            }), 401


        # ==================================================
        # 5. CONNECT TO MYSQL
        # ==================================================

        connection = get_db_connection()

        cursor = connection.cursor()


        # ==================================================
        # 6. GENERATE BUDGET NUMBER IF NOT PROVIDED
        # ==================================================

        if not budget_no:

            cursor.execute("""

                SELECT
                    COUNT(*) + 1

                FROM company_budget

            """)

            result = cursor.fetchone()

            next_number = result[0]


            budget_no = (
                "BUD-"
                + str(next_number).zfill(4)
            )


        # ==================================================
        # 7. CHECK FOR DUPLICATE BUDGET NUMBER
        # ==================================================

        cursor.execute("""

            SELECT
                company_budget_id

            FROM company_budget

            WHERE budget_no = %s

        """, (budget_no,))


        existing_budget = cursor.fetchone()


        if existing_budget:

            return jsonify({

                "success": False,

                "message":
                    "Budget number already exists."

            }), 409


        # ==================================================
        # 8. INSERT COMPANY BUDGET
        # ==================================================

        sql = """

            INSERT INTO company_budget (

                budget_no,

                financial_year,

                department_id,

                allocated_amount,

                budget_type,

                start_date,

                end_date,

                remarks,

                created_by

            )

            VALUES (

                %s,

                %s,

                %s,

                %s,

                %s,

                %s,

                %s,

                %s,

                %s

            )

        """


        values = (

            budget_no,

            financial_year,

            department_id,

            allocated_amount,

            budget_type,

            start_date,

            end_date,

            remarks,

            created_by

        )


        cursor.execute(
            sql,
            values
        )


        # ==================================================
        # 9. SAVE CHANGES
        # ==================================================

        connection.commit()


        # ==================================================
        # 10. GET NEW BUDGET ID
        # ==================================================

        company_budget_id = cursor.lastrowid


        # ==================================================
        # 11. RETURN SUCCESS RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "message":
                "Company budget created successfully.",

            "company_budget_id":
                company_budget_id,

            "budget_no":
                budget_no

        }), 201


    # ======================================================
    # HANDLE DATABASE ERRORS
    # ======================================================

    except Exception as e:

        if connection:

            connection.rollback()


        print(
            "CREATE BUDGET ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to create company budget.",

            "error":
                str(e)

        }), 500


    # ======================================================
    # CLOSE DATABASE CONNECTION
    # ======================================================

    finally:

        if cursor:

            cursor.close()


        if connection:

            connection.close()




# ==========================================================
# GET COMPANY BUDGETS
#
# URL:
# GET /ceo/api/company-budgets
# ==========================================================
@ceo_dashboard_bp.route(
    "/api/company-budgets",
    methods=["GET"]
)
def get_company_budgets():

    conn = None
    cursor = None

    try:

        # ==================================================
        # 1. CONNECT TO DATABASE
        # ==================================================

        conn = get_db_connection()


        # ==================================================
        # 2. CREATE DICTIONARY CURSOR
        # ==================================================

        cursor = conn.cursor(
            dictionary=True
        )


        # ==================================================
        # 3. GET COMPANY BUDGETS
        #    AND SUM DEPARTMENT BUDGETS
        # ==================================================

        cursor.execute("""

            SELECT

                cb.company_budget_id,

                cb.budget_no,

                cb.financial_year,

                cb.department_id,

                d.department_name,

                cb.allocated_amount
                    AS total_budget,

                cb.budget_type,

                cb.start_date,

                cb.end_date,

                cb.remarks,

                cb.created_by,

                u.username
                    AS created_by_name,

                cb.created_at,

                cb.updated_at,


                -- ==========================================
                -- SUM ALL DEPARTMENT BUDGETS
                -- FOR THIS COMPANY BUDGET
                -- ==========================================

                COALESCE(
                    SUM(
                        db.total_budget
                    ),
                    0
                ) AS spent


            FROM company_budget cb


            -- ==============================================
            -- JOIN DEPARTMENTS
            -- ==============================================

            LEFT JOIN departments d

                ON cb.department_id =
                   d.department_id


            -- ==============================================
            -- JOIN USERS
            -- ==============================================

            LEFT JOIN users u

                ON cb.created_by =
                   u.user_id


            -- ==============================================
            -- JOIN DEPARTMENT BUDGET
            --
            -- This connects department budgets
            -- to their company budget
            -- ==============================================

            LEFT JOIN department_budget db

                ON cb.company_budget_id =
                   db.company_budget_id


            -- ==============================================
            -- GROUP BY COMPANY BUDGET
            -- ==============================================

            GROUP BY

                cb.company_budget_id,

                cb.budget_no,

                cb.financial_year,

                cb.department_id,

                d.department_name,

                cb.allocated_amount,

                cb.budget_type,

                cb.start_date,

                cb.end_date,

                cb.remarks,

                cb.created_by,

                u.username,

                cb.created_at,

                cb.updated_at


            -- ==============================================
            -- ORDER BY LATEST BUDGET
            -- ==============================================

            ORDER BY

                cb.created_at DESC

        """)


        # ==================================================
        # 4. FETCH ALL RESULTS
        # ==================================================

        budgets = cursor.fetchall()


        # ==================================================
        # 5. CONVERT VALUES TO JSON-SAFE STRINGS
        # ==================================================

        for budget in budgets:


            # ==============================================
            # START DATE
            # ==============================================

            if budget.get(
                "start_date"
            ):

                budget[
                    "start_date"
                ] = str(
                    budget[
                        "start_date"
                    ]
                )


            # ==============================================
            # END DATE
            # ==============================================

            if budget.get(
                "end_date"
            ):

                budget[
                    "end_date"
                ] = str(
                    budget[
                        "end_date"
                    ]
                )


            # ==============================================
            # CREATED DATE
            # ==============================================

            if budget.get(
                "created_at"
            ):

                budget[
                    "created_at"
                ] = str(
                    budget[
                        "created_at"
                    ]
                )


            # ==============================================
            # UPDATED DATE
            # ==============================================

            if budget.get(
                "updated_at"
            ):

                budget[
                    "updated_at"
                ] = str(
                    budget[
                        "updated_at"
                    ]
                )


            # ==============================================
            # CONVERT SPENT TO FLOAT
            # ==============================================

            if budget.get(
                "spent"
            ) is not None:

                budget[
                    "spent"
                ] = float(
                    budget[
                        "spent"
                    ]
                )

            else:

                budget[
                    "spent"
                ] = 0.0


            # ==============================================
            # CALCULATE BALANCE
            #
            # Company Budget
            # MINUS
            # Total Department Budgets
            # ==============================================

            total_budget = float(
                budget.get(
                    "total_budget"
                ) or 0
            )


            spent = float(
                budget.get(
                    "spent"
                ) or 0
            )


            budget[
                "balance"
            ] = (
                total_budget -
                spent
            )


        # ==================================================
        # 6. RETURN JSON RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "data": budgets

        }), 200


    # ======================================================
    # HANDLE ERRORS
    # ======================================================

    except Exception as e:

        import traceback

        traceback.print_exc()


        return jsonify({

            "success": False,

            "message":
                "Failed to load company budgets.",

            "error":
                str(e)

        }), 500


    # ======================================================
    # CLOSE DATABASE CONNECTION
    # ======================================================

    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()
    # ======================================================
    # CLOSE DATABASE CONNECTION
    # ======================================================

    







# ==========================================================
# APPROVE DEPARTMENT BUDGET
# ==========================================================
# POST /ceo/api/department-budget/<department_budget_id>/approve
# ==========================================================

# ==========================================================
# CEO BUDGET MANAGEMENT ROUTES
# ==========================================================



@ceo_dashboard_bp.route(
    "/api/department-budget/<int:department_budget_id>/approval",
    methods=["PUT"]
)
def update_department_budget_approval(
    department_budget_id
):

    conn = None
    cursor = None

    try:

        # ==================================================
        # GET LOGGED-IN CEO
        # ==================================================

        ceo_user_id = session.get(
            "user_id"
        )

        if not ceo_user_id:

            return jsonify({

                "success": False,

                "message":
                    "CEO is not logged in."

            }), 401


        # ==================================================
        # GET JSON DATA
        # ==================================================

        data = request.get_json()

        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No approval data received."

            }), 400


        # ==================================================
        # GET CEO STATUS
        # ==================================================

        ceo_status = data.get(
                "ceo_status"
            )


        # ==================================================
        # VALIDATE STATUS
        # ==================================================

        allowed_statuses = [

            "Approved",

            "Rejected"

        ]


        if ceo_status not in allowed_statuses:

            return jsonify({

                "success": False,

                "message":
                    "Invalid CEO approval status."

            }), 400


        # ==================================================
        # CONNECT DATABASE
        # ==================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ==================================================
        # CHECK DEPARTMENT BUDGET EXISTS
        # ==================================================

        cursor.execute("""
            SELECT
                department_budget_id,
                company_budget_id,
                ceo_status

            FROM department_budget

            WHERE department_budget_id = %s

        """, (
            department_budget_id,
        ))


        budget = cursor.fetchone()


        if not budget:

            return jsonify({

                "success": False,

                "message":
                    "Department budget not found."

            }), 404


        # ==================================================
        # UPDATE CEO APPROVAL
        # ==================================================

        cursor.execute("""
            UPDATE department_budget

            SET
                ceo_status = %s,

                ceo_user_id = %s,

                ceo_approval_date = NOW(),

                updated_at = NOW()

            WHERE department_budget_id = %s

        """, (

            ceo_status,

            ceo_user_id,

            department_budget_id

        ))


        conn.commit()


        # ==================================================
        # RETURN SUCCESS
        # ==================================================

        return jsonify({

            "success": True,

            "message":
                f"Department budget {ceo_status.lower()} successfully.",

            "department_budget_id":
                department_budget_id,

            "ceo_status":
                ceo_status

        }), 200


    except Exception as e:

        if conn:

            conn.rollback()


        print(
            "Department Budget Approval Error:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to update department budget approval.",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()


# ==========================================================
# GET DEPARTMENT BUDGETS FOR A COMPANY BUDGET
# ==========================================================

@ceo_dashboard_bp.route(
    "/api/company-budget/<int:company_budget_id>/department-budgets",
    methods=["GET"]
)
def get_department_budgets_for_company(company_budget_id):

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        cursor.execute("""
            SELECT
                db.department_budget_id,
                db.company_budget_id,
                db.department_id,
                db.budget_no,
                db.budget_item,
                db.quantity,
                db.unit_cost,
                db.total_budget,
                db.budget_type,
                db.start_date,
                db.end_date,
                db.ceo_status,
                db.ceo_approval_date,
                d.department_name

            FROM department_budget AS db

            LEFT JOIN departments AS d
                ON db.department_id = d.department_id

            WHERE db.company_budget_id = %s

            ORDER BY db.department_budget_id DESC

        """, (
            company_budget_id,
        ))

        department_budgets = cursor.fetchall()

        return jsonify({

            "success": True,

            "data": department_budgets

        }), 200


    except Exception as e:

        print(
            "Load Department Budgets Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load department budgets.",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()





@ceo_dashboard_bp.route("/api/department/<int:department_id>/budget-items", methods=["GET"])
def get_department_budget_items(department_id):

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT
                department_budget_id,
                budget_no,
                budget_item,
                quantity,
                unit_cost,
                total_budget,
                budget_type,
                start_date,
                end_date,
                remarks,
                ceo_status
            FROM department_budget
            WHERE department_id = %s
            ORDER BY department_budget_id DESC
        """

        cursor.execute(query, (department_id,))
        items = cursor.fetchall()

        cursor.close()
        conn.close()

        return {
            "success": True,
            "data": items
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }, 500


import pickle
import os


MODEL_PATH = r"C:\YR3  SEM2\PRMS SYSTEM\AI\budget_model.pkl"


with open(MODEL_PATH, "rb") as file:
    model_data = pickle.load(file)


budget_model = model_data["model"]
encoder = model_data["encoder"]
model_features = model_data["features"]


print("AI MODEL LOADED")
print("FEATURES:", model_features)


@ceo_dashboard_bp.route("/api/predict-budget", methods=["POST"])
def predict_budget():

    try:

        data = request.get_json()

        department_id = data.get("department_id")


        if not department_id:

            return {
                "success": False,
                "error": "Department ID is required"
            }, 400



        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)



        query = """

        SELECT

            d.department_id,


            COALESCE(cb.allocated_amount,0)
            AS company_allocated_amount,


            COALESCE(SUM(db.quantity),0)
            AS budget_quantity,


            COALESCE(AVG(db.unit_cost),0)
            AS budget_unit_cost,



            COUNT(DISTINCT r.requisition_id)
            AS total_requisitions,



            COUNT(DISTINCT ri.item_id)
            AS total_requested_items,



            COALESCE(SUM(ri.qty_required),0)
            AS requested_quantity,



            COUNT(DISTINCT po.purchase_order_id)
            AS total_purchase_orders,



            COALESCE(SUM(poi.quantity),0)
            AS ordered_quantity,



            COALESCE(
                SUM(poi.quantity * poi.unit_price),
                0
            )
            AS purchase_order_cost,



            COALESCE(
                AVG(poi.unit_price),
                0
            )
            AS average_unit_price,



            COUNT(DISTINCT g.grn_id)
            AS total_grn_received,



            COALESCE(
                SUM(gi.quantity_received),
                0
            )
            AS received_quantity,



            COALESCE(
                SUM(gi.quantity_rejected),
                0
            )
            AS rejected_quantity,



            CASE

                WHEN COALESCE(cb.allocated_amount,0) > 0

                THEN

                (

                    COALESCE(
                        SUM(poi.quantity * poi.unit_price),
                        0
                    )

                    /

                    cb.allocated_amount

                ) * 100


                ELSE 0


            END

            AS budget_utilization_percentage,



            (

                COALESCE(cb.allocated_amount,0)

                -

                COALESCE(
                    SUM(poi.quantity * poi.unit_price),
                    0
                )

            )

            AS remaining_budget,



            CASE

                WHEN COUNT(DISTINCT g.grn_id) > 0

                THEN 100

                ELSE 0

            END

            AS delivery_completion_percentage



        FROM departments d



        LEFT JOIN department_budget db

        ON d.department_id = db.department_id



        LEFT JOIN company_budget cb

        ON db.company_budget_id = cb.company_budget_id



        LEFT JOIN requisitions r

        ON d.department_id = r.department_id



        LEFT JOIN requisition_items ri

        ON r.requisition_id = ri.requisition_id



        LEFT JOIN purchase_orders po

        ON r.requisition_id = po.requisition_id



        LEFT JOIN purchase_order_items poi

        ON po.purchase_order_id = poi.purchase_order_id



        LEFT JOIN grn g

        ON po.purchase_order_id = g.po_id



        LEFT JOIN grn_items gi

        ON g.grn_id = gi.grn_id



        WHERE d.department_id = %s



        GROUP BY

            d.department_id,

            cb.allocated_amount

        """



        cursor.execute(
            query,
            (department_id,)
        )


        result = cursor.fetchone()



        cursor.close()

        conn.close()



        if not result:

            return {

                "success":False,

                "error":"No department budget data found"

            },404




        model_input = [[

            result["department_id"],

            result["company_allocated_amount"],

            result["budget_quantity"],

            result["budget_unit_cost"],

            result["total_requisitions"],

            result["total_requested_items"],

            result["requested_quantity"],

            result["total_purchase_orders"],

            result["ordered_quantity"],

            result["purchase_order_cost"],

            result["average_unit_price"],

            result["total_grn_received"],

            result["received_quantity"],

            result["rejected_quantity"],

            result["budget_utilization_percentage"],

            result["remaining_budget"],

            result["delivery_completion_percentage"]

        ]]



        prediction = budget_model.predict(model_input)



        return {

            "success": True,

            "department_id": department_id,

            "predicted_budget": float(prediction[0]),

            "prediction_source": "Random Forest AI Model"


        }



    except Exception as e:


        return {

            "success":False,

            "error":str(e)

        },500