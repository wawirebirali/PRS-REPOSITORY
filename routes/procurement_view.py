from flask import Blueprint, jsonify
from model import get_db_connection

procurement_view_bp = Blueprint("procurement_view", __name__)


@procurement_view_bp.route("/supplier_data")
def supplier_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            q.qrf_id,
            q.qrf_no,
            r.prs_no,
            s.supplier_name,
            s.address AS supplier_address,
            s.phone AS supplier_phone,
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

    data = cursor.fetchall()
    for item in data:
        if item.get("request_date") is not None:
            item["request_date"] = item["request_date"].isoformat()
    cursor.close()
    conn.close()

    return jsonify(data)


@procurement_view_bp.route("/supplier_details/<int:qrf_id>")
def supplier_details(qrf_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            q.qrf_id,
            q.qrf_no,
            r.prs_no,
            q.request_date,
            q.status,
            q.remarks,
            s.supplier_name,
            s.address AS supplier_address,
            s.phone AS supplier_phone,
            s.contact_person AS supplier_contact,
            u.username AS requester_name,
            d.department_name AS department
        FROM quotation_requests q
        JOIN requisitions r ON q.requisition_id = r.requisition_id
        JOIN departments d ON r.department_id = d.department_id
        JOIN users u ON q.requested_by = u.user_id
        JOIN quotation_request_suppliers qrs ON q.qrf_id = qrs.qrf_id
        JOIN suppliers s ON qrs.supplier_id = s.supplier_id
        WHERE q.qrf_id = %s
        LIMIT 1
    """, (qrf_id,))

    qrf = cursor.fetchone()

    if not qrf:
        cursor.close()
        conn.close()
        return jsonify({"error": "Quotation request not found"}), 404

    cursor.execute("""
        SELECT
            material_name,
            description,
            quantity
        FROM quotation_record_items
        WHERE qrf_id = %s
    """, (qrf_id,))

    items = cursor.fetchall()

    if qrf.get("request_date") is not None:
        qrf["request_date"] = qrf["request_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify({
        "qrf_id": qrf["qrf_id"],
        "qrf_no": qrf["qrf_no"],
        "prs_no": qrf["prs_no"],
        "request_date": qrf["request_date"],
        "status": qrf["status"],
        "remarks": qrf["remarks"],
        "supplier_name": qrf["supplier_name"],
        "supplier_address": qrf["supplier_address"],
        "supplier_phone": qrf["supplier_phone"],
        "supplier_contact": qrf["supplier_contact"],
        "requester_name": qrf["requester_name"],
        "department": qrf["department"],
        "items": items
    })


@procurement_view_bp.route("/supplier_list")
def supplier_list():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            supplier_id,
            supplier_name,
            contact_person,
            email,
            phone,
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


@procurement_view_bp.route("/po_data")
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


@procurement_view_bp.route("/po_details/<int:po_id>")
def po_details(po_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.purchase_order_id,
            p.po_number,
            p.order_date,
            r.prs_no,
            s.supplier_name,
            s.address AS supplier_address,
            s.phone AS supplier_phone,
            p.total_amount
        FROM purchase_orders p
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN suppliers s ON p.supplier_id = s.supplier_id
        WHERE p.purchase_order_id = %s
        LIMIT 1
    """, (po_id,))

    order = cursor.fetchone()
    if not order:
        cursor.close()
        conn.close()
        return jsonify({"error": "Purchase order not found"}), 404

    if order.get("order_date") is not None:
        order["order_date"] = order["order_date"].isoformat()

    cursor.execute("""
        SELECT
            item_name,
            description,
            quantity,
            unit_price
        FROM purchase_order_items
        WHERE purchase_order_id = %s
    """, (po_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "po_id": order["purchase_order_id"],
        "po_number": order["po_number"],
        "order_date": order["order_date"],
        "prs_no": order["prs_no"],
        "supplier_name": order["supplier_name"],
        "supplier_address": order["supplier_address"],
        "supplier_phone": order["supplier_phone"],
        "total_amount": str(order["total_amount"] if order["total_amount"] is not None else 0),
        "items": items
    })


@procurement_view_bp.route("/grn_data")
def grn_data():
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


