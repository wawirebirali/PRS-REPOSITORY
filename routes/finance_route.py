from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from model import get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role
from db_connect import get_db_connection
from flask import jsonify

finance_dashboard_bp = Blueprint("finance_dashboard", __name__, template_folder="../templates")

@finance_dashboard_bp.route("/dashboard")
def dashboard():
    if session.get("user_role") != "finance":
        flash("Unauthorized access", "danger")
        return redirect(url_for("auth.user_login"))
    requisitions = get_pending_requisitions_for_role("Finance")
    return render_template("finanance_dashboard.html", requisitions=requisitions)


@finance_dashboard_bp.route("/create_payment", methods=["POST"])
def create_payment():

    if session.get("user_role") != "finance":
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 403

    data = request.get_json()

    requisition_id = data.get("requisition_id")
    invoice_no = data.get("invoice_no")
    payment_no = data.get("payment_no")
    payment_method = data.get("payment_method")
    amount = data.get("amount")
    amount_paid = data.get("amount_paid")
    balance = data.get("balance")
    currency = data.get("currency", "UGX")
    payment_status = data.get("payment_status", "Pending")
    payment_date = data.get("payment_date")
    remarks = data.get("remarks", "")

    paid_by = session.get("user_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO payments (
                requisition_id,
                invoice_no,
                payment_no,
                paid_by,
                payment_method,
                amount,
                amount_paid,
                balance,
                currency,
                payment_status,
                payment_date,
                remarks
            )
            VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
        """, (
            requisition_id,
            invoice_no,
            payment_no,
            paid_by,
            payment_method,
            amount,
            amount_paid,
            balance,
            currency,
            payment_status,
            payment_date,
            remarks
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Payment created successfully"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()

@finance_dashboard_bp.route("/view/<int:requisition_id>")
def view_requisition_finance(requisition_id):
    if session.get("user_role") != "finance":
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
    

    return render_template(
        "view_form.html",
        requisition=requisition,
        items=items,
        approvals=approvals,
        signatures=signatures,
        approval_dates=approval_dates,
        print_mode=False
    )
