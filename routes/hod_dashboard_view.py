from flask import Blueprint, jsonify, render_template, session, redirect, url_for, flash, request
from model import get_db_connection, get_requisition_by_id, get_requisition_items, get_requisition_approvals, approve_requisition, reject_requisition, get_pending_requisitions_for_role

hod_dashboard_view_bp = Blueprint("hod_dashboard_view", __name__, template_folder="../templates")


@hod_dashboard_view_bp.route("/supplier_list")
def supplier_list():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            supplier_id,
            supplier_name,
            contact_person,
            phone,
            email,
            address,
            tin_number,
            registration_number,
            bank_name,
            account_number
        FROM suppliers
        ORDER BY supplier_name ASC
    """)

    suppliers = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(suppliers)


@hod_dashboard_view_bp.route("/quotationRequest_data")
def quotationRequest_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            q.qrf_id,
            q.qrf_no,
            r.prs_no,
            s.supplier_name,
            q.status,
            d.department_name AS department,
            q.request_date
        FROM quotation_requests q
        JOIN requisitions r ON q.requisition_id = r.requisition_id
        JOIN departments d ON r.department_id = d.department_id
        JOIN quotation_request_suppliers qrs ON q.qrf_id = qrs.qrf_id
        JOIN suppliers s ON qrs.supplier_id = s.supplier_id
        ORDER BY q.qrf_id DESC
    """)

    quotations = cursor.fetchall()
    for item in quotations:
        if item.get("request_date") is not None:
            item["request_date"] = item["request_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(quotations)

@hod_dashboard_view_bp.route("/quotationRequest_details/<int:qrf_id>")
def quotationRequest_details(qrf_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ================= QRF HEADER =================
        cursor.execute("""
            SELECT
                q.qrf_id,
                q.qrf_no,
                r.prs_no,
                q.request_date,
                q.deadline_date,
                q.status,
                q.remarks,

                u.username AS requester_name,
                d.department_name AS department

            FROM quotation_requests q

            JOIN requisitions r
                ON q.requisition_id = r.requisition_id

            JOIN users u
                ON q.requested_by = u.user_id

            JOIN departments d
                ON r.department_id = d.department_id

            WHERE q.qrf_id = %s
        """, (qrf_id,))

        qrf = cursor.fetchone()

        if not qrf:
            return jsonify({
                "success": False,
                "error": "QRF not found"
            }), 404

        # ================= SUPPLIERS =================
        cursor.execute("""
            SELECT
                s.supplier_id,
                s.supplier_name,
                s.address,
                s.phone,
                qrs.supplier_response,
                qrs.sent_date,
                qrs.selected_supplier
            FROM quotation_request_suppliers qrs
            JOIN suppliers s
                ON qrs.supplier_id = s.supplier_id
            WHERE qrs.qrf_id = %s
        """, (qrf_id,))

        suppliers = cursor.fetchall()

        # ================= ITEMS =================
        cursor.execute("""
            SELECT
                material_name,
                description,
                quantity
            FROM quotation_request_items
            WHERE qrf_id = %s
        """, (qrf_id,))

        items = cursor.fetchall()

        # ================= APPROVAL =================
        cursor.execute("""
            SELECT
                a.hod_status,
                a.ceo_status,
                a.final_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                ceo.username AS ceo_name,

                hod.signature AS hod_signature,
                ceo.signature AS ceo_signature

            FROM approvals a

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE a.module_name = 'QRF'
              AND a.document_id = %s
        """, (qrf_id,))

        approval = cursor.fetchone()

        # ================= FORMAT =================
        if qrf.get("request_date"):
            qrf["request_date"] = qrf["request_date"].isoformat()

        if approval and approval.get("hod_approved_at"):
            approval["hod_approved_at"] = approval["hod_approved_at"].isoformat()

        if approval and approval.get("ceo_approved_at"):
            approval["ceo_approved_at"] = approval["ceo_approved_at"].isoformat()

        # ================= RESPONSE =================
        return jsonify({
            "success": True,

            # QRF HEADER
            "qrf_id": qrf["qrf_id"],
            "qrf_no": qrf["qrf_no"],
            "prs_no": qrf["prs_no"],
            "request_date": qrf["request_date"],
            "deadline_date": qrf["deadline_date"],
            "status": qrf["status"],
            "remarks": qrf["remarks"],
            "requester_name": qrf["requester_name"],
            "department": qrf["department"],

            # DATA
            "items": items,
            "suppliers": suppliers,

            # APPROVAL
            "hod_status": approval["hod_status"] if approval else "PENDING",
            "ceo_status": approval["ceo_status"] if approval else "PENDING",
            "final_status": approval["final_status"] if approval else "PENDING",

            "hod_approved_at": approval["hod_approved_at"] if approval else None,
            "ceo_approved_at": approval["ceo_approved_at"] if approval else None,

            "hod_name": approval["hod_name"] if approval else None,
            "ceo_name": approval["ceo_name"] if approval else None,

            "hod_signature": approval["hod_signature"] if approval else None,
            "ceo_signature": approval["ceo_signature"] if approval else None
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()




@hod_dashboard_view_bp.route("/po_data")
def po_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.purchase_order_id,
            p.po_number,
            r.prs_no,
            s.supplier_name,
            p.status,
            d.department_name AS department,
            p.order_date
        FROM purchase_orders p
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN suppliers s ON p.supplier_id = s.supplier_id
        JOIN departments d ON r.department_id = d.department_id
        ORDER BY p.purchase_order_id DESC
    """)

    rows = cursor.fetchall()
    for row in rows:
        if row.get("order_date") is not None:
            row["order_date"] = row["order_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)
@hod_dashboard_view_bp.route("/po_details/<int:po_id>")
def po_details(po_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================================
        # MAIN PURCHASE ORDER + JOIN EVERYTHING PROPERLY
        # =====================================================
        cursor.execute("""
            SELECT
                p.purchase_order_id,
                p.po_number,
                p.order_date,
                p.total_amount,

                r.prs_no,

                d.department_name,

                s.supplier_name,
                s.address AS supplier_address,
                s.phone AS supplier_phone,

                r.user_id AS created_by_user_id,
                creator.username AS created_by_name,
                creator.signature AS created_by_signature,

                a.hod_status,
                a.ceo_status,
                a.final_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                hod.signature AS hod_signature,

                ceo.username AS ceo_name,
                ceo.signature AS ceo_signature

            FROM purchase_orders p

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            JOIN suppliers s
                ON p.supplier_id = s.supplier_id

            LEFT JOIN users creator
                ON r.user_id = creator.user_id

            LEFT JOIN approvals a
                ON a.module_name = 'PO'
               AND a.document_id = p.purchase_order_id

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE p.purchase_order_id = %s
        """, (po_id,))

        order = cursor.fetchone()

        if not order:
            return jsonify({"error": "Purchase order not found"}), 404

        # =====================================================
        # ITEMS
        # =====================================================
        cursor.execute("""
            SELECT
                item_name,
                description,
                quantity,
                unit_price,
                total_price
            FROM purchase_order_items
            WHERE purchase_order_id = %s
        """, (po_id,))

        items = cursor.fetchall()

        # =====================================================
        # RESPONSE
        # =====================================================
        return jsonify({
            "po_id": order["purchase_order_id"],
            "po_number": order["po_number"],
            "order_date": order["order_date"],
            "prs_no": order["prs_no"],

            # DEPARTMENT
            "department_name": order["department_name"],

            # SUPPLIER
            "supplier_name": order["supplier_name"],
            "supplier_address": order["supplier_address"],
            "supplier_phone": order["supplier_phone"],

            # TOTAL
            "total_amount": str(order["total_amount"] or 0),

            # ITEMS
            "items": items,

            # APPROVAL
            "hod_status": order["hod_status"] or "PENDING",
            "ceo_status": order["ceo_status"] or "PENDING",
            "final_status": order["final_status"] or "PENDING",

            "hod_approved_at": order["hod_approved_at"],
            "ceo_approved_at": order["ceo_approved_at"],

            "hod_name": order["hod_name"],
            "hod_signature": order["hod_signature"],
            "ceo_name": order["ceo_name"],
            "ceo_signature": order["ceo_signature"],

            # CREATOR
            "created_by": {
                "user_id": order["created_by_user_id"],
                "username": order["created_by_name"],
                "signature": order["created_by_signature"]
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@hod_dashboard_view_bp.route("/hod_grn_data")
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
            g.inspection_status AS status,
            d.department_name AS department,
            g.received_date
        FROM grn g
        JOIN purchase_orders p ON g.po_id = p.purchase_order_id
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN departments d ON r.department_id = d.department_id
        JOIN suppliers s ON g.supplier_id = s.supplier_id
        ORDER BY g.grn_id DESC
    """)

    rows = cursor.fetchall()
    for row in rows:
        if row.get("received_date") is not None:
            row["received_date"] = row["received_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)
@hod_dashboard_view_bp.route("/hod_grn_details/<int:grn_id>")
def hod_grn_details(grn_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # =====================================================
        # FETCH GRN HEADER DETAILS
        # =====================================================
        query = """
            SELECT
                g.grn_id,
                g.grn_no,
                g.received_date,
                g.delivery_note_no,
                g.inspection_status,
                g.remarks,

                p.po_number,
                r.prs_no,

                d.department_name,

                s.supplier_name,
                s.address AS supplier_address,

                u.username AS received_by,
                u.signature AS receiver_signature,

                a.hod_status,
                a.ceo_status,
                a.final_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                ceo.username AS ceo_name,

                hod.signature AS hod_signature,
                ceo.signature AS ceo_signature

            FROM grn g

            INNER JOIN purchase_orders p
                ON g.po_id = p.purchase_order_id

            INNER JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN suppliers s
                ON g.supplier_id = s.supplier_id

            LEFT JOIN users u
                ON g.received_by = u.user_id

            LEFT JOIN approvals a
                ON a.document_id = g.grn_id
               AND a.module_name = 'GRN'

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE g.grn_id = %s
            LIMIT 1
        """

        cursor.execute(query, (grn_id,))
        grn = cursor.fetchone()

        if not grn:
            return jsonify({
                "success": False,
                "error": "GRN not found"
            }), 404

        # =====================================================
        # CONVERT DATETIME FIELDS
        # =====================================================
        date_fields = [
            "received_date",
            "hod_approved_at",
            "ceo_approved_at"
        ]

        for field in date_fields:
            if grn.get(field):
                grn[field] = grn[field].isoformat()
            else:
                grn[field] = None

        # =====================================================
        # FETCH ITEMS
        # =====================================================
        cursor.execute("""
            SELECT
                material_name,
                description,
                quantity_ordered,
                quantity_received
            FROM grn_items
            WHERE grn_id = %s
        """, (grn_id,))

        items = cursor.fetchall()

        formatted_items = []

        for item in items:

            ordered = float(item.get("quantity_ordered") or 0)
            received = float(item.get("quantity_received") or 0)

            formatted_items.append({
                "material_name": item.get("material_name"),
                "description": item.get("description"),
                "quantity_ordered": ordered,
                "quantity_received": received,
                "balance": ordered - received
            })

        # =====================================================
        # RESPONSE
        # =====================================================
        response = {
            "success": True,

            # -------------------------
            # GRN DETAILS
            # -------------------------
            "grn_id": grn.get("grn_id"),
            "grn_no": grn.get("grn_no"),
            "received_date": grn.get("received_date"),
            "delivery_note_no": grn.get("delivery_note_no"),
            "inspection_status": grn.get("inspection_status"),
            "remarks": grn.get("remarks"),

            # -------------------------
            # PROCUREMENT DETAILS
            # -------------------------
            "po_number": grn.get("po_number"),
            "prs_no": grn.get("prs_no"),
            "department_name": grn.get("department_name"),

            # -------------------------
            # SUPPLIER DETAILS
            # -------------------------
            "supplier_name": grn.get("supplier_name"),
            "supplier_address": grn.get("supplier_address"),

            # -------------------------
            # RECEIVING DETAILS
            # -------------------------
            "received_by": grn.get("received_by"),

            # -------------------------
            # ITEMS
            # -------------------------
            "items": formatted_items,

            # -------------------------
            # APPROVAL INFORMATION
            # -------------------------
            "hod_status": grn.get("hod_status") or "PENDING",
            "ceo_status": grn.get("ceo_status") or "PENDING",
            "final_status": grn.get("final_status") or "PENDING",

            "hod_approved_at": grn.get("hod_approved_at"),
            "ceo_approved_at": grn.get("ceo_approved_at"),

            "hod_name": grn.get("hod_name"),
            "ceo_name": grn.get("ceo_name"),

            "receiver_signature": grn.get("receiver_signature"),
            "hod_signature": grn.get("hod_signature"),
            "ceo_signature": grn.get("ceo_signature")
        }

        return jsonify(response), 200

    except Exception as e:
        print("GRN DETAILS ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()






@hod_dashboard_view_bp.route("/invoice_data")
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
                i.status,

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

            ORDER BY i.invoice_id DESC
        """)

        invoices = cursor.fetchall()

        for invoice in invoices:
            if invoice["invoice_date"]:
                invoice["invoice_date"] = invoice["invoice_date"].isoformat()

            invoice["total_amount"] = float(
                invoice["total_amount"] or 0
            )

        return jsonify(invoices)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@hod_dashboard_view_bp.route("/hod_invoice_details/<int:invoice_id>")
def invoice_details(invoice_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ==========================================
        # INVOICE HEADER
        # ==========================================
        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.total_amount,
                i.status,
                i.supplier_name,

                p.po_number,
                r.prs_no,
                d.department_name,

                creator.username AS creator_name,
                creator.signature AS creator_signature,

                hod_user.username AS hod_name,
                hod_user.signature AS hod_signature,

                ceo_user.username AS ceo_name,
                ceo_user.signature AS ceo_signature,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.ceo_status,'PENDING') AS ceo_status,
                COALESCE(a.final_status,'PENDING') AS final_status

            FROM invoices i

            JOIN purchase_orders p
                ON i.purchase_order_id = p.purchase_order_id

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            -- creator of requisition
            LEFT JOIN users creator
                ON r.user_id = creator.user_id

            -- approval table
            LEFT JOIN approvals a
                ON a.module_name = 'INVOICE'
                AND a.document_id = i.invoice_id

            LEFT JOIN users hod_user
                ON a.hod_user_id = hod_user.user_id

            LEFT JOIN users ceo_user
                ON a.ceo_user_id = ceo_user.user_id

            WHERE i.invoice_id = %s
            LIMIT 1
        """, (invoice_id,))

        invoice = cursor.fetchone()

        if not invoice:
            return jsonify({
                "success": False,
                "error": "Invoice not found"
            }), 404

        # ==========================================
        # FORMAT DATE
        # ==========================================
        if invoice.get("invoice_date"):
            invoice["invoice_date"] = \
                invoice["invoice_date"].strftime("%Y-%m-%d")

        # ==========================================
        # ITEMS
        # ==========================================
        cursor.execute("""
            SELECT
                description,
                quantity,
                unit_price,
                total_price
            FROM invoice_items
            WHERE invoice_id = %s
        """, (invoice_id,))

        items = cursor.fetchall()

        # ==========================================
        # RESPONSE
        # ==========================================
        return jsonify({
            "success": True,

            "invoice_id": invoice["invoice_id"],
            "invoice_number": invoice["invoice_number"],
            "invoice_date": invoice["invoice_date"],
            "total_amount": invoice["total_amount"],
            "status": invoice["final_status"],
            "supplier_name": invoice["supplier_name"],

            "po_number": invoice["po_number"],
            "prs_no": invoice["prs_no"],
            "department_name": invoice["department_name"],

            "creator_name": invoice["creator_name"],
            "creator_signature": invoice["creator_signature"],

            "hod_name": invoice["hod_name"],
            "hod_signature": invoice["hod_signature"],
            "hod_status": invoice["hod_status"],

            "ceo_name": invoice["ceo_name"],
            "ceo_signature": invoice["ceo_signature"],
            "ceo_status": invoice["ceo_status"],

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

@hod_dashboard_view_bp.route("/payments_data")
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

@hod_dashboard_view_bp.route("/payment_details/<int:payment_id>")
def payment_details(payment_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ============================
        # PAYMENT HEADER INFO
        # ============================
        cursor.execute("""
            SELECT
                p.payment_id,
                p.payment_no,
                p.payment_date,
                p.payment_method,
                p.amount,
                p.amount_paid,
                p.balance,
                p.payment_status,

                i.invoice_number,
                i.total_amount AS invoice_amount,

                s.supplier_name,

                d.department_name,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                COALESCE(a.final_status, 'PENDING') AS final_status,
                a.hod_approved_at,
                a.ceo_approved_at,

                prep.username AS prepared_by,
                prep.signature AS prepared_signature,

                hod.username AS hod_name,
                hod.signature AS hod_signature,

                ceo.username AS ceo_name,
                ceo.signature AS ceo_signature

            FROM payments p

            JOIN invoices i
                ON p.invoice_id = i.invoice_id

            JOIN purchase_orders po
                ON i.purchase_order_id = po.purchase_order_id

            JOIN suppliers s
                ON po.supplier_id = s.supplier_id

            JOIN requisitions r
                ON po.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            JOIN users prep
                ON p.paid_by = prep.user_id

            LEFT JOIN approvals a
                ON a.module_name = 'PAYMENT'
                AND a.document_id = p.payment_id

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE p.payment_id = %s
        """, (payment_id,))

        payment = cursor.fetchone()

        if not payment:
            return jsonify({
                "success": False,
                "message": "Payment not found"
            }), 404

        # ============================
        # INVOICE ITEMS
        # ============================
        cursor.execute("""
            SELECT
                description AS item_name,
                quantity,
                unit_price,
                total_price
            FROM invoice_items
            WHERE invoice_id = (
                SELECT invoice_id
                FROM payments
                WHERE payment_id = %s
            )
        """, (payment_id,))

        items = cursor.fetchall()

        # ============================
        # FORMAT DATE
        # ============================
        if payment.get("payment_date"):
            payment["payment_date"] = payment["payment_date"].isoformat()

        return jsonify({
            "success": True,
            "data": payment,
            "items": items
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()








#quotation and quotation request.




@hod_dashboard_view_bp.route("/quotation_data")
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


@hod_dashboard_view_bp.route("/quotations/api/<int:quotation_id>")
def quotation_details(quotation_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================
        # QUOTATION HEADER
        # =====================================
        cursor.execute("""
            SELECT
                q.quotation_id,
                q.quotation_no,
                q.quotation_date,
                q.qrf_id,
                q.total_amount,
                q.delivery_date,
                q.warranty,
                q.payment_terms,
                q.remarks,

                COALESCE(a.final_status, 'PENDING') AS status,

                qr.qrf_no,
                qr.request_date,
                qr.deadline_date,

                r.prs_no,
                d.department_name,

                u.username AS requester_name,
                u.email AS requester_email,
                u.signature AS requester_signature,

                s.supplier_name,
                s.contact_person,
                s.email AS supplier_email,
                s.phone,
                s.address,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                a.hod_approved_at,
                a.ceo_approved_at

            FROM quotations q

            LEFT JOIN quotation_requests qr
                ON qr.qrf_id = q.qrf_id

            LEFT JOIN requisitions r
                ON qr.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN users u
                ON qr.requested_by = u.user_id

            LEFT JOIN suppliers s
                ON q.supplier_id = s.supplier_id

            LEFT JOIN approvals a
                ON a.module_name = 'QUOTATION'
               AND a.document_id = q.quotation_id

            WHERE q.quotation_id = %s
        """, (quotation_id,))

        quotation = cursor.fetchone()

        if not quotation:
            return jsonify({
                "success": False,
                "message": "Quotation not found"
            }), 404

        # =====================================
        # ITEMS
        # =====================================
        cursor.execute("""
            SELECT
                item_name,
                description,
                quantity,
                unit_price,
                amount
            FROM quotation_records_items
            WHERE quotation_id = %s
        """, (quotation_id,))

        items = cursor.fetchall()

        # =====================================
        # HOD SIGNATURE
        # =====================================
        cursor.execute("""
            SELECT
                a.hod_status,
                a.hod_approved_at,
                u.username,
                u.signature
            FROM approvals a
            LEFT JOIN users u
                ON u.user_id = a.hod_user_id
            WHERE a.module_name = 'QUOTATION'
              AND a.document_id = %s
            LIMIT 1
        """, (quotation_id,))

        hod_signature = cursor.fetchone()

        # =====================================
        # CEO SIGNATURE
        # =====================================
        cursor.execute("""
            SELECT
                a.ceo_status,
                a.ceo_approved_at,
                u.username,
                u.signature
            FROM approvals a
            LEFT JOIN users u
                ON u.user_id = a.ceo_user_id
            WHERE a.module_name = 'QUOTATION'
              AND a.document_id = %s
            LIMIT 1
        """, (quotation_id,))

        ceo_signature = cursor.fetchone()

        return jsonify({
            "success": True,
            "quotation": quotation,
            "items": items,
            "hod_signature": hod_signature,
            "ceo_signature": ceo_signature
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()