@procurement_view_bp.route("/grn_details/<int:grn_id>")
def grn_details(grn_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            g.grn_id,
            g.grn_no,
            g.received_date,
            g.delivery_note_no,
            g.inspection_status,
            g.remarks,
            p.po_number,
            r.prs_no,
            s.supplier_name,
            s.address AS supplier_address,
            u.username AS received_by
        FROM grn g
        JOIN purchase_orders p ON g.po_id = p.purchase_order_id
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN suppliers s ON g.supplier_id = s.supplier_id
        JOIN users u ON g.received_by = u.user_id
        WHERE g.grn_id = %s
        LIMIT 1
    """, (grn_id,))

    grn = cursor.fetchone()
    if not grn:
        cursor.close()
        conn.close()
        return jsonify({"error": "GRN not found"}), 404

    if grn.get("received_date") is not None:
        grn["received_date"] = grn["received_date"].isoformat()

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
    for item in items:
        item["quantity_ordered"] = float(item["quantity_ordered"]) if item.get("quantity_ordered") is not None else 0
        item["quantity_received"] = float(item["quantity_received"]) if item.get("quantity_received") is not None else 0
        item["balance"] = item["quantity_ordered"] - item["quantity_received"]

    cursor.close()
    conn.close()

    return jsonify({
        "grn_id": grn["grn_id"],
        "grn_no": grn["grn_no"],
        "received_date": grn["received_date"],
        "delivery_note_no": grn["delivery_note_no"],
        "inspection_status": grn["inspection_status"],
        "remarks": grn["remarks"],
        "po_number": grn["po_number"],
        "prs_no": grn["prs_no"],
        "supplier_name": grn["supplier_name"],
        "supplier_address": grn["supplier_address"],
        "received_by": grn["received_by"],
        "items": items
    })


@procurement_view_bp.route("/invoice_data")
def invoice_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            i.invoice_id,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.status,
            i.supplier_name,
            r.prs_no,
            d.department_name AS department,
            COALESCE(
                (
                    SELECT g2.grn_no
                    FROM grn g2
                    WHERE g2.po_id = p.purchase_order_id
                    ORDER BY g2.grn_id DESC
                    LIMIT 1
                ),
                ''
            ) AS grn_no
        FROM invoices i
        JOIN purchase_orders p ON i.purchase_order_id = p.purchase_order_id
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN departments d ON r.department_id = d.department_id
        ORDER BY i.invoice_id DESC
    """)

    rows = cursor.fetchall()
    for row in rows:
        if row.get("invoice_date") is not None:
            row["invoice_date"] = row["invoice_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)


@procurement_view_bp.route("/invoice_details/<int:invoice_id>")
def invoice_details(invoice_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            i.invoice_id,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.status,
            i.supplier_name,
            r.prs_no,
            d.department_name AS department,
            p.po_number,
            (
                SELECT g2.grn_no
                FROM grn g2
                WHERE g2.po_id = p.purchase_order_id
                ORDER BY g2.grn_id DESC
                LIMIT 1
            ) AS grn_no
        FROM invoices i
        JOIN purchase_orders p ON i.purchase_order_id = p.purchase_order_id
        JOIN requisitions r ON p.requisition_id = r.requisition_id
        JOIN departments d ON r.department_id = d.department_id
        WHERE i.invoice_id = %s
        LIMIT 1
    """, (invoice_id,))

    invoice = cursor.fetchone()
    if not invoice:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invoice not found"}), 404

    if invoice.get("invoice_date") is not None:
        invoice["invoice_date"] = invoice["invoice_date"].isoformat()

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

    cursor.close()
    conn.close()

    invoice["items"] = items
    return jsonify(invoice)




# QUOTATION REQUESTS DETAILS

from flask import jsonify

# ==========================================
# QUOTATION REQUEST DETAILS
# ==========================================
@procurement_view_bp.route("/quotation_request_details/<int:qrf_id>")
def quotation_request_details(qrf_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ===============================
        # QRF HEADER
        # ===============================
        cursor.execute("""
            SELECT
                qr.qrf_id,
                qr.qrf_no,
                qr.request_date,
                qr.status,

                r.prs_no,
                r.department,

                s.supplier_name,
                s.phone,
                s.address

            FROM quotation_requests qr

            LEFT JOIN requisitions r
                ON qr.requisition_id = r.requisition_id

            LEFT JOIN suppliers s
                ON qr.supplier_id = s.supplier_id

            WHERE qr.qrf_id = %s
        """, (qrf_id,))

        qrf = cursor.fetchone()

        if not qrf:
            return jsonify({
                "error": "Quotation Request not found"
            }), 404

        # ===============================
        # QRF ITEMS
        # ===============================
        cursor.execute("""
            SELECT
                material_name,
                description,
                quantity
            FROM quotation_request_items
            WHERE qrf_id = %s
        """, (qrf_id,))

        items = cursor.fetchall()

        # ===============================
        # RESPONSE
        # ===============================
        return jsonify({

            "qrf_id": qrf["qrf_id"],

            "qrf_no": qrf["qrf_no"],

            "prs_no": qrf["prs_no"],

            "request_date": str(qrf["request_date"])
            if qrf["request_date"] else "",

            "department": qrf["department"],

            "supplier_name": qrf["supplier_name"],

            "supplier_phone": qrf["phone"],

            "supplier_address": qrf["address"],

            "status": qrf["status"],

            "items": items

        })

    except Exception as e:

        print("QRF DETAILS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()