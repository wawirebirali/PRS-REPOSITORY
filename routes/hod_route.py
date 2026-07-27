from flask import Blueprint, render_template, session, redirect, url_for, jsonify, request
from model import get_db_connection
from datetime import datetime

hod_dashboard_bp = Blueprint("hod_dashboard", __name__)


def get_hod_department(cursor):

    user_id = session.get("user_id")

    if not user_id:
        return None


    cursor.execute("""
        SELECT

            d.department_id,

            d.department_name

        FROM users u

        INNER JOIN departments d

            ON TRIM(
                LOWER(u.department)
            )
            =
            TRIM(
                LOWER(d.department_name)
            )

        WHERE u.user_id = %s

        LIMIT 1

    """, (
        user_id,
    ))


    return cursor.fetchone()

# =========================================================
# DASHBOARD PAGE
# =========================================================
# ============================================================
# HOD DASHBOARD PAGE
# ============================================================
# ============================================================
# HOD DASHBOARD PAGE
# ============================================================

@hod_dashboard_bp.route("/", methods=["GET"])
def hod_dashboard():

    # ========================================================
    # CHECK USER ROLE
    # ========================================================

    if session.get("user_role") != "hod":

        return redirect(
            url_for("auth.login")
        )


    conn = None
    cursor = None


    try:

        # ====================================================
        # DATABASE CONNECTION
        # ====================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # GET LOGGED-IN USER DEPARTMENT
        # ====================================================

        department = get_hod_department(
            cursor
        )


        # ====================================================
        # CHECK DEPARTMENT
        # ====================================================

        if not department:

            return jsonify({

                "success": False,

                "message":
                    "Logged-in HOD department could not be determined."

            }), 400


        # ====================================================
        # GET DEPARTMENT INFORMATION
        # ====================================================

        department_id = department[
            "department_id"
        ]

        department_name = department[
            "department_name"
        ]


        # ====================================================
        # LOAD REQUISITIONS FOR LOGGED-IN
        # HOD DEPARTMENT ONLY
        #
        # STATUS:
        # Gets status ONLY from approvals.final_status
        #
        # If final_status is NULL:
        # status = PENDING
        #
        # DUE:
        # Current date - submission date
        # ====================================================

        cursor.execute("""
            SELECT

                r.requisition_id,

                r.prs_no,

                d.department_name,

                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS status,

                DATEDIFF(
                    CURDATE(),
                    DATE(r.submission_date)
                ) AS due,

                r.submission_date


            FROM requisitions r


            LEFT JOIN departments d

                ON r.department_id =
                   d.department_id


            LEFT JOIN approvals a

                ON a.module_name = 'PRS'

                AND a.document_id =
                    r.requisition_id


            WHERE r.department_id = %s


            ORDER BY
                r.requisition_id DESC

        """, (
            department_id,
        ))


        requisitions = cursor.fetchall()


        # ====================================================
        # RENDER HOD DASHBOARD
        # ====================================================

        return render_template(

            "hod_dashboard.html",

            requisitions=requisitions,

            department_id=department_id,

            department_name=department_name

        )


    except Exception as e:

        print(
            "HOD Dashboard Error:",
            str(e)
        )


        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()
