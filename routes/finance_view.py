from flask import Blueprint, request, jsonify
from model import get_db_connection


# ============================================================
# FINANCE DASHBOARD BLUEPRINT
# ============================================================

finance_view_dashboard_bp = Blueprint(
    "finance_view_dashboard",
    __name__,
    url_prefix="/finance"
)


# ============================================================
# FINANCE DASHBOARD API
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard",
    methods=["POST"]
)
def finance_dashboard():

    # ========================================================
    # TEST GET REQUEST
    # ========================================================

    if request.method == "GET":

        return jsonify({
            "success": True,
            "message": "Finance API route is working",
            "endpoint": "/finance/api/dashboard",
            "method": "POST"
        })


    conn = None
    cursor = None

    try:

        # ====================================================
        # READ DATA SENT FROM JAVASCRIPT
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}

        department = data.get(
            "department",
            ""
        )

        year = data.get(
            "year",
            ""
        )

        start_date = data.get(
            "start",
            ""
        )

        end_date = data.get(
            "end",
            ""
        )


        print("\n======================================")
        print("FINANCE DASHBOARD API CALLED")
        print("======================================")

        print("Department:", department)
        print("Year:", year)
        print("Start:", start_date)
        print("End:", end_date)


        # ====================================================
        # DATABASE CONNECTION
        # ====================================================

        conn = get_db_connection()

        if conn is None:

            return jsonify({
                "success": False,
                "message": "Database connection failed."
            }), 500


        cursor = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # 1. TOTAL BUDGET
        # ====================================================

        total_budget = 0

        try:

            cursor.execute("""
                SELECT
                    COALESCE(
                        SUM(budget_amount),
                        0
                    ) AS total_budget

                FROM department_budget
            """)

            row = cursor.fetchone()

            if row:

                total_budget = float(
                    row.get(
                        "total_budget",
                        0
                    ) or 0
                )

        except Exception as e:

            print(
                "Department budget query failed:",
                e
            )

            try:

                cursor.execute("""
                    SELECT
                        COALESCE(
                            SUM(budget_amount),
                            0
                        ) AS total_budget

                    FROM company_budget
                """)

                row = cursor.fetchone()

                if row:

                    total_budget = float(
                        row.get(
                            "total_budget",
                            0
                        ) or 0
                    )

            except Exception as e2:

                print(
                    "Company budget query failed:",
                    e2
                )

                total_budget = 0


        # ====================================================
        # 2. COMPLETED PAYMENTS / MONEY SPENT
        # ====================================================

        amount_spent = 0

        try:

            cursor.execute("""
                SELECT
                    COALESCE(
                        SUM(p.amount),
                        0
                    ) AS amount_spent

                FROM payments p

                WHERE
                    p.payment_status =
                    'COMPLETED'
            """)

            row = cursor.fetchone()

            if row:

                amount_spent = float(
                    row.get(
                        "amount_spent",
                        0
                    ) or 0
                )

        except Exception as e:

            print(
                "Payment spending query failed:",
                e
            )

            amount_spent = 0


        # ====================================================
        # 3. PENDING PAYMENTS
        # ====================================================

        pending_payments = 0

        try:

            cursor.execute("""
                SELECT
                    COUNT(*) AS pending

                FROM payments p

                WHERE
                    p.payment_status IS NULL

                    OR p.payment_status NOT IN (
                        'COMPLETED',
                        'REJECTED'
                    )
            """)

            row = cursor.fetchone()

            if row:

                pending_payments = int(
                    row.get(
                        "pending",
                        0
                    ) or 0
                )

        except Exception as e:

            print(
                "Pending payments query failed:",
                e
            )

            pending_payments = 0


        # ====================================================
        # 4. OUTSTANDING DEBT
        # ====================================================

        outstanding_debt = 0

        try:

            cursor.execute("""
                SELECT
                    COALESCE(
                        SUM(p.amount),
                        0
                    ) AS outstanding_debt

                FROM payments p

                WHERE
                    p.payment_status IS NULL

                    OR p.payment_status NOT IN (
                        'COMPLETED',
                        'REJECTED'
                    )
            """)

            row = cursor.fetchone()

            if row:

                outstanding_debt = float(
                    row.get(
                        "outstanding_debt",
                        0
                    ) or 0
                )

        except Exception as e:

            print(
                "Outstanding debt query failed:",
                e
            )

            outstanding_debt = 0


        # ====================================================
        # 5. PAID INVOICES
        # ====================================================

        paid_invoices = 0

        try:

            cursor.execute("""
                SELECT
                    COUNT(*) AS paid

                FROM invoices i

                WHERE
                    i.status = 'PAID'
            """)

            row = cursor.fetchone()

            if row:

                paid_invoices = int(
                    row.get(
                        "paid",
                        0
                    ) or 0
                )

        except Exception as e:

            print(
                "Paid invoices query failed:",
                e
            )

            paid_invoices = 0


        # ====================================================
        # 6. AVAILABLE CASH
        # ====================================================

        available_cash = (
            total_budget -
            amount_spent
        )


        # ====================================================
        # 7. FINANCE KPI
        # ====================================================

        finance = {

            "cash":
                available_cash,

            "available_cash":
                available_cash,

            "budget":
                total_budget,

            "total_budget":
                total_budget,

            "used":
                amount_spent,

            "budget_used":
                amount_spent,

            "amount_spent":
                amount_spent,

            "pending":
                pending_payments,

            "pending_payments":
                pending_payments,

            "debt":
                outstanding_debt,

            "outstanding_debt":
                outstanding_debt,

            "paid":
                paid_invoices,

            "paid_invoices":
                paid_invoices
        }


        # ====================================================
        # 8. BUDGET UTILIZATION
        # ====================================================

        budget_utilization = []

        try:

            cursor.execute("""
                SELECT

                    db.department_id,

                    COALESCE(
                        d.department_name,
                        'Unknown Department'
                    ) AS department_name,

                    COALESCE(
                        db.budget_amount,
                        0
                    ) AS budget_amount

                FROM department_budget db

                LEFT JOIN departments d
                    ON d.department_id =
                       db.department_id

                ORDER BY
                    d.department_name
            """)

            rows = cursor.fetchall()


            for row in rows:

                budget_utilization.append({

                    "department_id":
                        row.get(
                            "department_id"
                        ),

                    "department_name":
                        row.get(
                            "department_name"
                        ),

                    "budget":
                        float(
                            row.get(
                                "budget_amount",
                                0
                            ) or 0
                        ),

                    "spent":
                        0

                })


        except Exception as e:

            print(
                "Budget utilization error:",
                e
            )


        # ====================================================
        # 9. PAYMENT WORKFLOW
        # ====================================================

        payment_workflow = []

        try:

            cursor.execute("""
                SELECT

                    COALESCE(
                        p.payment_status,
                        'PENDING'
                    ) AS status,

                    COUNT(*) AS total

                FROM payments p

                GROUP BY
                    p.payment_status

                ORDER BY
                    total DESC
            """)

            rows = cursor.fetchall()


            for row in rows:

                payment_workflow.append({

                    "status":
                        row.get(
                            "status"
                        ),

                    "total":
                        int(
                            row.get(
                                "total",
                                0
                            ) or 0
                        )

                })


        except Exception as e:

            print(
                "Payment workflow error:",
                e
            )


        # ====================================================
        # 10. PENDING PAYMENTS LIST
        # ====================================================

        pending_payment_list = []

        try:

            cursor.execute("""
                SELECT

                    p.payment_id,

                    p.payment_no,

                    p.amount,

                    p.payment_status,

                    p.payment_date

                FROM payments p

                WHERE

                    p.payment_status IS NULL

                    OR p.payment_status NOT IN (
                        'COMPLETED',
                        'REJECTED'
                    )

                ORDER BY
                    p.payment_date DESC

                LIMIT 20
            """)

            rows = cursor.fetchall()


            for row in rows:

                payment_date = row.get(
                    "payment_date"
                )


                pending_payment_list.append({

                    "payment_id":
                        row.get(
                            "payment_id"
                        ),

                    "payment_no":
                        row.get(
                            "payment_no"
                        ),

                    "supplier":
                        "Unknown Supplier",

                    "amount":
                        float(
                            row.get(
                                "amount",
                                0
                            ) or 0
                        ),

                    "status":
                        row.get(
                            "payment_status"
                        ) or "Pending",

                    "date":
                        payment_date.strftime(
                            "%Y-%m-%d"
                        )
                        if payment_date
                        else ""

                })


        except Exception as e:

            print(
                "Pending payment list error:",
                e
            )


        # ====================================================
        # 11. RECENT TRANSACTIONS
        # ====================================================

        recent_transactions = []

        try:

            cursor.execute("""
                SELECT

                    p.payment_no,

                    p.amount,

                    p.payment_status,

                    p.payment_date

                FROM payments p

                ORDER BY
                    p.payment_date DESC

                LIMIT 20
            """)

            rows = cursor.fetchall()


            for row in rows:

                payment_date = row.get(
                    "payment_date"
                )


                recent_transactions.append({

                    "reference":
                        row.get(
                            "payment_no"
                        ) or "",

                    "payment_no":
                        row.get(
                            "payment_no"
                        ),

                    "amount":
                        float(
                            row.get(
                                "amount",
                                0
                            ) or 0
                        ),

                    "status":
                        row.get(
                            "payment_status"
                        ),

                    "date":
                        payment_date.strftime(
                            "%Y-%m-%d"
                        )
                        if payment_date
                        else ""

                })


        except Exception as e:

            print(
                "Recent transactions error:",
                e
            )


        # ====================================================
        # 12. CASH FLOW
        # ====================================================

        cash_flow = []

        try:

            cursor.execute("""
                SELECT

                    DATE_FORMAT(
                        p.payment_date,
                        '%Y-%m'
                    ) AS month,

                    COALESCE(
                        SUM(p.amount),
                        0
                    ) AS expenses

                FROM payments p

                WHERE
                    p.payment_status =
                    'COMPLETED'

                GROUP BY
                    DATE_FORMAT(
                        p.payment_date,
                        '%Y-%m'
                    )

                ORDER BY
                    month
            """)

            rows = cursor.fetchall()


            for row in rows:

                cash_flow.append({

                    "month":
                        row.get(
                            "month"
                        ),

                    "income":
                        0,

                    "expenses":
                        float(
                            row.get(
                                "expenses",
                                0
                            ) or 0
                        )

                })


        except Exception as e:

            print(
                "Cash flow error:",
                e
            )


        # ====================================================
        # 13. BUDGET VS ACTUAL
        # ====================================================

        budget_vs_actual = []

        try:

            cursor.execute("""
                SELECT

                    db.department_id,

                    COALESCE(
                        d.department_name,
                        'Unknown Department'
                    ) AS department_name,

                    COALESCE(
                        db.budget_amount,
                        0
                    ) AS budget_amount

                FROM department_budget db

                LEFT JOIN departments d
                    ON d.department_id =
                       db.department_id

                ORDER BY
                    d.department_name
            """)

            rows = cursor.fetchall()


            for row in rows:

                budget_vs_actual.append({

                    "department":
                        row.get(
                            "department_name"
                        ),

                    "department_name":
                        row.get(
                            "department_name"
                        ),

                    "budget":
                        float(
                            row.get(
                                "budget_amount",
                                0
                            ) or 0
                        ),

                    "spent":
                        0

                })


        except Exception as e:

            print(
                "Budget vs actual error:",
                e
            )


        # ====================================================
        # 14. SUPPLIER PAYMENTS
        # ====================================================

        supplier_payments = []

        try:

            cursor.execute("""
                SELECT

                    COALESCE(
                        p.payment_status,
                        'PENDING'
                    ) AS status,

                    COALESCE(
                        SUM(p.amount),
                        0
                    ) AS total

                FROM payments p

                GROUP BY
                    p.payment_status

                ORDER BY
                    total DESC

                LIMIT 10
            """)

            rows = cursor.fetchall()


            for row in rows:

                supplier_payments.append({

                    "supplier":
                        row.get(
                            "status"
                        ),

                    "status":
                        row.get(
                            "status"
                        ),

                    "total":
                        float(
                            row.get(
                                "total",
                                0
                            ) or 0
                        )

                })


        except Exception as e:

            print(
                "Supplier payments error:",
                e
            )


        # ====================================================
        # 15. DEPARTMENT EXPENSES
        # ====================================================

        department_expenses = []

        try:

            cursor.execute("""
                SELECT

                    COALESCE(
                        d.department_name,
                        'Unknown Department'
                    ) AS department_name,

                    COALESCE(
                        SUM(
                            p.amount
                        ),
                        0
                    ) AS amount_spent

                FROM payments p

                LEFT JOIN invoices i
                    ON i.invoice_id =
                       p.invoice_id

                LEFT JOIN purchase_orders po
                    ON po.po_id =
                       i.po_id

                LEFT JOIN requisitions r
                    ON r.requisition_id =
                       po.requisition_id

                LEFT JOIN departments d
                    ON d.department_id =
                       r.department_id

                WHERE
                    p.payment_status =
                    'COMPLETED'

                GROUP BY
                    d.department_id,
                    d.department_name

                ORDER BY
                    amount_spent DESC
            """)

            rows = cursor.fetchall()


            for row in rows:

                department_expenses.append({

                    "department":
                        row.get(
                            "department_name"
                        ),

                    "department_name":
                        row.get(
                            "department_name"
                        ),

                    "amount":
                        float(
                            row.get(
                                "amount_spent",
                                0
                            ) or 0
                        )

                })


        except Exception as e:

            print(
                "Department expenses error:",
                e
            )


        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        response = {

            "success": True,

            "finance":
                finance,

            "budget_utilization":
                budget_utilization,

            "payment_workflow":
                payment_workflow,

            "pending_payment_list":
                pending_payment_list,

            "recent_transactions":
                recent_transactions,

            "cash_flow":
                cash_flow,

            "budget_vs_actual":
                budget_vs_actual,

            "supplier_payments":
                supplier_payments,

            "department_expenses":
                department_expenses

        }


        print("\n======================================")
        print("FINANCE DASHBOARD API SUCCESS")
        print("======================================")

        print(
            "Finance:",
            finance
        )

        print(
            "Budget rows:",
            len(budget_utilization)
        )

        print(
            "Pending payments:",
            len(pending_payment_list)
        )

        print(
            "Transactions:",
            len(recent_transactions)
        )

        print(
            "======================================\n"
        )


        return jsonify(response)


    # ========================================================
    # ERROR HANDLER
    # ========================================================

    except Exception as e:

        print("\n======================================")
        print("FINANCE DASHBOARD API ERROR")
        print("======================================")

        print(
            "ERROR:",
            str(e)
        )

        import traceback

        traceback.print_exc()

        print(
            "======================================\n"
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to load finance dashboard.",

            "error":
                str(e)

        }), 500


    # ========================================================
    # CLOSE DATABASE
    # ========================================================

    finally:

        try:

            if cursor:
                cursor.close()

        except Exception:
            pass


        try:

            if conn:
                conn.close()

        except Exception:
            pass