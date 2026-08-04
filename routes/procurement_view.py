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
                    AND LOWER(qrs.selected_supplier) = 'yes'
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
        FROM quotation_request_items
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


@procurement_view_bp.route("/procurementpo_data")
def procurementpo_data():

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
            ON a.module_name = 'PO'
            AND a.document_id = p.purchase_order_id

        ORDER BY p.purchase_order_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("order_date") is not None:
            row["order_date"] = row["order_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)

@procurement_view_bp.route("/procurement_po_details/<int:po_id>")
def procurementPOdetails(po_id):

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

            p.total_amount,

            creator.username AS created_by_name,
            creator.signature AS created_by_signature,

            COALESCE(a.hod_status,'PENDING') AS hod_status,
            COALESCE(a.ceo_status,'PENDING') AS ceo_status,
            COALESCE(a.final_status,'PENDING') AS final_status,

            a.hod_approved_at,
            a.ceo_approved_at,

            hod.username AS hod_name,
            hod.signature AS hod_signature,

            ceo.username AS ceo_name,
            ceo.signature AS ceo_signature

        FROM purchase_orders p

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

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
        LIMIT 1
    """, (po_id,))

    order = cursor.fetchone()

    if not order:
        cursor.close()
        conn.close()
        return jsonify({"error": "Purchase order not found"}), 404

    if order["order_date"]:
        order["order_date"] = order["order_date"].isoformat()

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

        "total_amount": str(order["total_amount"] or 0),

        "created_by_name": order["created_by_name"],
        "created_by_signature": order["created_by_signature"],

        "hod_status": order["hod_status"],
        "ceo_status": order["ceo_status"],
        "final_status": order["final_status"],

        "hod_approved_at": order["hod_approved_at"],
        "ceo_approved_at": order["ceo_approved_at"],

        "hod_name": order["hod_name"],
        "hod_signature": order["hod_signature"],

        "ceo_name": order["ceo_name"],
        "ceo_signature": order["ceo_signature"],

        "items": items
    })




@procurement_view_bp.route("/quotation_data")
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


@procurement_view_bp.route("/quotations/api/<int:quotation_id>")
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


# ==========================================
# QUOTATION DETAILS
# ==========================================


@procurement_view_bp.route("/Grnprocurementdata")
def Grnprocurementdata():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            g.grn_id,
            g.grn_no,
            r.prs_no,
            s.supplier_name,

            COALESCE(a.final_status, 'PENDING') AS status,

            d.department_name AS department,
            g.received_date AS creation_date

        FROM grn g

        JOIN purchase_orders p 
            ON g.po_id = p.purchase_order_id

        JOIN requisitions r 
            ON p.requisition_id = r.requisition_id

        JOIN suppliers s 
            ON g.supplier_id = s.supplier_id

        JOIN departments d 
            ON r.department_id = d.department_id

        LEFT JOIN approvals a 
            ON a.module_name = 'GRN'
            AND a.document_id = g.grn_id

        ORDER BY g.grn_id DESC
    """)

    rows = cursor.fetchall()

    # Safe JSON conversion
    for row in rows:
        if row.get("creation_date"):
            row["creation_date"] = row["creation_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)




@procurement_view_bp.route("/procurementgrn_details/<int:grn_id>")
def procurementgrn_details(grn_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ==========================================
    # GRN HEADER + APPROVAL DATA
    # ==========================================
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

            u.username AS received_by,
            u.signature AS prepared_signature,

            COALESCE(a.hod_status, 'PENDING') AS hod_status,
            COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
            COALESCE(a.final_status, 'PENDING') AS final_status,

            a.hod_approved_at,
            a.ceo_approved_at,

            hod.username AS hod_name,
            hod.signature AS hod_signature,

            ceo.username AS ceo_name,
            ceo.signature AS ceo_signature

        FROM grn g

        JOIN purchase_orders p
            ON g.po_id = p.purchase_order_id

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

        JOIN suppliers s
            ON g.supplier_id = s.supplier_id

        LEFT JOIN users u
            ON g.received_by = u.user_id

        LEFT JOIN approvals a
            ON a.module_name = 'GRN'
            AND a.document_id = g.grn_id

        LEFT JOIN users hod
            ON a.hod_user_id = hod.user_id

        LEFT JOIN users ceo
            ON a.ceo_user_id = ceo.user_id

        WHERE g.grn_id = %s
        LIMIT 1
    """, (grn_id,))

    grn = cursor.fetchone()

    if not grn:
        cursor.close()
        conn.close()
        return jsonify({"error": "GRN not found"}), 404

    # format dates
    if grn.get("received_date"):
        grn["received_date"] = grn["received_date"].isoformat()

    if grn.get("hod_approved_at"):
        grn["hod_approved_at"] = grn["hod_approved_at"].isoformat()

    if grn.get("ceo_approved_at"):
        grn["ceo_approved_at"] = grn["ceo_approved_at"].isoformat()

    # ==========================================
    # GRN ITEMS
    # ==========================================
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

    total_received = 0

    for item in items:
        item["quantity_ordered"] = float(item.get("quantity_ordered") or 0)
        item["quantity_received"] = float(item.get("quantity_received") or 0)
        item["balance"] = item["quantity_ordered"] - item["quantity_received"]

        total_received += item["quantity_received"]

    cursor.close()
    conn.close()

    return jsonify({

        # HEADER
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

        # RECEIVED BY
        "received_by": grn["received_by"],
        "prepared_signature": grn["prepared_signature"],

        # HOD
        "hod_name": grn["hod_name"],
        "hod_signature": grn["hod_signature"],
        "hod_status": grn["hod_status"],
        "hod_approved_at": grn["hod_approved_at"],

        # CEO
        "ceo_name": grn["ceo_name"],
        "ceo_signature": grn["ceo_signature"],
        "ceo_status": grn["ceo_status"],
        "ceo_approved_at": grn["ceo_approved_at"],

        # FINAL
        "final_status": grn["final_status"],

        # ITEMS
        "total_received": total_received,
        "items": items
    })



# QUOTATION REQUESTS DETAILS

@procurement_view_bp.route("/procurementquotation_request_data")
def procurementquotationrequestdata():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                qr.qrf_id,
                qr.qrf_no,
                qr.request_date,

                COALESCE(a.final_status, 'PENDING') AS status,

                r.prs_no,
                d.department_name AS department

            FROM quotation_requests qr

            LEFT JOIN requisitions r
                ON qr.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.approval_id = (
                    SELECT approval_id
                    FROM approvals
                    WHERE module_name = 'QRF'
                      AND document_id = qr.qrf_id
                    ORDER BY approval_id DESC
                    LIMIT 1
                )

            ORDER BY qr.qrf_id DESC
        """)

        rows = cursor.fetchall()

        for row in rows:
            if row.get("request_date"):
                row["request_date"] = row["request_date"].isoformat()

        return jsonify({
            "success": True,
            "data": rows
        })

    finally:
        cursor.close()
        conn.close()



@procurement_view_bp.route("/procurementquotation_request_details/<int:qrf_id>")
def procurementquotationrequestdetails(qrf_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ===============================
        # HEADER + APPROVAL DATA
        # ===============================
        cursor.execute("""
            SELECT
                qr.qrf_id,
                qr.qrf_no,
                qr.request_date,
                qr.remarks,

                r.prs_no,
                d.department_name AS department,

                u.username AS requester_name,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                COALESCE(a.final_status, 'PENDING') AS final_status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                hod.signature AS hod_signature,
                ceo.username AS ceo_name,
                ceo.signature AS ceo_signature

            FROM quotation_requests qr

            LEFT JOIN requisitions r
                ON qr.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN users u
                ON qr.requested_by = u.user_id

            LEFT JOIN approvals a
                ON a.approval_id = (
                    SELECT approval_id
                    FROM approvals
                    WHERE module_name = 'QRF'
                      AND document_id = qr.qrf_id
                    ORDER BY approval_id DESC
                    LIMIT 1
                )

            LEFT JOIN users hod
                ON a.hod_user_id = hod.user_id

            LEFT JOIN users ceo
                ON a.ceo_user_id = ceo.user_id

            WHERE qr.qrf_id = %s
            LIMIT 1
        """, (qrf_id,))

        qrf = cursor.fetchone()

        if not qrf:
            return jsonify({
                "success": False,
                "message": "Quotation Request not found"
            }), 404

        # ===============================
        # ITEMS
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
        # SAFE DATE FORMAT
        # ===============================
        def safe_date(val):
            return val.isoformat() if val else None

        # ===============================
        # RESPONSE
        # ===============================
        return jsonify({
            "success": True,

            "qrf_id": qrf["qrf_id"],
            "qrf_no": qrf["qrf_no"],
            "prs_no": qrf["prs_no"],
            "request_date": safe_date(qrf["request_date"]),
            "department": qrf["department"],
            "requester_name": qrf["requester_name"],
            "remarks": qrf["remarks"],

            # UNIFIED STATUS
            "status": qrf["final_status"],

            "hod_status": qrf["hod_status"],
            "ceo_status": qrf["ceo_status"],

            "hod_approval_date": safe_date(qrf["hod_approved_at"]),
            "ceo_approval_date": safe_date(qrf["ceo_approved_at"]),
            "hod_name": qrf["hod_name"],
            "hod_signature": qrf["hod_signature"],
            "ceo_name": qrf["ceo_name"],
            "ceo_signature": qrf["ceo_signature"],

            # ITEMS (CLEAN STRUCTURE)
            "items": [
                {
                    "material_name": i["material_name"],
                    "description": i["description"],
                    "quantity": i["quantity"]
                }
                for i in items
            ]
        })

    finally:
        cursor.close()
        conn.close()




    








@procurement_view_bp.route("/dashboard_data")
def dashboard_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)


    # ================= KPI =================


    cursor.execute("""
        SELECT COUNT(*) total
        FROM requisitions
    """)

    total_pr = cursor.fetchone()["total"]



    cursor.execute("""
        SELECT COUNT(*) total
        FROM approvals
        WHERE module_name = 'PRS'
          AND LOWER(COALESCE(final_status, '')) IN ('pending', 'pending_hod', 'pending_ceo')
    """)

    pending_pr = cursor.fetchone()["total"]





    cursor.execute("""
        SELECT COUNT(*) total
        FROM quotation_requests
    """)

    total_qrf = cursor.fetchone()["total"]





    cursor.execute("""
        SELECT COUNT(*) total
        FROM purchase_orders
    """)

    total_po = cursor.fetchone()["total"]





    cursor.execute("""
        SELECT COUNT(*) total
        FROM grn
    """)

    total_grn = cursor.fetchone()["total"]





    # ================= MONTHLY DATA =================


    cursor.execute("""
        SELECT 
            MONTH(submission_date) month,
            COUNT(*) total

        FROM requisitions

        GROUP BY MONTH(submission_date)

        ORDER BY month
    """)


    pr_rows = cursor.fetchall()



    months=[]
    pr_monthly=[]


    for row in pr_rows:

        months.append(
            row["month"]
        )

        pr_monthly.append(
            row["total"]
        )





    # ================= STATUS =================


    cursor.execute("""
        SELECT
            final_status,
            COUNT(*) total
        FROM approvals
        WHERE module_name = 'PRS'
        GROUP BY final_status
    """)

    status_rows = cursor.fetchall()

    status_counts = {
        "PENDING": 0,
        "APPROVED": 0,
        "REJECTED": 0
    }

    for row in status_rows:
        final_status = row.get("final_status")
        if final_status in status_counts:
            status_counts[final_status] = row["total"]

    status = [
        status_counts["PENDING"],
        status_counts["APPROVED"],
        0,
        status_counts["REJECTED"]
    ]


    cursor.close()
    conn.close()



    return jsonify({

        "total_pr":total_pr,

        "pending_pr":pending_pr,

        "total_qrf":total_qrf,

        "total_po":total_po,

        "total_grn":total_grn,


        "months":months,

        "pr_monthly":pr_monthly,

        "po_monthly":[],


        "grn_monthly":[],


        "status":status,


        "departments":[],


        "department_count":[],


        "suppliers":[],


        "supplier_orders":[],


        "materials":[],


        "material_qty":[]

    })