# =========================================================
# REQUISITION DETAILS API
# =========================================================
@hod_dashboard_bp.route("/requisition/api/<int:requisition_id>")
def requisition_api(requisition_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================================
        # HEADER + APPROVALS + USERS
        # =====================================================
        cursor.execute("""
            SELECT 
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.ceo_status,'PENDING') AS ceo_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                u.user_id AS creator_id,
                u.username AS creator_name,
                u.signature AS creator_signature

            FROM requisitions r

            LEFT JOIN departments d 
                ON r.department_id = d.department_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PRS'
                AND a.document_id = r.requisition_id

            LEFT JOIN users u 
                ON u.user_id = r.user_id

            WHERE r.requisition_id = %s
        """, (requisition_id,))

        requisition = cursor.fetchone()

        if not requisition:
            return jsonify({"success": False, "message": "Not found"}), 404

        # =====================================================
        # ITEMS
        # =====================================================
        cursor.execute("""
            SELECT 
                item_id,
                material_name,
                uom,
                qty_required
            FROM requisition_items
            WHERE requisition_id = %s
        """, (requisition_id,))

        items = cursor.fetchall()

        # =====================================================
        # HOD SIGNATURE
        # =====================================================
        cursor.execute("""
            SELECT 
                u.username,
                u.signature,
                a.hod_approved_at
            FROM approvals a
            LEFT JOIN users u ON u.user_id = a.hod_user_id
            WHERE a.module_name = 'PRS'
              AND a.document_id = %s
              AND a.hod_status = 'APPROVED'
            LIMIT 1
        """, (requisition_id,))

        hod_sig = cursor.fetchone()

        # =====================================================
        # CEO SIGNATURE
        # =====================================================
        cursor.execute("""
            SELECT 
                u.username,
                u.signature,
                a.ceo_approved_at
            FROM approvals a
            LEFT JOIN users u ON u.user_id = a.ceo_user_id
            WHERE a.module_name = 'PRS'
              AND a.document_id = %s
              AND a.ceo_status = 'APPROVED'
            LIMIT 1
        """, (requisition_id,))

        ceo_sig = cursor.fetchone()

        return jsonify({
            "success": True,
            "requisition": requisition,
            "items": items,
            "created_by": {
                "name": requisition["creator_name"],
                "signature": requisition["creator_signature"]
            },
            "hod_signature": hod_sig,
            "ceo_signature": ceo_sig
        })

    finally:
        cursor.close()
        conn.close()


# =========================================================
# UNIVERSAL APPROVAL API (HOD + CEO)
# =========================================================
@hod_dashboard_bp.route("/approve", methods=["POST"])
def approve_document():

    data = request.get_json()

    module_name = data.get("module_name")
    document_id = data.get("document_id")
    action = data.get("action", "APPROVED").upper()

    user_id = session.get("user_id")
    role = session.get("user_role")

    if not module_name or not document_id:
        return jsonify({
            "success": False,
            "message": "Missing data"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        table_map = {
            "PRS": ("requisitions", "requisition_id"),
            "QRF": ("quotation_requests", "qrf_id"),
            "QUOTATION": ("quotations", "quotation_id"),
            "PO": ("purchase_orders", "purchase_order_id"),
            "GRN": ("grn", "grn_id"),
            "INVOICE": ("invoices", "invoice_id"),
            "PAYMENT": ("payments", "payment_id")
        }

        # -----------------------------
        # Create approval row if missing
        # -----------------------------
        cursor.execute("""
            SELECT *
            FROM approvals
            WHERE module_name=%s
            AND document_id=%s
        """, (module_name, document_id))

        approval = cursor.fetchone()

        if not approval:

            cursor.execute("""
                INSERT INTO approvals(
                    module_name,
                    document_id
                )
                VALUES(%s,%s)
            """, (module_name, document_id))

            conn.commit()

            cursor.execute("""
                SELECT *
                FROM approvals
                WHERE module_name=%s
                AND document_id=%s
            """, (module_name, document_id))

            approval = cursor.fetchone()

        # ==========================================
        # HOD
        # ==========================================
        if role == "hod":

            if approval["hod_status"] in ("APPROVED", "REJECTED"):

                return jsonify({
                    "success": False,
                    "message": "This document has already been processed by HOD."
                })

            cursor.execute("""
                UPDATE approvals
                SET
                    hod_status=%s,
                    hod_user_id=%s,
                    hod_approved_at=NOW(),
                    final_status=
                        CASE
                            WHEN %s='REJECTED'
                            THEN 'REJECTED'
                            ELSE final_status
                        END
                WHERE module_name=%s
                AND document_id=%s
            """, (
                action,
                user_id,
                action,
                module_name,
                document_id
            ))

            if action == "REJECTED":

                table, pk = table_map[module_name]

                cursor.execute(f"""
                    UPDATE {table}
                    SET status='REJECTED'
                    WHERE {pk}=%s
                """, (document_id,))

        # ==========================================
        # CEO
        # ==========================================
        elif role == "ceo":

            if approval["hod_status"] != "APPROVED":

                return jsonify({
                    "success": False,
                    "message": "HOD must approve first."
                })

            if approval["ceo_status"] in ("APPROVED", "REJECTED"):

                return jsonify({
                    "success": False,
                    "message": "This document has already been processed by CEO."
                })

            cursor.execute("""
                UPDATE approvals
                SET
                    ceo_status=%s,
                    ceo_user_id=%s,
                    ceo_approved_at=NOW(),
                    final_status=%s
                WHERE module_name=%s
                AND document_id=%s
            """, (
                action,
                user_id,
                action,
                module_name,
                document_id
            ))

            table, pk = table_map[module_name]

            cursor.execute(f"""
                UPDATE {table}
                SET status=%s
                WHERE {pk}=%s
            """, (
                action,
                document_id
            ))

        else:

            return jsonify({
                "success": False,
                "message": "Unauthorized"
            }), 403

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"{role.upper()} {action} successfully."
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()
# =========================================================
# SIGNATURE API
# =========================================================
@hod_dashboard_bp.route("/document/signature/<int:document_id>/<string:module_name>")
def get_signature(document_id, module_name):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # CREATED BY
    cursor.execute("""
        SELECT u.user_id, u.username, u.signature
        FROM requisitions r
        JOIN users u ON u.user_id = r.user_id
        WHERE r.requisition_id = %s
    """, (document_id,))

    created_by = cursor.fetchone()

    # HOD SIGNATURE
    cursor.execute("""
        SELECT 
            u.user_id,
            u.username,
            u.signature,
            a.hod_approved_at,
            a.hod_status
        FROM approvals a
        LEFT JOIN users u ON u.user_id = a.hod_user_id
        WHERE a.module_name = %s
          AND a.document_id = %s
          AND a.hod_status = 'APPROVED'
        ORDER BY a.hod_approved_at DESC
        LIMIT 1
    """, (module_name, document_id))

    hod = cursor.fetchone()

    # CEO SIGNATURE
    cursor.execute("""
        SELECT 
            u.user_id,
            u.username,
            u.signature,
            a.ceo_approved_at,
            a.ceo_status
        FROM approvals a
        LEFT JOIN users u ON u.user_id = a.ceo_user_id
        WHERE a.module_name = %s
          AND a.document_id = %s
          AND a.ceo_status = 'APPROVED'
        ORDER BY a.ceo_approved_at DESC
        LIMIT 1
    """, (module_name, document_id))

    ceo = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "created_by": created_by,
        "hod": hod,
        "ceo": ceo
    })




# =========================================================
# QRF MODULE (HOD DASHBOARD EXTENSION)
# =========================================================

# ============================================================
# QRF DATA FOR LOGGED-IN USER'S DEPARTMENT
# ============================================================

@hod_dashboard_bp.route("/qrf/data")
def qrf_data():

    conn = None
    cursor = None

    try:

        # ====================================================
        # DATABASE CONNECTION
        # ====================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # GET LOGGED-IN USER DEPARTMENT
        # ====================================================

        department = get_hod_department(
            cursor
        )


        # ====================================================
        # CHECK DEPARTMENT
        # ====================================================

        if not department:

            return jsonify({

                "success": False,

                "message":
                    "Logged-in user's department could not be determined.",

                "data": []

            }), 400


        # ====================================================
        # GET DEPARTMENT ID
        # ====================================================

        department_id = department[
            "department_id"
        ]


        # ====================================================
        # LOAD QRF DATA FOR LOGGED-IN USER'S DEPARTMENT
        # ====================================================

        cursor.execute("""
            SELECT

                qr.qrf_id,

                qr.qrf_no,

                qr.request_date,

                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS status,

                r.prs_no,

                d.department_name,

                u.username AS requester_name


            FROM quotation_requests qr


            LEFT JOIN approvals a

                ON a.module_name = 'QRF'

                AND a.document_id =
                    qr.qrf_id


            LEFT JOIN requisitions r

                ON qr.requisition_id =
                   r.requisition_id


            LEFT JOIN departments d

                ON r.department_id =
                   d.department_id


            LEFT JOIN users u

                ON qr.requested_by =
                   u.user_id


            WHERE r.department_id = %s


            ORDER BY
                qr.qrf_id DESC

        """, (
            department_id,
        ))


        rows = cursor.fetchall()


        # ====================================================
        # RETURN DATA
        # ====================================================

        return jsonify({

            "success": True,

            "department_id":
                department_id,

            "department_name":
                department[
                    "department_name"
                ],

            "data":
                rows

        })


    except Exception as e:

        print(
            "QRF Data Error:",
            str(e)
        )


        return jsonify({

            "success": False,

            "error":
                str(e),

            "data": []

        }), 500


    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()


# ==========================================================
# LOAD DEPARTMENTS
# GET /hod/api/departments
# ==========================================================

@hod_dashboard_bp.route(
    "/api/departments",
    methods=["GET"]
)
def get_departments():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        cursor.execute("""
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        """)


        departments = cursor.fetchall()


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

        if cursor:

            cursor.close()


        if conn:

            conn.close()



# ==========================================================
# GET COMPANY BUDGET FOR SELECTED DEPARTMENT
#
# GET:
# /hod/api/company-budget/<department_id>
#
# WHEN HOD SELECTS A DEPARTMENT,
# THIS RETURNS THE COMPANY BUDGET BELONGING TO THAT DEPARTMENT
# ==========================================================

@hod_dashboard_bp.route(
    "/api/company-budget/<int:department_id>",
    methods=["GET"]
)
def get_company_budget_for_department(
    department_id
):

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ==================================================
        # FIND COMPANY BUDGET FOR SELECTED DEPARTMENT
        # ==================================================

        cursor.execute("""
            SELECT

                company_budget_id,

                budget_no,

                financial_year,

                department_id,

                allocated_amount,

                budget_type,

                start_date,

                end_date,

                remarks

            FROM company_budget

            WHERE department_id = %s

            ORDER BY company_budget_id DESC

            LIMIT 1

        """, (
            department_id,
        ))


        company_budget = cursor.fetchone()


        # ==================================================
        # NO COMPANY BUDGET FOUND
        # ==================================================

        if not company_budget:

            return jsonify({

                "success": False,

                "message":
                    "No company budget found for the selected department."

            }), 404


        # ==================================================
        # RETURN COMPANY BUDGET
        # ==================================================

        return jsonify({

            "success": True,

            "data": {

                "company_budget_id":
                    company_budget[
                        "company_budget_id"
                    ],

                "budget_no":
                    company_budget[
                        "budget_no"
                    ],

                "financial_year":
                    company_budget[
                        "financial_year"
                    ],

                "department_id":
                    company_budget[
                        "department_id"
                    ],

                "allocated_amount":
                    company_budget[
                        "allocated_amount"
                    ],

                "budget_type":
                    company_budget[
                        "budget_type"
                    ],

                "start_date":
                    str(
                        company_budget[
                            "start_date"
                        ]
                    ),

                "end_date":
                    str(
                        company_budget[
                            "end_date"
                        ]
                    ),

                "remarks":
                    company_budget[
                        "remarks"
                    ]

            }

        }), 200


    except Exception as e:

        print(
            "GET COMPANY BUDGET ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to load company budget.",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()



# ==========================================================
# INSERT DEPARTMENT BUDGET
# ==========================================================

def insert_department_budget(

    company_budget_id,

    budget_no,

    department_id,

    budget_item,

    quantity,

    unit_cost,

    budget_type,

    start_date,

    end_date,

    remarks,

    created_by

):

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor()


        # ==================================================
        # INSERT INTO DEPARTMENT BUDGET
        # ==================================================

        cursor.execute("""
            INSERT INTO department_budget
            (
                company_budget_id,

                budget_no,

                department_id,

                budget_item,

                quantity,

                unit_cost,

                budget_type,

                start_date,

                end_date,

                remarks,

                created_by
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
                %s,
                %s
            )

        """,

        (

            company_budget_id,

            budget_no,

            department_id,

            budget_item,

            quantity,

            unit_cost,

            budget_type,

            start_date,

            end_date,

            remarks,

            created_by

        ))


        # ==================================================
        # SAVE
        # ==================================================

        conn.commit()


        # ==================================================
        # GET CREATED BUDGET ID
        # ==================================================

        budget_id = cursor.lastrowid


        return budget_id


    except Exception:

        if conn:

            conn.rollback()

        raise


    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()



# ==========================================================
# CREATE DEPARTMENT BUDGET API
#
# POST:
# /hod/api/budget/create
# ==========================================================

@hod_dashboard_bp.route(
    "/api/budget/create",
    methods=["POST"]
)
def create_budget():

    # ==================================================
    # CHECK LOGIN
    # ==================================================

    if "user_id" not in session:

        return jsonify({

            "success": False,

            "message":
                "Please login first."

        }), 401


    try:

        # ==================================================
        # GET JSON DATA
        # ==================================================

        data = request.get_json()


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No budget data received."

            }), 400


        # ==================================================
        # GET VALUES
        # ==================================================

        company_budget_id = data.get(
                "company_budget_id"
            )


        department_id =  data.get(
                "department_id"
            )


        budget_item =  data.get(
                "budget_item"
            )


        quantity = data.get(
                "quantity",
                1
            )


        unit_cost = data.get(
                "unit_cost"
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
                "remarks",
                ""
            )


        # ==================================================
        # VALIDATION
        # ==================================================

        if not company_budget_id:

            return jsonify({

                "success": False,

                "message":
                    "Company budget is required."

            }), 400


        if not department_id:

            return jsonify({

                "success": False,

                "message":
                    "Department is required."

            }), 400


        if not budget_item:

            return jsonify({

                "success": False,

                "message":
                    "Budget item is required."

            }), 400


        if not unit_cost:

            return jsonify({

                "success": False,

                "message":
                    "Unit cost is required."

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
        # GENERATE DEPARTMENT BUDGET NUMBER
        # ==================================================

        budget_no = (

            "DBUD-"

            +

            datetime.now().strftime(
                "%Y%m%d%H%M%S"
            )

        )


        # ==================================================
        # INSERT DEPARTMENT BUDGET
        # ==================================================

        budget_id = insert_department_budget(

                company_budget_id =
                    company_budget_id,

                budget_no =
                    budget_no,

                department_id =
                    department_id,

                budget_item =
                    budget_item,

                quantity =
                    quantity,

                unit_cost =
                    unit_cost,

                budget_type =
                    budget_type,

                start_date =
                    start_date,

                end_date =
                    end_date,

                remarks =
                    remarks,

                created_by =
                    session[
                        "user_id"
                    ]

            )


        # ==================================================
        # SUCCESS RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "budget_id":
                budget_id,

            "budget_no":
                budget_no,

            "message":
                "Department budget created successfully."

        }), 201


    except Exception as e:

        import traceback

        traceback.print_exc()


        return jsonify({

            "success": False,

            "message":
                "Failed to create department budget.",

            "error":
                str(e)

        }), 500


        

