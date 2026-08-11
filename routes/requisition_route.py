from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from db_connect import get_db_connection

requisition_bp = Blueprint(
    "requisition",
    __name__,
    url_prefix="/requisition"
)

# =========================
# REQUISITION PAGE
# =========================



# =====================================================
# SUBMIT REQUISITION
# =====================================================


from datetime import datetime




def create_requisition(
    user_id,
    department_id,
    department_budget_id,
    submission_date,
    items
):

    conn = None
    cursor = None

    try:

        # =====================================================
        # OPEN DATABASE CONNECTION
        # =====================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # =====================================================
        # VALIDATE REQUIRED DATA
        # =====================================================

        if not user_id:

            raise ValueError(
                "User ID is required."
            )


        if not department_id:

            raise ValueError(
                "Department is required."
            )


        if not department_budget_id:

            raise ValueError(
                "Budget item is required."
            )


        if not submission_date:

            raise ValueError(
                "Submission date is required."
            )


        if not items:

            raise ValueError(
                "At least one requisition item is required."
            )


        # =====================================================
        # VERIFY DEPARTMENT BUDGET BELONGS TO DEPARTMENT
        # =====================================================

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

            raise ValueError(
                "Invalid budget item selected for "
                "the selected department."
            )


        # =====================================================
        # GENERATE NEXT PRS NUMBER
        # =====================================================

        current_year = datetime.now().year


        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM requisitions
            WHERE YEAR(submission_date) = %s
        """, (
            current_year,
        ))


        result = cursor.fetchone()


        next_number = (
            result["total"] or 0
        ) + 1


        prs_no = (
            f"PRS-{current_year}-{next_number:04d}"
        )


        # =====================================================
        # INSERT REQUISITION
        # =====================================================

        cursor.execute("""
            INSERT INTO requisitions (
                prs_no,
                user_id,
                department_id,
                department_budget_id,
                submission_date
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
                
            )
        """, (
            prs_no,
            user_id,
            department_id,
            department_budget_id,
            submission_date
            
        ))


        # =====================================================
        # GET NEW REQUISITION ID
        # =====================================================

        requisition_id = cursor.lastrowid


        # =====================================================
        # INSERT REQUISITION ITEMS
        # =====================================================

        for item in items:

            cursor.execute("""
                INSERT INTO requisition_items (
                    requisition_id,
                    material_name,
                    description,
                    uom,
                    qty_stock,
                    qty_required,
                    required_date,
                    remark
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (

                requisition_id,

                item.get(
                    "material_name",
                    ""
                ),

                item.get(
                    "description",
                    ""
                ),

                item.get(
                    "uom",
                    ""
                ),

                item.get(
                    "qty_stock",
                    0
                ),

                item.get(
                    "qty_required",
                    0
                ),

                item.get(
                    "required_date"
                ),

                item.get(
                    "remark",
                    ""
                )
            ))


        # =====================================================
        # CREATE APPROVAL RECORD
        # =====================================================

        # =====================================================
