from flask import Blueprint, jsonify
from db_connect import get_db_connection


# ============================================================
# FINANCE DASHBOARD BLUEPRINT
# ============================================================

finance_view_dashboard_bp = Blueprint(
    "finance_view_dashboard",
    __name__,
    url_prefix="/finance"
)


# ============================================================
# DATABASE CURSOR HELPER
# ============================================================

def get_cursor():

    conn = get_db_connection()

    if conn is None:

        raise Exception(
            "Database connection failed."
        )

    cursor = conn.cursor(
        dictionary=True
    )

    return conn, cursor


# ============================================================
# 1. TOTAL BUDGET API
# GET: /finance/api/dashboard/total-budget
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/total-budget",
    methods=["GET"]
)
def api_total_budget():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        total_budget = get_total_budget(cursor)

        return jsonify({

            "success": True,

            "total_budget": total_budget

        })

    except Exception as e:

        print("TOTAL BUDGET ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_total_budget(cursor):

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

        return float(
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

            return float(
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

            return 0


# ============================================================
# 2. AMOUNT SPENT API
# GET: /finance/api/dashboard/amount-spent
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/amount-spent",
    methods=["GET"]
)
def api_amount_spent():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        amount_spent = get_amount_spent(cursor)

        return jsonify({

            "success": True,

            "amount_spent": amount_spent

        })

    except Exception as e:

        print("AMOUNT SPENT ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_amount_spent(cursor):

    try:

        cursor.execute("""
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS amount_spent

            FROM payments

            WHERE
                payment_status = 'COMPLETED'
        """)

        row = cursor.fetchone()

        return float(
            row.get(
                "amount_spent",
                0
            ) or 0
        )

    except Exception as e:

        print(
            "Amount spent query failed:",
            e
        )

        return 0


# ============================================================
# 3. PENDING PAYMENTS API
# GET: /finance/api/dashboard/pending-payments
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/pending-payments",
    methods=["GET"]
)
def api_pending_payments():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        pending = get_pending_payments(cursor)

        return jsonify({

            "success": True,

            "pending_payments": pending

        })

    except Exception as e:

        print("PENDING PAYMENTS ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_pending_payments(cursor):

    try:

        cursor.execute("""
            SELECT
                COUNT(*) AS pending

            FROM payments

            WHERE

                payment_status IS NULL

                OR payment_status NOT IN (
                    'COMPLETED',
                    'REJECTED'
                )
        """)

        row = cursor.fetchone()

        return int(
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

        return 0


# ============================================================
# 4. OUTSTANDING DEBT API
# GET: /finance/api/dashboard/outstanding-debt
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/outstanding-debt",
    methods=["GET"]
)
def api_outstanding_debt():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        debt = get_outstanding_debt(cursor)

        return jsonify({

            "success": True,

            "outstanding_debt": debt

        })

    except Exception as e:

        print("OUTSTANDING DEBT ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_outstanding_debt(cursor):

    try:

        cursor.execute("""
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS outstanding_debt

            FROM payments

            WHERE

                payment_status IS NULL

                OR payment_status NOT IN (
                    'COMPLETED',
                    'REJECTED'
                )
        """)

        row = cursor.fetchone()

        return float(
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

        return 0


# ============================================================
# 5. PAID INVOICES API
# GET: /finance/api/dashboard/paid-invoices
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/paid-invoices",
    methods=["GET"]
)
def api_paid_invoices():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        paid = get_paid_invoices(cursor)

        return jsonify({

            "success": True,

            "paid_invoices": paid

        })

    except Exception as e:

        print("PAID INVOICES ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_paid_invoices(cursor):

    try:

        cursor.execute("""
            SELECT
                COUNT(*) AS paid

            FROM invoices

            WHERE
                status = 'PAID'
        """)

        row = cursor.fetchone()

        return int(
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

        return 0


# ============================================================
# 6. FINANCE SUMMARY API
# GET: /finance/api/dashboard/summary
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/summary",
    methods=["GET"]
)
def api_finance_summary():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        total_budget = get_total_budget(cursor)

        amount_spent = get_amount_spent(cursor)

        pending_payments = get_pending_payments(cursor)

        outstanding_debt = get_outstanding_debt(cursor)

        paid_invoices = get_paid_invoices(cursor)

        available_cash = (
            total_budget -
            amount_spent
        )

        return jsonify({

            "success": True,

            "finance": {

                "cash": available_cash,

                "available_cash": available_cash,

                "budget": total_budget,

                "total_budget": total_budget,

                "used": amount_spent,

                "budget_used": amount_spent,

                "amount_spent": amount_spent,

                "pending": pending_payments,

                "pending_payments": pending_payments,

                "debt": outstanding_debt,

                "outstanding_debt": outstanding_debt,

                "paid": paid_invoices,

                "paid_invoices": paid_invoices
            }

        })

    except Exception as e:

        print("FINANCE SUMMARY ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# 7. BUDGET UTILIZATION API
# GET: /finance/api/dashboard/budget-utilization
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/budget-utilization",
    methods=["GET"]
)
def api_budget_utilization():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_budget_utilization(cursor)

        return jsonify({

            "success": True,

            "budget_utilization": data

        })

    except Exception as e:

        print("BUDGET UTILIZATION ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_budget_utilization(cursor):

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
                    row.get("department_id"),

                "department_name":
                    row.get("department_name"),

                "budget":
                    float(
                        row.get(
                            "budget_amount",
                            0
                        ) or 0
                    ),

                "spent": 0

            })

    except Exception as e:

        print(
            "Budget utilization error:",
            e
        )

    return budget_utilization


# ============================================================
# 8. PAYMENT WORKFLOW API
# GET: /finance/api/dashboard/payment-workflow
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/payment-workflow",
    methods=["GET"]
)
def api_payment_workflow():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_payment_workflow(cursor)

        return jsonify({

            "success": True,

            "payment_workflow": data

        })

    except Exception as e:

        print("PAYMENT WORKFLOW ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_payment_workflow(cursor):

    payment_workflow = []

    try:

        cursor.execute("""
            SELECT

                COALESCE(
                    payment_status,
                    'PENDING'
                ) AS status,

                COUNT(*) AS total

            FROM payments

            GROUP BY
                payment_status

            ORDER BY
                total DESC
        """)

        rows = cursor.fetchall()

        for row in rows:

            payment_workflow.append({

                "status":
                    row.get("status"),

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

    return payment_workflow


# ============================================================
# 9. PENDING PAYMENT LIST API
# GET: /finance/api/dashboard/pending-payment-list
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/pending-payment-list",
    methods=["GET"]
)
def api_pending_payment_list():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_pending_payment_list(cursor)

        return jsonify({

            "success": True,

            "pending_payment_list": data

        })

    except Exception as e:

        print("PENDING PAYMENT LIST ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_pending_payment_list(cursor):

    pending_payment_list = []

    try:

        cursor.execute("""
            SELECT

                payment_id,
                payment_no,
                amount,
                payment_status,
                payment_date

            FROM payments

            WHERE

                payment_status IS NULL

                OR payment_status NOT IN (
                    'COMPLETED',
                    'REJECTED'
                )

            ORDER BY
                payment_date DESC

            LIMIT 20
        """)

        rows = cursor.fetchall()

        for row in rows:

            payment_date = row.get(
                "payment_date"
            )

            pending_payment_list.append({

                "payment_id":
                    row.get("payment_id"),

                "payment_no":
                    row.get("payment_no"),

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

    return pending_payment_list


# ============================================================
# 10. RECENT TRANSACTIONS API
# GET: /finance/api/dashboard/recent-transactions
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/recent-transactions",
    methods=["GET"]
)
def api_recent_transactions():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_recent_transactions(cursor)

        return jsonify({

            "success": True,

            "recent_transactions": data

        })

    except Exception as e:

        print("RECENT TRANSACTIONS ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_recent_transactions(cursor):

    recent_transactions = []

    try:

        cursor.execute("""
            SELECT

                payment_no,
                amount,
                payment_status,
                payment_date

            FROM payments

            ORDER BY
                payment_date DESC

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

    return recent_transactions


# ============================================================
# 11. CASH FLOW API
# GET: /finance/api/dashboard/cash-flow
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/cash-flow",
    methods=["GET"]
)
def api_cash_flow():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_cash_flow(cursor)

        return jsonify({

            "success": True,

            "cash_flow": data

        })

    except Exception as e:

        print("CASH FLOW ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_cash_flow(cursor):

    cash_flow = []

    try:

        cursor.execute("""
            SELECT

                DATE_FORMAT(
                    payment_date,
                    '%Y-%m'
                ) AS month,

                COALESCE(
                    SUM(amount),
                    0
                ) AS expenses

            FROM payments

            WHERE
                payment_status =
                'COMPLETED'

            GROUP BY
                DATE_FORMAT(
                    payment_date,
                    '%Y-%m'
                )

            ORDER BY
                month
        """)

        rows = cursor.fetchall()

        for row in rows:

            cash_flow.append({

                "month":
                    row.get("month"),

                "income": 0,

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

    return cash_flow


# ============================================================
# 12. BUDGET VS ACTUAL API
# GET: /finance/api/dashboard/budget-vs-actual
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/budget-vs-actual",
    methods=["GET"]
)
def api_budget_vs_actual():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_budget_vs_actual(cursor)

        return jsonify({

            "success": True,

            "budget_vs_actual": data

        })

    except Exception as e:

        print("BUDGET VS ACTUAL ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_budget_vs_actual(cursor):

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

                "spent": 0

            })

    except Exception as e:

        print(
            "Budget vs actual error:",
            e
        )

    return budget_vs_actual


# ============================================================
# 13. SUPPLIER PAYMENTS API
# GET: /finance/api/dashboard/supplier-payments
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/supplier-payments",
    methods=["GET"]
)
def api_supplier_payments():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_supplier_payments(cursor)

        return jsonify({

            "success": True,

            "supplier_payments": data

        })

    except Exception as e:

        print("SUPPLIER PAYMENTS ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_supplier_payments(cursor):

    supplier_payments = []

    try:

        cursor.execute("""
            SELECT

                COALESCE(
                    payment_status,
                    'PENDING'
                ) AS status,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total

            FROM payments

            GROUP BY
                payment_status

            ORDER BY
                total DESC

            LIMIT 10
        """)

        rows = cursor.fetchall()

        for row in rows:

            supplier_payments.append({

                "supplier":
                    row.get("status"),

                "status":
                    row.get("status"),

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

    return supplier_payments


# ============================================================
# 14. DEPARTMENT EXPENSES API
# GET: /finance/api/dashboard/department-expenses
# ============================================================

@finance_view_dashboard_bp.route(
    "/api/dashboard/department-expenses",
    methods=["GET"]
)
def api_department_expenses():

    conn = None
    cursor = None

    try:

        conn, cursor = get_cursor()

        data = get_department_expenses(cursor)

        return jsonify({

            "success": True,

            "department_expenses": data

        })

    except Exception as e:

        print("DEPARTMENT EXPENSES ERROR:", str(e))

        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


def get_department_expenses(cursor):

    department_expenses = []

    try:

        cursor.execute("""
            SELECT

                COALESCE(
                    d.department_name,
                    'Unknown Department'
                ) AS department_name,

                COALESCE(
                    SUM(p.amount),
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

    return department_expenses