@hod_dashboard_bp.route(
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


# ==========================================================
# GET DEPARTMENT BUDGETS
#
# AJAX URL:
# GET /hod/api/budgets
# ==========================================================
# ==========================================================
# GET ALL DEPARTMENT BUDGETS
# ==========================================================

@hod_dashboard_bp.route(
    "/api/budgets",
    methods=["GET"]
)
def get_department_budgets():

    conn = None
    cursor = None

    try:

        # ==================================================
        # CONNECT TO DATABASE
        # ==================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ==================================================
        # GET DEPARTMENT BUDGETS
        # ==================================================

        cursor.execute("""
            SELECT

                db.department_budget_id,

                db.company_budget_id,

                db.budget_no,

                db.department_id,

                db.budget_item,

                db.quantity,

                db.unit_cost,

                db.total_budget,

                db.budget_type,

                db.start_date,

                db.end_date,

                db.remarks,

                db.ceo_status,

                db.ceo_user_id,

                db.ceo_approval_date,

                db.created_by,

                db.created_at,

                db.updated_at,

                d.department_name

            FROM department_budget AS db

            LEFT JOIN departments AS d

                ON db.department_id =
                   d.department_id

            ORDER BY
                db.department_budget_id DESC

        """)


        # ==================================================
        # FETCH RESULTS
        # ==================================================

        budgets = cursor.fetchall()


        # ==================================================
        # CONVERT DATE/DATETIME VALUES
        # ==================================================

        for budget in budgets:

            if budget.get(
                "start_date"
            ):

                budget[
                    "start_date"
                ] = budget[
                    "start_date"
                ].strftime(
                    "%Y-%m-%d"
                )


            if budget.get(
                "end_date"
            ):

                budget[
                    "end_date"
                ] = budget[
                    "end_date"
                ].strftime(
                    "%Y-%m-%d"
                )


            if budget.get(
                "ceo_approval_date"
            ):

                budget[
                    "ceo_approval_date"
                ] = budget[
                    "ceo_approval_date"
                ].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )


            if budget.get(
                "created_at"
            ):

                budget[
                    "created_at"
                ] = budget[
                    "created_at"
                ].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )


            if budget.get(
                "updated_at"
            ):

                budget[
                    "updated_at"
                ] = budget[
                    "updated_at"
                ].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )


        # ==================================================
        # RETURN SUCCESS
        # ==================================================

        return jsonify({

            "success":
                True,

            "data":
                budgets

        }), 200


    except Exception as e:

        # ==================================================
        # PRINT ERROR IN TERMINAL
        # ==================================================

        print(
            "GET DEPARTMENT BUDGETS ERROR:",
            str(e)
        )


        # ==================================================
        # RETURN ERROR
        # ==================================================

        return jsonify({

            "success":
                False,

            "message":
                "Failed to load department budgets.",

            "error":
                str(e)

        }), 500


    finally:

        # ==================================================
        # CLOSE CURSOR
        # ==================================================

        if cursor:

            cursor.close()


        # ==================================================
        # CLOSE CONNECTION
        # ==================================================

        if conn:

            conn.close()