# CREATE APPROVAL RECORD
# =====================================================

            cursor.execute("""
                INSERT INTO approvals (
                    module_name,
                    document_id,
                    hod_status,
                    ceo_status,
                    final_status
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                "PRS",
                requisition_id,
                "PENDING",
                "PENDING",
                "PENDING"
            ))


        # =====================================================
        # COMMIT TRANSACTION
        # =====================================================

        conn.commit()


        # =====================================================
        # RETURN SUCCESS
        # =====================================================

        return {
            "success": True,
            "prs_no": prs_no,
            "requisition_id": requisition_id,
            "message": (
                "Requisition created successfully."
            )
        }


    # =========================================================
    # HANDLE ERROR
    # =========================================================

    except Exception as e:

        if conn:

            conn.rollback()


        print(
            "CREATE REQUISITION ERROR:",
            str(e)
        )


        return {
            "success": False,
            "message": str(e)
        }


    # =========================================================
    # CLOSE DATABASE
    # =========================================================

    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()






@requisition_bp.route(
    "/api/next-prs-number",
    methods=["GET"]
)
def get_next_prs_number():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        current_year = datetime.now().year

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM requisitions
            WHERE YEAR(submission_date) = %s
        """, (
            current_year,
        ))

        result = cursor.fetchone()

        next_number = (
            result["total"] or 0
        ) + 1

        prs_no = (
            f"PRS-{current_year}-{next_number:04d}"
        )

        return jsonify({
            "success": True,
            "prs_no": prs_no
        })

    except Exception as e:

        print(
            "NEXT PRS NUMBER ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()

            

@requisition_bp.route(
    "/submit",
    methods=["POST"]
)
def submit_requisition():

    conn = None
    cursor = None

    try:

        # =====================================================
        # CHECK LOGIN
        # =====================================================

        if "user_id" not in session:

            return jsonify({
                "success": False,
                "message": (
                    "Please login first."
                )
            }), 401


        # =====================================================
        # GET LOGGED-IN USER
        # =====================================================

        user_id = session.get(
            "user_id"
        )


        user_role = session.get(
            "user_role"
        )


        # =====================================================
        # GET SELECTED DEPARTMENT
        # =====================================================

        department_id = request.form.get(
            "department_id",
            type=int
        )


        # =====================================================
        # GET SELECTED DEPARTMENT BUDGET
        #
        # This is the ID of the selected budget item
        # =====================================================

        department_budget_id = request.form.get(
            "department_budget_id",
            type=int
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

            return jsonify({
                "success": False,
                "message": (
                    "Please select a department."
                )
            }), 400


        # =====================================================
        # VALIDATE BUDGET ITEM
        # =====================================================

        if not department_budget_id:

            return jsonify({
                "success": False,
                "message": (
                    "Please select a budget item."
                )
            }), 400


        # =====================================================
        # VALIDATE SUBMISSION DATE
        # =====================================================

        if not submission_date:

            return jsonify({
                "success": False,
                "message": (
                    "Please select a submission date."
                )
            }), 400


        # =====================================================
        # VERIFY BUDGET BELONGS TO DEPARTMENT
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


        # =====================================================
        # CLOSE VALIDATION CONNECTION
        # =====================================================

        cursor.close()
        cursor = None

        conn.close()
        conn = None


        # =====================================================
        # CHECK VALID BUDGET
        # =====================================================

        if not budget:

            return jsonify({
                "success": False,
                "message": (
                    "Invalid budget item selected "
                    "for the selected department."
                )
            }), 400


        # =====================================================
        # GET REQUISITION ITEMS
        # =====================================================

        items = []

        row = 0


        while True:

            material_name = request.form.get(
                f"material_name_{row}"
            )


            # =================================================
            # STOP WHEN NO MORE ITEMS EXIST
            # =================================================

            if not material_name:

                break


            # =================================================
            # ADD ITEM
            # =================================================

            items.append({

                "material_name":
                    material_name.strip(),


                "description":
                    request.form.get(
                        f"description_{row}",
                        ""
                    ).strip(),


                "uom":
                    request.form.get(
                        f"uom_{row}",
                        ""
                    ).strip(),


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
                    ).strip()

            })


            row += 1


        # =====================================================
        # VALIDATE ITEMS
        # =====================================================

        if not items:

            return jsonify({
                "success": False,
                "message": (
                    "Please add at least one "
                    "requisition item."
                )
            }), 400


        # =====================================================
        # SAVE REQUISITION
        # =====================================================

        result = create_requisition(

            user_id=user_id,

            department_id=department_id,

            department_budget_id=department_budget_id,

            submission_date=submission_date,

            items=items

        )


        # =====================================================
        # CHECK SAVE RESULT
        # =====================================================

        if not result["success"]:

            return jsonify({
                "success": False,
                "message": result["message"]
            }), 500


        # =====================================================
        # SUCCESS
        # =====================================================

        return jsonify({

            "success": True,

            "message": (
                f"Requisition "
                f"{result['prs_no']} "
                "created successfully."
            ),

            "prs_no":
                result["prs_no"],

            "requisition_id":
                result["requisition_id"],

            "user_role":
                user_role

        }), 201


    # =========================================================
    # HANDLE UNEXPECTED ERROR
    # =========================================================

    except Exception as e:

        print(
            "SUBMIT REQUISITION ERROR:",
            str(e)
        )


        if conn:

            conn.rollback()


        return jsonify({

            "success": False,

            "message": (
                "System error occurred while "
                "creating requisition."
            )

        }), 500


    # =========================================================
    # CLOSE DATABASE
    # =========================================================

    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()

# =====================================================
# LOAD DEPARTMENTS FOR REQUISITION FORM
# =====================================================

@requisition_bp.route(
    "/api/departments",
    methods=["GET"]
)
def get_requisition_departments():

    # =================================================
    # CHECK LOGIN
    # =================================================

    if "user_id" not in session:

        return jsonify({
            "success": False,
            "message": "Login required"
        }), 401


    conn = None
    cursor = None


    try:

        # =============================================
        # DATABASE CONNECTION
        # =============================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # =============================================
        # GET DEPARTMENTS
        # =============================================

        cursor.execute("""
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        """)


        departments = cursor.fetchall()


        # =============================================
        # RETURN JSON
        # =============================================

        return jsonify({

            "success": True,

            "data": departments

        }), 200


    except Exception as e:

        print(
            "LOAD DEPARTMENTS ERROR:",
            e
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
        """, (department_id,))

        budgets = cursor.fetchall()

        print(
            "Selected Department:",
            department_id
        )

        print(
            "Budget Items:",
            budgets
        )

        return jsonify({
            "success": True,
            "data": budgets
        }), 200

    except Exception as e:

        print(
            "BUDGET ITEM API ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Failed to load budget items",
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()