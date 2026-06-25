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


@hod_dashboard_view_bp.route("/quotation_data")
def quotation_data():
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


@hod_dashboard_view_bp.route("/quotation_details/<int:qrf_id>")
def quotation_details(qrf_id):
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


@hod_dashboard_view_bp.route("/quotation_approve/<int:qrf_id>", methods=["POST"])
def quotation_approve(qrf_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE quotation_requests SET status = %s WHERE qrf_id = %s",
            ("Approved", qrf_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Quotation approved."})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@hod_dashboard_view_bp.route("/quotation_reject/<int:qrf_id>", methods=["POST"])
def quotation_reject(qrf_id):
    data = request.get_json(silent=True) or {}
    remarks = data.get("remarks", "Rejected by HOD")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE quotation_requests SET status = %s, remarks = %s WHERE qrf_id = %s",
            ("Rejected", remarks, qrf_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Quotation rejected."})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
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
                ceo.username AS ceo_name

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
            "ceo_name": order["ceo_name"],

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


@hod_dashboard_view_bp.route("/grn_data")
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
@hod_dashboard_view_bp.route("/grn_details/<int:grn_id>")
def grn_details(grn_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================================
        # MAIN GRN DATA + APPROVAL JOIN
        # =====================================================
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
                d.department_name,

                s.supplier_name,
                s.address AS supplier_address,

                u.username AS received_by,

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

            JOIN purchase_orders p
                ON g.po_id = p.purchase_order_id

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            JOIN suppliers s
                ON g.supplier_id = s.supplier_id

            JOIN users u
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
            return jsonify({"success": False, "error": "GRN not found"}), 404

        # =====================================================
        # SAFE DATE FORMAT
        # =====================================================
        if grn.get("received_date"):
            grn["received_date"] = grn["received_date"].isoformat()

        # =====================================================
        # ITEMS
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

        for item in items:
            ordered = float(item["quantity_ordered"] or 0)
            received = float(item["quantity_received"] or 0)

            item["quantity_ordered"] = ordered
            item["quantity_received"] = received
            item["balance"] = ordered - received

        # =====================================================
        # RESPONSE
        # =====================================================
        return jsonify({
            "success": True,

            # GRN INFO
            "grn_id": grn["grn_id"],
            "grn_no": grn["grn_no"],
            "received_date": grn["received_date"],
            "delivery_note_no": grn["delivery_note_no"],
            "inspection_status": grn["inspection_status"],
            "remarks": grn["remarks"],

            # PO / PRS
            "po_number": grn["po_number"],
            "prs_no": grn["prs_no"],
            "department_name": grn["department_name"],

            # SUPPLIER
            "supplier_name": grn["supplier_name"],
            "supplier_address": grn["supplier_address"],

            # RECEIVER
            "received_by": grn["received_by"],

            # ITEMS
            "items": items,

            # ================= APPROVAL =================
            "hod_status": grn["hod_status"] or "PENDING",
            "ceo_status": grn["ceo_status"] or "PENDING",
            "final_status": grn["final_status"] or "PENDING",

            "hod_approved_at": grn["hod_approved_at"],
            "ceo_approved_at": grn["ceo_approved_at"],

            "hod_name": grn["hod_name"],
            "ceo_name": grn["ceo_name"],

            "hod_signature": grn["hod_signature"],
            "ceo_signature": grn["ceo_signature"]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()

@hod_dashboard_view_bp.route("/grn_approve/<int:grn_id>", methods=["POST"])
def grn_approve(grn_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE grn SET inspection_status = %s WHERE grn_id = %s",
            ("ACCEPTED", grn_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "GRN approved."})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@hod_dashboard_view_bp.route("/grn_reject/<int:grn_id>", methods=["POST"])
def grn_reject(grn_id):
    data = request.get_json(silent=True) or {}
    remarks = data.get("remarks", "Rejected by HOD")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE grn SET inspection_status = %s, remarks = %s WHERE grn_id = %s",
            ("REJECTED", remarks, grn_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "GRN rejected."})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()




#GRN STARTS HERE

