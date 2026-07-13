from flask import Blueprint, jsonify, render_template, session, redirect, url_for, flash, request
from model import get_db_connection, get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role

ceo_dashboard_view_bp = Blueprint("ceo_dashboard_view", __name__, template_folder="../templates")

@ceo_dashboard_view_bp.route("/quotationRequest_data")
def quotationRequest_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                q.qrf_id,
                q.qrf_no,
                r.prs_no,
                s.supplier_name,

                COALESCE(a.final_status, 'PENDING') AS status,

                d.department_name AS department,
                q.request_date

            FROM quotation_requests q

            JOIN requisitions r
                ON q.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            JOIN quotation_request_suppliers qrs
                ON q.qrf_id = qrs.qrf_id

            JOIN suppliers s
                ON qrs.supplier_id = s.supplier_id

            LEFT JOIN approvals a
                ON a.document_id = q.qrf_id
               AND a.module_name = 'QRF'

            WHERE COALESCE(a.hod_status, 'PENDING') = 'APPROVED'

            ORDER BY q.qrf_id DESC
        """)

        quotations = cursor.fetchall()

        for item in quotations:
            if item.get("request_date"):
                item["request_date"] = item["request_date"].isoformat()

        return jsonify(quotations)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@ceo_dashboard_view_bp.route("/quotation_data")
def quotation_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                q.quotation_id,
                q.quotation_no,
                qr.qrf_no,
                s.supplier_name,
                COALESCE(a.final_status, 'PENDING') AS status,
                d.department_name AS department,
                q.quotation_date AS created_at

            FROM quotations q

            LEFT JOIN quotation_requests qr
                ON qr.qrf_id = q.qrf_id

            LEFT JOIN requisitions r
                ON qr.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN suppliers s
                ON q.supplier_id = s.supplier_id

            LEFT JOIN approvals a
                ON a.module_name = 'QUOTATION'
               AND a.document_id = q.quotation_id
            WHERE a.hod_status = 'APPROVED'
            

            ORDER BY q.quotation_id DESC 
        """)

        rows = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()





@ceo_dashboard_view_bp.route("/payments_data")
def payments_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                p.payment_id,
                p.payment_no,
                p.payment_date,

                i.invoice_number,
                i.supplier_name,

                d.department_name AS requisition_department,

                COALESCE(a.final_status, 'PENDING') AS status

            FROM payments p

            JOIN invoices i
                ON p.invoice_id = i.invoice_id

            JOIN purchase_orders po
                ON i.purchase_order_id = po.purchase_order_id

            JOIN requisitions r
                ON po.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.module_name = 'PAYMENT'
                AND a.document_id = p.payment_id
            WHERE a.hod_status = 'APPROVED'

            ORDER BY p.payment_id DESC
        """)

        payments = cursor.fetchall()

        for row in payments:
            if row.get("payment_date"):
                row["payment_date"] = row["payment_date"].isoformat()

        return jsonify({
            "success": True,
            "data": payments
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@ceo_dashboard_view_bp.route("/invoice_data")
def invoice_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.total_amount,

                COALESCE(a.final_status, 'PENDING') AS status,

                p.po_number,
                r.prs_no,
                d.department_name,
                i.supplier_name

            FROM invoices i

            JOIN purchase_orders p
                ON i.purchase_order_id = p.purchase_order_id

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.document_id = i.invoice_id
               AND a.module_name = 'INVOICE'

            WHERE COALESCE(a.hod_status, 'PENDING') = 'APPROVED'

            ORDER BY i.invoice_id DESC
        """)

        invoices = cursor.fetchall()

        for invoice in invoices:

            if invoice["invoice_date"]:
                invoice["invoice_date"] = invoice["invoice_date"].isoformat()

            invoice["total_amount"] = float(invoice["total_amount"] or 0)

        return jsonify(invoices)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()



@ceo_dashboard_view_bp.route("/hod_grn_data")
def hod_grn_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            g.grn_id,
            g.grn_no,
            p.po_number,
            r.prs_no,
            s.supplier_name,

            COALESCE(a.final_status, 'PENDING') AS status,

            d.department_name AS department,
            g.received_date

        FROM grn g

        JOIN purchase_orders p
            ON g.po_id = p.purchase_order_id

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

        JOIN departments d
            ON r.department_id = d.department_id

        JOIN suppliers s
            ON g.supplier_id = s.supplier_id

        LEFT JOIN approvals a
            ON a.document_id = g.grn_id
           AND a.module_name = 'GRN'

        WHERE COALESCE(a.hod_status, 'PENDING') = 'APPROVED'

        ORDER BY g.grn_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("received_date"):
            row["received_date"] = row["received_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)
@ceo_dashboard_view_bp.route("/po_data")
def po_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.purchase_order_id,
            p.po_number,
            r.prs_no,
            s.supplier_name,

            COALESCE(a.final_status, 'PENDING') AS status,

            d.department_name AS department,
            p.order_date

        FROM purchase_orders p

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

        JOIN suppliers s
            ON p.supplier_id = s.supplier_id

        JOIN departments d
            ON r.department_id = d.department_id

        LEFT JOIN approvals a
            ON a.document_id = p.purchase_order_id
           AND a.module_name = 'PO'

        WHERE COALESCE(a.hod_status, 'PENDING') = 'APPROVED'

        ORDER BY p.purchase_order_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("order_date"):
            row["order_date"] = row["order_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)





@ceo_dashboard_view_bp.route("/requisition_data")
def requisition_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                r.requisition_id,
                r.prs_no,
                d.department_name,

                COALESCE(a.final_status, 'PENDING') AS ceo_status,

                r.submission_date,

                a.ceo_approved_at

            FROM requisitions r

            JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.document_id = r.requisition_id
               AND a.module_name = 'PRS'

            WHERE COALESCE(a.hod_status, 'PENDING') = 'APPROVED'

            ORDER BY r.requisition_id DESC
        """)

        requisitions = cursor.fetchall()

        for item in requisitions:
            if item.get("submission_date"):
                item["submission_date"] = item["submission_date"].isoformat()

            if item.get("ceo_approved_at"):
                item["ceo_approved_at"] = item["ceo_approved_at"].isoformat()

        return jsonify(requisitions)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()



@ceo_dashboard_view_bp.route("/requisition_details/<int:requisition_id>")
def requisition_details(requisition_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =========================
        # PRS HEADER
        # =========================
        cursor.execute("""
            SELECT
                r.requisition_id,
                r.prs_no,
                r.submission_date,

                d.department_name,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.final_status,'PENDING') AS ceo_status,

                creator.username AS created_by_name,
                creator.signature AS created_signature,

                hod.username AS hod_username,
                hod.signature AS hod_signature,
                a.hod_approved_at,

                ceo.username AS ceo_username,
                ceo.signature AS ceo_signature,
                a.ceo_approved_at

            FROM requisitions r

            JOIN departments d
                ON r.department_id = d.department_id

            JOIN users creator
                ON r.user_id = creator.user_id

            LEFT JOIN approvals a
                ON a.document_id = r.requisition_id
               AND a.module_name='PRS'

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE r.requisition_id=%s
        """, (requisition_id,))

        requisition = cursor.fetchone()

        if not requisition:
            return jsonify({"success": False}), 404

        # =========================
        # ITEMS
        # =========================
        cursor.execute("""
            SELECT
                material_name,
                uom,
                qty_required
            FROM requisition_items
            WHERE requisition_id=%s
            ORDER BY item_id
        """, (requisition_id,))

        items = cursor.fetchall()

        return jsonify({
            "success": True,
            "requisition": requisition,
            "items": items
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()