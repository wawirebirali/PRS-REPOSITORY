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


# =========================================================
# GET GRN DETAILS FOR INVOICE
#
# Loads:
#   1. PO Number
#   2. Supplier
#   3. GRN Items
# =========================================================





# ============================================================
# FINANCE INVOICE APIs
# ============================================================

from flask import request, jsonify, session
from db_connect import get_db_connection


# ============================================================
# INVOICE API ROUTES
# ============================================================


# ============================================================
# 1. LOAD ALL INVOICES
# ============================================================

@finance_dashboard_bp.route(
    "/api/invoices",
    methods=["GET"]
)
def get_finance_invoices():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
           SELECT
        i.invoice_id,
        i.invoice_number AS invoice_no,
        i.invoice_date,
        i.total_amount,

        a.final_status AS invoice_status,

        g.grn_id,
        g.grn_no,

        po.purchase_order_id AS po_id,
        po.po_number AS po_no,

        po.supplier_id,
        COALESCE(i.supplier_name, s.supplier_name) AS supplier_name,

        r.requisition_id,
        r.prs_no,

        d.department_id,
        d.department_name,

        i.created_by

    FROM invoices i

    INNER JOIN approvals a
        ON a.document_id = i.invoice_id
        AND UPPER(TRIM(a.module_name)) = 'INVOICE'

    LEFT JOIN grn g
        ON g.grn_id = (
            SELECT MAX(g2.grn_id)
            FROM grn g2
            WHERE g2.po_id = i.purchase_order_id
        )

    LEFT JOIN purchase_orders po
        ON i.purchase_order_id = po.purchase_order_id

    LEFT JOIN suppliers s
        ON po.supplier_id = s.supplier_id

    LEFT JOIN requisitions r
        ON po.requisition_id = r.requisition_id

    LEFT JOIN departments d
        ON r.department_id = d.department_id

    ORDER BY i.invoice_id DESC;
        """)

        invoices = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(invoices),
            "invoices": invoices
        })

    except Exception as e:

        print(
            "FINANCE LOAD INVOICES ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e),
            "invoices": []
        }), 500

    finally:

        if cursor:

            try:
                cursor.close()
            except Exception:
                pass

        if conn:

            try:
                conn.close()
            except Exception:
                pass


# ============================================================
# 2. LOAD SINGLE INVOICE DETAILS
# ============================================================

@finance_dashboard_bp.route(
    "/api/invoices/<int:invoice_id>",
    methods=["GET"]
)
def get_finance_invoice_details(invoice_id):

    conn = None
    cursor = None

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # ====================================================
        # INVOICE BASIC INFORMATION
        # ====================================================

        cursor.execute("""
            SELECT
            i.invoice_id,
            i.invoice_number AS invoice_no,
            i.invoice_date,
            i.total_amount,
            COALESCE(a.final_status, 'PENDING') AS invoice_status,
            i.created_by,

            g.grn_id,
            g.grn_no,

            po.purchase_order_id AS po_id,
            po.po_number AS po_no,

            po.supplier_id,
            COALESCE(i.supplier_name, s.supplier_name) AS supplier_name,

            r.requisition_id,
            r.prs_no,

            d.department_id,
            d.department_name

        FROM invoices i

        LEFT JOIN approvals a
            ON a.document_id = i.invoice_id
            AND UPPER(TRIM(a.module_name)) = 'INVOICE'

        LEFT JOIN grn g
            ON g.grn_id = (
                SELECT MAX(g2.grn_id)
                FROM grn g2
                WHERE g2.po_id = i.purchase_order_id
            )

        LEFT JOIN purchase_orders po
            ON i.purchase_order_id = po.purchase_order_id

        LEFT JOIN suppliers s
            ON po.supplier_id = s.supplier_id

        LEFT JOIN requisitions r
            ON po.requisition_id = r.requisition_id

        LEFT JOIN departments d
            ON r.department_id = d.department_id

        WHERE i.invoice_id = %s

        LIMIT 1;
        """, (invoice_id,))

        invoice = cursor.fetchone()

        if not invoice:

            return jsonify({
                "success": False,
                "message": "Invoice not found"
            }), 404


        # ====================================================
        # INVOICE ITEMS
        # ====================================================

        cursor.execute("""
            SELECT
                ii.invoice_item_id,
                ii.description AS item_name,
                ii.description,
                ii.quantity,
                ii.unit_price,
                ii.total_price AS amount

            FROM invoice_items ii

            WHERE ii.invoice_id = %s

            ORDER BY ii.invoice_item_id ASC
        """, (invoice_id,))

        items = cursor.fetchall()


        # ====================================================
        # APPROVAL INFORMATION
        # ====================================================

        cursor.execute("""
            SELECT
                approval_id,
                module_name,
                document_id,

                hod_status,
                hod_user_id,
                hod_approved_at,

                ceo_status,
                ceo_user_id,
                ceo_approved_at,

                final_status

            FROM approvals

            WHERE module_name = 'INVOICE'
              AND document_id = %s

            LIMIT 1
        """, (invoice_id,))

        approval = cursor.fetchone()


        # ====================================================
        # PROCUREMENT / CREATOR
        # ====================================================

        procurement_name = None

        if invoice.get("created_by"):

            cursor.execute("""
                SELECT
                    user_id,
                    username,
                    signature

                FROM users

                WHERE user_id = %s

                LIMIT 1
            """, (invoice["created_by"],))

            creator = cursor.fetchone()

            if creator:

                procurement_name = creator["username"]
                creator_signature = creator["signature"]
            else:
                creator_signature = None
        else:
            creator_signature = None


        # ====================================================
        # HOD APPROVER
        # ====================================================

        hod_name = None

        if approval and approval.get("hod_user_id"):

            cursor.execute("""
                SELECT
                    username,
                    signature

                FROM users

                WHERE user_id = %s

                LIMIT 1
            """, (approval["hod_user_id"],))

            hod_user = cursor.fetchone()

            if hod_user:

                hod_name = hod_user["username"]
                hod_signature = hod_user["signature"]
            else:
                hod_signature = None
        else:
            hod_signature = None


        # ====================================================
        # CEO APPROVER
        # ====================================================

        ceo_name = None

        if approval and approval.get("ceo_user_id"):

            cursor.execute("""
                SELECT
                    username,
                    signature

                FROM users

                WHERE user_id = %s

                LIMIT 1
            """, (approval["ceo_user_id"],))

            ceo_user = cursor.fetchone()

            if ceo_user:

                ceo_name = ceo_user["username"]
                ceo_signature = ceo_user["signature"]
            else:
                ceo_signature = None
        else:
            ceo_signature = None


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "invoice": invoice,

            "items": items,

            "approval": approval,

            "signatures": {

                "prepared_name":
                    procurement_name,

                "prepared_signature":
                    creator_signature,

                "hod":
                    hod_name,

                "hod_signature":
                    hod_signature,

                "ceo":
                    ceo_name,

                "ceo_signature":
                    ceo_signature
            }

        })


    except Exception as e:

        print(
            "FINANCE INVOICE DETAILS ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        if cursor:

            try:
                cursor.close()
            except Exception:
                pass

        if conn:

            try:
                conn.close()
            except Exception:
                pass


# ============================================================
# 3. SEARCH INVOICES
# ============================================================

@finance_dashboard_bp.route(
    "/api/invoices/search",
    methods=["GET"]
)
def search_finance_invoices():

    conn = None
    cursor = None

    try:

        search = request.args.get(
            "q",
            ""
        ).strip()


        if not search:

            return jsonify({

                "success": True,

                "count": 0,

                "invoices": []

            })


        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)


        keyword = f"%{search}%"


        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_no,
                i.invoice_date,
                i.total_amount,
                i.invoice_status,

                g.grn_no,

                po.po_no,

                s.supplier_name,

                r.prs_no,

                d.department_name

            FROM invoices i

            LEFT JOIN grn g
                ON i.grn_id = g.grn_id

            LEFT JOIN purchase_orders po
                ON i.po_id = po.po_id

            LEFT JOIN suppliers s
                ON i.supplier_id = s.supplier_id

            LEFT JOIN requisitions r
                ON po.requisition_id = r.requisition_id

            LEFT JOIN departments d
                ON r.department_id = d.department_id

            WHERE
                i.invoice_no LIKE %s

                OR g.grn_no LIKE %s

                OR po.po_no LIKE %s

                OR s.supplier_name LIKE %s

                OR r.prs_no LIKE %s

            ORDER BY i.invoice_id DESC

        """, (
            keyword,
            keyword,
            keyword,
            keyword,
            keyword
        ))


        invoices = cursor.fetchall()


        return jsonify({

            "success": True,

            "count":
                len(invoices),

            "invoices":
                invoices

        })


    except Exception as e:

        print(
            "FINANCE INVOICE SEARCH ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e),

            "invoices": []

        }), 500


    finally:

        if cursor:

            try:
                cursor.close()
            except Exception:
                pass

        if conn:

            try:
                conn.close()
            except Exception:
                pass


# ============================================================
# 4. GET NEXT INVOICE NUMBER
# ============================================================
# =========================================================
# GENERATE NEXT INVOICE NUMBER
#
# GET:
# /finance/api/invoices/next-number
#
# Example response:
# {
#     "success": true,
#     "invoice_no": "INV-2026-0001"
# }
# =========================================================
# =========================================================
# GENERATE NEXT INVOICE NUMBER
#
# GET:
# /finance/api/invoices/next-number
#
# Example:
# INV-20260811-2520
# INV-20260811-2521
# =========================================================
from flask import request, jsonify, session
from datetime import datetime
from decimal import Decimal, InvalidOperation


@finance_dashboard_bp.route(
    "/api/invoices/next-number",
    methods=["GET"]
)
def get_next_invoice_number():

    conn = None
    cursor = None

    try:

        # =====================================================
        # DATABASE CONNECTION
        # =====================================================

        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)


        # =====================================================
        # CURRENT YEAR
        # =====================================================

        year = datetime.now().year


        # =====================================================
        # FIND LAST INVOICE FOR THIS YEAR
        #
        # Expected format:
        #
        # INV-2026-0001
        # INV-2026-0002
        #
        # =====================================================

        prefix = f"INV-{year}-"


        cursor.execute("""
            SELECT
                invoice_number
            FROM invoices
            WHERE invoice_number LIKE %s
            ORDER BY invoice_id DESC
            LIMIT 1
        """, (
            f"{prefix}%",
        ))


        last_invoice = cursor.fetchone()


        # =====================================================
        # DEFAULT NUMBER
        # =====================================================

        last_number = 0


        # =====================================================
        # EXTRACT LAST NUMBER
        # =====================================================

        if last_invoice:

            last_invoice_number = (
                last_invoice.get("invoice_number")
            )


            if last_invoice_number:

                try:

                    # Example:
                    #
                    # INV-2026-0007
                    #
                    # becomes:
                    #
                    # ["INV", "2026", "0007"]

                    parts = (
                        str(last_invoice_number)
                        .split("-")
                    )


                    if len(parts) == 3:

                        last_number = int(
                            parts[2]
                        )

                except (
                    ValueError,
                    TypeError,
                    IndexError
                ):

                    last_number = 0


        # =====================================================
        # NEXT NUMBER
        # =====================================================

        next_number = (
            last_number + 1
        )


        # =====================================================
        # CREATE INVOICE NUMBER
        #
        # INV-2026-0001
        # =====================================================

        invoice_number = (
            f"INV-{year}-{next_number:04d}"
        )


        print(
            "NEXT INVOICE NUMBER:",
            invoice_number
        )


        # =====================================================
        # RETURN
        # =====================================================

        return jsonify({

            "success": True,

            "invoice_no":
                invoice_number,

            "invoice_number":
                invoice_number,

            "year":
                year,

            "number":
                next_number

        }), 200


    except Exception as e:

        print(
            "GET NEXT INVOICE NUMBER ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()



# ============================================================
# 5. LOAD AVAILABLE GRNs FOR INVOICE
# ============================================================
@finance_dashboard_bp.route(
    "/api/invoices/grns",
    methods=["GET"]
)
def get_invoice_grns():

    conn = None
    cursor = None

    try:
        conn = get_db_connection()

        if conn is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed.",
                "grns": []
            }), 500

        cursor = conn.cursor(dictionary=True)

        # ==========================================
        # LOAD ONLY APPROVED GRNs
        # ==========================================

        cursor.execute("""
            SELECT
                g.grn_id,
                g.grn_no,
                g.po_id,
                g.supplier_id,
                g.received_date,
                a.final_status AS grn_status,

                po.po_number,

                COALESCE(
                    s.supplier_name,
                    po.supplier_name,
                    ''
                ) AS supplier_name

            FROM grn g

            INNER JOIN approvals a
                ON a.document_id = g.grn_id
                AND UPPER(TRIM(a.module_name)) = 'GRN'

            LEFT JOIN purchase_orders po
                ON po.purchase_order_id = g.po_id

            LEFT JOIN suppliers s
                ON s.supplier_id = g.supplier_id

            WHERE
                UPPER(TRIM(a.final_status)) = 'APPROVED'
                AND UPPER(TRIM(g.inspection_status)) = 'ACCEPTED'

            ORDER BY
                g.grn_id DESC
        """)

        grns = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(grns),
            "grns": grns
        }), 200

    except Exception as e:

        import traceback
        traceback.print_exc()

        print("INVOICE GRN LIST ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": "Unable to load approved GRNs.",
            "grns": []
        }), 500

    finally:

        if cursor:
            try:
                cursor.close()
            except Exception:
                pass

        if conn:
            try:
                conn.close()
            except Exception:
                pass

# ============================================================
# 6. LOAD COMPLETE GRN DETAILS FOR INVOICE
# ============================================================

@finance_dashboard_bp.route(
    "/api/invoices/grn/<int:grn_id>",
    methods=["GET"]
)
def get_grn_items(grn_id):

    conn = None
    cursor = None

    try:

        # ====================================================
        # DATABASE CONNECTION
        # ====================================================

        conn = get_db_connection()

        if conn is None:

            return jsonify({

                "success": False,

                "message":
                    "Database connection failed."

            }), 500

        cursor = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # 1. GET GRN HEADER
        #
        # GRN
        #   ↓
        # PO
        #   ↓
        # SUPPLIER
        # ====================================================

        cursor.execute("""
            SELECT

                g.grn_id,

                g.grn_no,

                g.po_id,

                g.supplier_id,

                g.received_by,

                g.received_date,

                g.status AS grn_status,

                g.remarks AS grn_remarks,

                po.purchase_order_id,

                po.po_number,

                po.order_date,

                po.total_amount AS po_total_amount,

                COALESCE(
                    s.supplier_name,
                    po.supplier_name,
                    ''
                ) AS supplier_name

            FROM grn g

            LEFT JOIN purchase_orders po
                ON po.purchase_order_id =
                   g.po_id

            LEFT JOIN suppliers s
                ON s.supplier_id =
                   g.supplier_id

            WHERE
                g.grn_id = %s

            LIMIT 1

        """, (grn_id,))


        grn = cursor.fetchone()


        # ====================================================
        # 2. GRN NOT FOUND
        # ====================================================

        if not grn:

            return jsonify({

                "success": False,

                "message":
                    "GRN not found."

            }), 404


        # ====================================================
        # 3. GET GRN ITEMS
        # ====================================================

        cursor.execute("""
            SELECT

                gi.grn_item_id,

                gi.grn_id,

                gi.material_name,

                gi.description,

                gi.quantity_ordered,

                gi.quantity_received,

                gi.quantity_rejected,

                gi.remarks

            FROM grn_items gi

            WHERE
                gi.grn_id = %s

            ORDER BY
                gi.grn_item_id ASC

        """, (grn_id,))


        grn_items = cursor.fetchall()


        # ====================================================
        # 4. GET PO ITEM PRICES
        #
        # Load them once instead of querying the PO table
        # repeatedly inside the GRN item loop.
        # ====================================================

        po_prices = []

        if grn.get("po_id"):

            try:

                cursor.execute("""
                    SELECT

                        po_item_id AS purchase_order_item_id,

                        purchase_order_id,

                        item_name AS material_name,

                        description,

                        quantity,

                        unit_price

                    FROM purchase_order_items

                    WHERE
                        purchase_order_id = %s

                    ORDER BY
                        po_item_id ASC

                """, (
                    grn["po_id"],
                ))

                po_prices = cursor.fetchall()

            except Exception as price_error:

                print(
                    "PO ITEM PRICE LOOKUP ERROR:",
                    price_error
                )

                po_prices = []


        # ====================================================
        # 5. BUILD INVOICE ITEMS
        # ====================================================

        invoice_items = []


        for index, item in enumerate(grn_items):

            material_name = (
                item.get("material_name")
                or ""
            )


            description = (
                item.get("description")
                or ""
            )


            # =================================================
            # RECEIVED QUANTITY
            # =================================================

            if item.get(
                "quantity_received"
            ) is not None:

                quantity = float(
                    item[
                        "quantity_received"
                    ]
                )

            elif item.get(
                "quantity_ordered"
            ) is not None:

                quantity = float(
                    item[
                        "quantity_ordered"
                    ]
                )

            else:

                quantity = 0


            # =================================================
            # DEFAULT PRICE
            # =================================================

            unit_price = 0


            # =================================================
            # MATCH PO ITEM
            #
            # First try material name + description.
            # If there is only one PO item, use that price.
            # =================================================

            matching_po_item = None


            for po_item in po_prices:

                po_material = (
                    po_item.get(
                        "material_name"
                    ) or ""
                )

                po_description = (
                    po_item.get(
                        "description"
                    ) or ""
                )


                if (
                    po_material.strip().lower()
                    == material_name.strip().lower()
                    and
                    po_description.strip().lower()
                    == description.strip().lower()
                ):

                    matching_po_item = po_item

                    break


            # =================================================
            # IF ONLY ONE PO ITEM EXISTS
            # =================================================

            if (
                matching_po_item is None
                and len(po_prices) == 1
            ):

                matching_po_item = (
                    po_prices[0]
                )


            # =================================================
            # GET UNIT PRICE
            # =================================================

            if matching_po_item:

                unit_price = float(
                    matching_po_item.get(
                        "unit_price"
                    ) or 0
                )


            # =================================================
            # CALCULATE AMOUNT
            # =================================================

            amount = (
                quantity *
                unit_price
            )


            # =================================================
            # ADD INVOICE ITEM
            # =================================================

            invoice_items.append({

                "item_id":
                    item.get(
                        "grn_item_id"
                    ),

                "grn_item_id":
                    item.get(
                        "grn_item_id"
                    ),

                "item_name":
                    material_name,

                "material_name":
                    material_name,

                "description":
                    description,

                "quantity_ordered":
                    float(
                        item.get(
                            "quantity_ordered"
                        ) or 0
                    ),

                "quantity_received":
                    float(
                        item.get(
                            "quantity_received"
                        ) or 0
                    ),

                "quantity_rejected":
                    float(
                        item.get(
                            "quantity_rejected"
                        ) or 0
                    ),

                "quantity":
                    quantity,

                "unit_price":
                    unit_price,

                "amount":
                    amount,

                "remarks":
                    item.get(
                        "remarks"
                    ) or ""

            })


        # ====================================================
        # 6. RESPONSE
        # ====================================================

        response = {

            "success": True,

            "grn": {

                "grn_id":
                    grn.get(
                        "grn_id"
                    ),

                "grn_no":
                    grn.get(
                        "grn_no"
                    ) or "",

                "po_id":
                    grn.get(
                        "po_id"
                    ),

                "po_number":
                    grn.get(
                        "po_number"
                    ) or "",

                "supplier_id":
                    grn.get(
                        "supplier_id"
                    ),

                "supplier_name":
                    grn.get(
                        "supplier_name"
                    ) or "",

                "received_by":
                    grn.get(
                        "received_by"
                    ),

                "received_date":
                    grn.get(
                        "received_date"
                    ),

                "status":
                    grn.get(
                        "grn_status"
                    ) or "",

                "remarks":
                    grn.get(
                        "grn_remarks"
                    ) or "",

                "po_total_amount":
                    float(
                        grn.get(
                            "po_total_amount"
                        ) or 0
                    )

            },

            "items":
                invoice_items

        }


        # ====================================================
        # 7. DEBUG
        # ====================================================

        print(
            "\n=========================================="
        )

        print(
            "INVOICE GRN DETAILS"
        )

        print(
            "=========================================="
        )

        print(
            "GRN ID:",
            grn.get("grn_id")
        )

        print(
            "GRN NO:",
            grn.get("grn_no")
        )

        print(
            "PO ID:",
            grn.get("po_id")
        )

        print(
            "PO NUMBER:",
            grn.get("po_number")
        )

        print(
            "SUPPLIER ID:",
            grn.get("supplier_id")
        )

        print(
            "SUPPLIER:",
            grn.get("supplier_name")
        )

        print(
            "STATUS:",
            grn.get("grn_status")
        )

        print(
            "ITEM COUNT:",
            len(invoice_items)
        )

        print(
            "ITEMS:",
            invoice_items
        )

        print(
            "==========================================\n"
        )


        return jsonify(
            response
        )


    except Exception as e:

        import traceback

        traceback.print_exc()

        print(
            "INVOICE GRN DETAILS ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Failed to load GRN details.",

            "error":
                str(e),

            "items": []

        }), 500


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



@finance_dashboard_bp.route(
    "/save_invoice",
    methods=["POST"]
)
def save_invoice():

    conn = None
    cursor = None

    try:

        # =====================================================
        # GET FORM DATA
        # =====================================================

        grn_id = (
            request.form.get("grn_id")
        )


        invoice_no = (
            request.form.get("invoice_no")
            or request.form.get("invoice_number")
        )


        invoice_date = (
            request.form.get("invoice_date")
        )


        # =====================================================
        # CREATED BY
        #
        # First try the hidden form field.
        # Then try the logged-in session.
        # =====================================================

        created_by = (
            request.form.get("invoiceCreatedBy")
            or request.form.get("created_by")
        )


        if not created_by:

            created_by = (
                session.get("user_id")
                or session.get("userId")
                or session.get("id")
            )


        # =====================================================
        # DEBUG
        # =====================================================

        print(
            "========================================"
        )

        print(
            "SAVE INVOICE REQUEST"
        )

        print(
            "GRN:",
            grn_id
        )

        print(
            "Invoice Number:",
            invoice_no
        )

        print(
            "Invoice Date:",
            invoice_date
        )

        print(
            "Created By:",
            created_by
        )

        print(
            "========================================"
        )


        # =====================================================
        # GET ITEMS
        # =====================================================

        item_names = request.form.getlist(
            "item_name[]"
        )


        descriptions = request.form.getlist(
            "description[]"
        )


        quantities = request.form.getlist(
            "quantity[]"
        )


        unit_prices = request.form.getlist(
            "unit_price[]"
        )


        # =====================================================
        # VALIDATION
        # =====================================================

        if not grn_id:

            return jsonify({

                "success": False,

                "message":
                    "GRN is required."

            }), 400


        if not invoice_date:

            return jsonify({

                "success": False,

                "message":
                    "Invoice date is required."

            }), 400


        if not created_by:

            return jsonify({

                "success": False,

                "message":
                    "Created by user is required."

            }), 400


        # =====================================================
        # CONVERT CREATED BY TO INTEGER
        # =====================================================

        try:

            created_by = int(
                created_by
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid created by user ID."

            }), 400


        # =====================================================
        # DATABASE CONNECTION
        # =====================================================

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # =====================================================
        # VERIFY GRN
        #
        # We need the PO linked to the GRN.
        # =====================================================

        cursor.execute("""
            SELECT
                g.grn_id,
                g.grn_no,
                g.po_id
            FROM grn g
            WHERE g.grn_id = %s
            LIMIT 1
        """, (
            grn_id,
        ))


        grn = cursor.fetchone()


        if not grn:

            return jsonify({

                "success": False,

                "message":
                    "Selected GRN was not found."

            }), 404


        # =====================================================
        # PURCHASE ORDER
        # =====================================================

        purchase_order_id = (
            grn.get("po_id")
        )


        if not purchase_order_id:

            return jsonify({

                "success": False,

                "message":
                    "Selected GRN is not linked to a purchase order."

            }), 400


        # =====================================================
        # GET SUPPLIER NAME
        #
        # We first try the supplier_name column in
        # purchase_orders.
        # =====================================================

        supplier_name = ""


        try:

            cursor.execute("""
                SELECT
                    supplier_name
                FROM purchase_orders
                WHERE purchase_order_id = %s
                LIMIT 1
            """, (
                purchase_order_id,
            ))


            po = cursor.fetchone()


            if po:

                supplier_name = (
                    po.get("supplier_name")
                    or ""
                )

        except Exception:

            # If purchase_orders does not have
            # supplier_name, we continue below.

            supplier_name = ""


        # =====================================================
        # FALLBACK SUPPLIER
        #
        # If your purchase_orders table uses supplier_id,
        # get supplier name from suppliers.
        # =====================================================

        if not supplier_name:

            try:

                cursor.execute("""
                    SELECT
                        po.supplier_id
                    FROM purchase_orders po
                    WHERE po.purchase_order_id = %s
                    LIMIT 1
                """, (
                    purchase_order_id,
                ))


                po_supplier = (
                    cursor.fetchone()
                )


                if po_supplier:

                    supplier_id = (
                        po_supplier.get(
                            "supplier_id"
                        )
                    )


                    if supplier_id:

                        cursor.execute("""
                            SELECT
                                supplier_name
                            FROM suppliers
                            WHERE supplier_id = %s
                            LIMIT 1
                        """, (
                            supplier_id,
                        ))


                        supplier = (
                            cursor.fetchone()
                        )


                        if supplier:

                            supplier_name = (
                                supplier.get(
                                    "supplier_name"
                                )
                                or ""
                            )

            except Exception:

                pass


        # =====================================================
        # FINAL SUPPLIER FALLBACK
        # =====================================================

        if not supplier_name:

            supplier_name = "Unknown Supplier"


        # =====================================================
        # GENERATE INVOICE NUMBER
        #
        # FORMAT:
        #
        # INV-2026-0001
        #
        # =====================================================

        year = datetime.now().year


        prefix = (
            f"INV-{year}-"
        )


        cursor.execute("""
            SELECT
                invoice_number
            FROM invoices
            WHERE invoice_number LIKE %s
            ORDER BY invoice_id DESC
            LIMIT 1
        """, (
            f"{prefix}%",
        ))


        last_invoice = (
            cursor.fetchone()
        )


        last_number = 0


        if last_invoice:

            last_invoice_number = (
                last_invoice.get(
                    "invoice_number"
                )
            )


            if last_invoice_number:

                try:

                    parts = (
                        str(
                            last_invoice_number
                        )
                        .split("-")
                    )


                    if len(parts) == 3:

                        last_number = int(
                            parts[2]
                        )

                except (
                    ValueError,
                    TypeError,
                    IndexError
                ):

                    last_number = 0


        # =====================================================
        # NEXT NUMBER
        # =====================================================

        next_number = (
            last_number + 1
        )


        generated_invoice_no = (
            f"INV-{year}-{next_number:04d}"
        )


        print(
            "GENERATED INVOICE:",
            generated_invoice_no
        )


        # =====================================================
        # VALIDATE ITEMS
        # =====================================================

        item_count = max(
            len(item_names),
            len(descriptions),
            len(quantities),
            len(unit_prices)
        )


        if item_count == 0:

            return jsonify({

                "success": False,

                "message":
                    "Invoice must contain at least one item."

            }), 400


        validated_items = []

        invoice_total = Decimal(
            "0.00"
        )


        # =====================================================
        # PROCESS ITEMS
        # =====================================================

        for i in range(
            item_count
        ):

            # -------------------------------------------------
            # DESCRIPTION
            # -------------------------------------------------

            description = ""


            if i < len(
                descriptions
            ):

                description = (
                    descriptions[i]
                    or ""
                ).strip()


            # Use item name if description
            # is empty.

            if (
                not description
                and i < len(item_names)
            ):

                description = (
                    item_names[i]
                    or ""
                ).strip()


            if not description:

                description = (
                    f"Invoice Item {i + 1}"
                )


            # -------------------------------------------------
            # QUANTITY
            # -------------------------------------------------

            quantity_value = (
                quantities[i]
                if i < len(quantities)
                else "0"
            )


            # -------------------------------------------------
            # UNIT PRICE
            # -------------------------------------------------

            unit_price_value = (
                unit_prices[i]
                if i < len(unit_prices)
                else "0"
            )


            # -------------------------------------------------
            # DECIMAL CONVERSION
            # -------------------------------------------------

            try:

                quantity = Decimal(
                    str(quantity_value)
                )


                unit_price = Decimal(
                    str(unit_price_value)
                )

            except (
                InvalidOperation,
                ValueError,
                TypeError
            ):

                return jsonify({

                    "success": False,

                    "message":
                        f"Invalid quantity or unit price for item {i + 1}."

                }), 400


            # -------------------------------------------------
            # QUANTITY VALIDATION
            # -------------------------------------------------

            if quantity <= 0:

                return jsonify({

                    "success": False,

                    "message":
                        f"Quantity must be greater than zero for item {i + 1}."

                }), 400


            # -------------------------------------------------
            # PRICE VALIDATION
            # -------------------------------------------------

            if unit_price < 0:

                return jsonify({

                    "success": False,

                    "message":
                        f"Unit price cannot be negative for item {i + 1}."

                }), 400


            # -------------------------------------------------
            # CALCULATE TOTAL
            # -------------------------------------------------

            total_price = (
                quantity * unit_price
            )


            invoice_total += (
                total_price
            )


            # -------------------------------------------------
            # STORE ITEM
            # -------------------------------------------------

            validated_items.append({

                "description":
                    description,

                "quantity":
                    quantity,

                "unit_price":
                    unit_price,

                "total_price":
                    total_price

            })


        # =====================================================
        # TOTAL VALIDATION
        # =====================================================

        if invoice_total <= Decimal(
            "0.00"
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invoice total must be greater than zero."

            }), 400


        # =====================================================
        # CONVERT DATE
        # =====================================================

        try:

            parsed_date = datetime.strptime(
                invoice_date,
                "%Y-%m-%d"
            )


            invoice_datetime = (
                parsed_date.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )

        except ValueError:

            return jsonify({

                "success": False,

                "message":
                    "Invalid invoice date. Expected YYYY-MM-DD."

            }), 400


        # =====================================================
        # INSERT INVOICE
        #
        # ACTUAL DATABASE COLUMNS:
        #
        # purchase_order_id
        # invoice_number
        # supplier_name
        # invoice_date
        # total_amount
        # status
        # created_by
        # =====================================================

        cursor.execute("""
            INSERT INTO invoices (
                purchase_order_id,
                invoice_number,
                supplier_name,
                invoice_date,
                total_amount,
                status,
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                'Pending',
                %s,
                NOW(),
                NOW()
            )
        """, (
            purchase_order_id,
            generated_invoice_no,
            supplier_name,
            invoice_datetime,
            invoice_total,
            created_by
        ))


        invoice_id = (
            cursor.lastrowid
        )


        # =====================================================
        # INSERT INVOICE ITEMS
        #
        # ACTUAL invoice_items COLUMNS:
        #
        # invoice_id
        # description
        # quantity
        # unit_price
        # total_price
        # =====================================================

        for item in validated_items:

            cursor.execute("""
                INSERT INTO invoice_items (
                    invoice_id,
                    description,
                    quantity,
                    unit_price,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    NOW(),
                    NOW()
                )
            """, (
                invoice_id,
                item["description"],
                item["quantity"],
                item["unit_price"]
            ))


        # =====================================================
        # COMMIT
        # =====================================================

        conn.commit()


        # =====================================================
        # SUCCESS
        # =====================================================

        print(
            "========================================"
        )

        print(
            "INVOICE CREATED SUCCESSFULLY"
        )

        print(
            "Invoice ID:",
            invoice_id
        )

        print(
            "Invoice Number:",
            generated_invoice_no
        )

        print(
            "Created By:",
            created_by
        )

        print(
            "Total:",
            invoice_total
        )

        print(
            "========================================"
        )


        return jsonify({

            "success": True,

            "message":
                "Invoice created successfully.",

            "invoice_id":
                invoice_id,

            "invoice_no":
                generated_invoice_no,

            "invoice_number":
                generated_invoice_no,

            "purchase_order_id":
                purchase_order_id,

            "supplier_name":
                supplier_name,

            "total_amount":
                float(invoice_total),

            "created_by":
                created_by

        }), 200


    # =========================================================
    # ERROR HANDLER
    # =========================================================

    except Exception as e:

        if conn:

            conn.rollback()


        print(
            "========================================"
        )

        print(
            "SAVE INVOICE ERROR:",
            str(e)
        )

        print(
            "========================================"
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    # =========================================================
    # CLOSE DATABASE
    # =========================================================

    finally:

        if cursor:

            cursor.close()


        if conn:

            conn.close()








# ============================================================
# GET INVOICE FOR PAYMENT
# ============================================================
@finance_dashboard_bp.route(
    "/api/invoice/<int:invoice_id>",
    methods=["GET"]
)
def get_invoice(invoice_id):

    conn = None
    cursor = None

    try:
        conn = get_db_connection()

        if conn is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed."
            }), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.supplier_name,
                i.total_amount,

                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS invoice_status,

                po.purchase_order_id,
                po.po_number,

                r.requisition_id,
                r.prs_no,

                COALESCE(
                    (
                        SELECT SUM(p.amount_paid)
                        FROM payments p
                        WHERE p.invoice_id = i.invoice_id
                          AND UPPER(TRIM(p.payment_status)) = 'COMPLETED'
                    ),
                    0
                ) AS previous_paid

            FROM invoices i

            LEFT JOIN approvals a
                ON a.document_id = i.invoice_id
                AND UPPER(TRIM(a.module_name)) = 'INVOICE'

            LEFT JOIN purchase_orders po
                ON i.purchase_order_id = po.purchase_order_id

            LEFT JOIN requisitions r
                ON po.requisition_id = r.requisition_id

            WHERE i.invoice_id = %s

            LIMIT 1
        """, (invoice_id,))

        invoice = cursor.fetchone()

        # Invoice not found
        if not invoice:
            return jsonify({
                "success": False,
                "message": "Invoice not found."
            }), 404

        # Calculate invoice balance
        invoice_total = float(invoice["total_amount"] or 0)
        previous_paid = float(invoice["previous_paid"] or 0)

        balance = max(invoice_total - previous_paid, 0)

        return jsonify({
            "success": True,

            "invoice_id": invoice["invoice_id"],
            "invoice_number": invoice["invoice_number"],

            "invoice_status": invoice["invoice_status"],

            "supplier_name": invoice["supplier_name"] or "",

            "total_amount": f"{invoice_total:.2f}",
            "previous_paid": f"{previous_paid:.2f}",
            "balance": f"{balance:.2f}",

            "purchase_order_id": invoice["purchase_order_id"],
            "po_number": invoice["po_number"] or "",

            "requisition_id": invoice["requisition_id"],
            "prs_no": invoice["prs_no"] or ""
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()

        print("GET INVOICE ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": "Failed to load invoice.",
            "error": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()



# ============================================================
# GET APPROVED INVOICES FOR PAYMENT
# ============================================================
@finance_dashboard_bp.route(
    "/api/approved-invoices",
    methods=["GET"]
)
def get_approved_invoices():

    conn = None
    cursor = None

    try:
        conn = get_db_connection()

        if conn is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed.",
                "invoices": []
            }), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.supplier_name,
                i.total_amount,

                a.final_status AS invoice_status,

                COALESCE(
                    (
                        SELECT SUM(p.amount_paid)
                        FROM payments p
                        WHERE p.invoice_id = i.invoice_id
                          AND UPPER(TRIM(p.payment_status)) = 'COMPLETED'
                    ),
                    0
                ) AS previous_paid

            FROM invoices i

            INNER JOIN approvals a
                ON a.document_id = i.invoice_id
                AND UPPER(TRIM(a.module_name)) = 'INVOICE'

            WHERE UPPER(TRIM(a.final_status)) = 'APPROVED'

            ORDER BY i.invoice_id DESC
        """)

        rows = cursor.fetchall()
        invoices = []

        for row in rows:
            total = float(row["total_amount"] or 0)
            paid = float(row["previous_paid"] or 0)
            balance = max(total - paid, 0)

            # Only invoices with an outstanding balance
            # are available for payment.
            if balance > 0:
                invoices.append({
                    "invoice_id": row["invoice_id"],
                    "invoice_number": row["invoice_number"],
                    "supplier_name": row["supplier_name"] or "",
                    "total_amount": f"{total:.2f}",
                    "previous_paid": f"{paid:.2f}",
                    "balance": f"{balance:.2f}",
                    "invoice_status": row["invoice_status"]
                })

        return jsonify({
            "success": True,
            "count": len(invoices),
            "invoices": invoices
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Failed to load approved invoices.",
            "error": str(e),
            "invoices": []
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()

            
# ============================================================
# GENERATE PAYMENT NUMBER
# ============================================================



def generate_payment_no(cursor):

    year = datetime.now().year

    cursor.execute("""
        SELECT payment_no
        FROM payments
        WHERE payment_no LIKE %s
        ORDER BY payment_id DESC
        LIMIT 1
    """, (f"PAY/{year}/%",))

    last = cursor.fetchone()


    # FIRST PAYMENT OF THE YEAR
    if not last:

        return f"PAY/{year}/0001"


    # GET LAST NUMBER
    last_no = last["payment_no"]

    try:

        last_num = int(
            last_no.split("/")[-1]
        )

    except (ValueError, IndexError):

        last_num = 0


    return (
        f"PAY/{year}/"
        f"{str(last_num + 1).zfill(4)}"
    )


# ============================================================
# CREATE PAYMENT
# ============================================================

@finance_dashboard_bp.route(
    "/create_payment",
    methods=["POST"]
)
def create_payment():

    data = request.get_json(silent=True) or {}

    user_id = session.get("user_id")


    # ========================================================
    # AUTHENTICATION
    # ========================================================

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401


    # ========================================================
    # REQUIRED DATA
    # ========================================================

    invoice_id = data.get("invoice_id")
    payment_method = data.get("payment_method")
    amount_paid_raw = data.get("amount_paid")
    payment_date = data.get("payment_date")
    remarks = data.get("remarks", "")


    if not invoice_id:

        return jsonify({
            "success": False,
            "message": "Invoice is required."
        }), 400


    if not payment_method:

        return jsonify({
            "success": False,
            "message": "Payment method is required."
        }), 400


    if amount_paid_raw in (
        None,
        "",
        "null"
    ):

        return jsonify({
            "success": False,
            "message": "Amount paid is required."
        }), 400


    # ========================================================
    # CONVERT AMOUNT
    # ========================================================

    try:

        amount_paid = float(
            amount_paid_raw
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid payment amount."
        }), 400


    # ========================================================
    # PAYMENT MUST BE GREATER THAN ZERO
    # ========================================================

    if amount_paid <= 0:

        return jsonify({
            "success": False,
            "message":
                "Amount paid must be greater than zero."
        }), 400


    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # GET INVOICE AND CURRENT PAYMENTS
        # ====================================================

        cursor.execute("""
            SELECT
                i.invoice_id,
                i.total_amount,

                po.requisition_id,

                COALESCE(
                    SUM(p.amount_paid),
                    0
                ) AS previous_paid

            FROM invoices i

            LEFT JOIN purchase_orders po
                ON i.purchase_order_id =
                   po.purchase_order_id

            LEFT JOIN payments p
                ON i.invoice_id =
                   p.invoice_id

            WHERE i.invoice_id = %s

            GROUP BY
                i.invoice_id,
                i.total_amount,
                po.requisition_id

        """, (invoice_id,))


        invoice = cursor.fetchone()


        # ====================================================
        # INVOICE DOES NOT EXIST
        # ====================================================

        if not invoice:

            return jsonify({
                "success": False,
                "message": "Invoice not found."
            }), 404


        # ====================================================
        # CALCULATE REAL BALANCE FROM DATABASE
        # ====================================================

        invoice_total = float(
            invoice["total_amount"] or 0
        )

        previous_paid = float(
            invoice["previous_paid"] or 0
        )

        current_balance = (
            invoice_total -
            previous_paid
        )


        # NEVER ALLOW NEGATIVE BALANCE
        if current_balance < 0:
            current_balance = 0


        # ====================================================
        # CHECK IF ALREADY FULLY PAID
        # ====================================================

        if current_balance <= 0:

            conn.rollback()

            return jsonify({
                "success": False,
                "message":
                    "Invoice already paid. "
                    "No outstanding balance remains."
            }), 400


        # ====================================================
        # PREVENT OVERPAYMENT
        # ====================================================

        if amount_paid > current_balance:

            conn.rollback()

            return jsonify({

                "success": False,

                "message":
                    "Payment amount cannot exceed "
                    "the invoice balance.",

                "invoice_total":
                    f"{invoice_total:.2f}",

                "previous_paid":
                    f"{previous_paid:.2f}",

                "current_balance":
                    f"{current_balance:.2f}",

                "amount_entered":
                    f"{amount_paid:.2f}"

            }), 400


        # ====================================================
        # CALCULATE NEW BALANCE
        # ====================================================

        new_balance = (
            current_balance -
            amount_paid
        )


        # NEVER ALLOW NEGATIVE BALANCE
        if new_balance < 0:
            new_balance = 0


        # ====================================================
        # GET REQUISITION ID
        # ====================================================

        requisition_id = (
            invoice["requisition_id"]
        )


        # ====================================================
        # GENERATE PAYMENT NUMBER
        # ====================================================

        payment_no = generate_payment_no(
            cursor
        )


        # ====================================================
        # INSERT PAYMENT
        # ====================================================

        cursor.execute("""
            INSERT INTO payments (
                requisition_id,
                invoice_id,
                payment_no,
                paid_by,
                payment_method,
                amount,
                amount_paid,
                balance,
                payment_date,
                remarks
            )

            VALUES (
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

        """, (

            requisition_id,

            invoice_id,

            payment_no,

            user_id,

            payment_method,

            invoice_total,

            amount_paid,

            new_balance,

            payment_date or datetime.now(),

            remarks
        ))


        # ====================================================
        # COMMIT
        # ====================================================

        conn.commit()


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Payment created successfully.",

            "payment_no":
                payment_no,

            "invoice_total":
                f"{invoice_total:.2f}",

            "amount_paid":
                f"{amount_paid:.2f}",

            "previous_paid":
                f"{previous_paid:.2f}",

            "balance":
                f"{new_balance:.2f}"

        }), 201


    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "CREATE PAYMENT ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to create payment.",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()
# ============================================================
# GET NEXT PAYMENT NUMBER
# Format: PAY-YYYY-NNNN
# Example: PAY-2026-0001
# ============================================================
@finance_dashboard_bp.route("/next_payment_no", methods=["GET"])
def next_payment_no():

    conn = None
    cursor = None

    try:
        from datetime import datetime

        conn = get_db_connection()

        if conn is None:
            return jsonify({
                "success": False,
                "message": "Unable to connect to the database."
            }), 500

        cursor = conn.cursor(dictionary=True)

        current_year = datetime.now().year

        # ----------------------------------------------------
        # Get the latest payment number for the CURRENT YEAR
        # ----------------------------------------------------
        cursor.execute("""
            SELECT payment_no
            FROM payments
            WHERE payment_no LIKE %s
            ORDER BY payment_id DESC
            LIMIT 1
        """, (f"PAY/{current_year}/%",))

        last = cursor.fetchone()

        # ----------------------------------------------------
        # First payment of the year
        # ----------------------------------------------------
        if not last or not last.get("payment_no"):

            next_number = 1

        else:

            last_no = last["payment_no"]

            try:
                # PAY/2026/0001
                last_num = int(last_no.split("/")[-1])

                next_number = last_num + 1

            except (ValueError, TypeError, IndexError):

                next_number = 1

        # ----------------------------------------------------
        # Generate payment number
        # ----------------------------------------------------
        new_no = f"PAY/{current_year}/{next_number:04d}"

        return jsonify({
            "success": True,
            "payment_no": new_no
        }), 200

    except Exception as e:

        # Print the REAL error in Flask terminal
        print("=" * 70)
        print("NEXT PAYMENT NUMBER ERROR")
        print("=" * 70)
        print(str(e))
        import traceback
        traceback.print_exc()
        print("=" * 70)

        return jsonify({
            "success": False,
            "message": "Failed to generate next payment number.",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            try:
                cursor.close()
            except Exception:
                pass

        if conn:
            try:
                conn.close()
            except Exception:
                pass


@finance_dashboard_bp.route("/api/finance_requisition")
def finance_requisition():

    conn = None
    cursor = None

    try:

        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 

                r.requisition_id,

                r.prs_no,

                d.department_name,

                r.submission_date,

                -- FINAL STATUS FROM APPROVALS TABLE
                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS final_status,

                -- NUMBER OF DAYS SINCE SUBMISSION
                DATEDIFF(
                    CURRENT_DATE,
                    DATE(r.submission_date)
                ) AS due

            FROM requisitions r

            INNER JOIN departments d
                ON r.department_id =
                   d.department_id

            LEFT JOIN approvals a
                ON a.module_name = 'PRS'
                AND a.document_id =
                    r.requisition_id

            ORDER BY
                r.requisition_id DESC

        """)

        data = cursor.fetchall()

        return jsonify(data)

    except Exception as e:

        print(
            "Procurement Requisition API Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to load procurement requisitions.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()




@finance_dashboard_bp.route("/api/finance_requisitiondetails/<int:req_id>")
def finance_requisition_details(req_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =====================================
        # REQUISITION HEADER
        # =====================================
        cursor.execute("""
            SELECT

                r.requisition_id,
                r.prs_no,
                r.submission_date,

                d.department_name,

                u.username AS requester_name,
                u.email AS requester_email,
                u.signature AS requester_signature,

                COALESCE(a.hod_status,'PENDING') AS hod_status,
                COALESCE(a.ceo_status,'PENDING') AS ceo_status,
                COALESCE(a.final_status,'PENDING') AS status,

                a.hod_approved_at,
                a.ceo_approved_at,

                hod.username AS hod_name,
                hod.signature AS hod_signature,

                ceo.username AS ceo_name,
                ceo.signature AS ceo_signature

            FROM requisitions r

            LEFT JOIN departments d
                ON d.department_id = r.department_id

            LEFT JOIN users u
                ON u.user_id = r.user_id

            LEFT JOIN approvals a
                ON a.module_name = 'PRS'
               AND a.document_id = r.requisition_id

            LEFT JOIN users hod
                ON hod.user_id = a.hod_user_id

            LEFT JOIN users ceo
                ON ceo.user_id = a.ceo_user_id

            WHERE r.requisition_id = %s

        """, (req_id,))

        requisition = cursor.fetchone()

        if not requisition:
            return jsonify({
                "success": False,
                "message": "Requisition not found"
            }), 404

        # =====================================
        # ITEMS
        # =====================================
        cursor.execute("""
            SELECT
                material_name,
                description,
                uom,
                qty_stock,
                qty_required,
                required_date,
                remark
            FROM requisition_items
            WHERE requisition_id = %s
        """, (req_id,))

        items = cursor.fetchall()

        return jsonify({
            "success": True,
            "requisition": requisition,
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





# FINANCE PAYMENT MODULE
@finance_dashboard_bp.route("/payments/api")
def get_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                p.payment_id,
                p.payment_no,
                s.supplier_name,
                i.invoice_number AS invoice_no,
                p.amount_paid,
                p.payment_status AS status,
                p.payment_date

            FROM payments p

            JOIN invoices i 
                ON p.invoice_id = i.invoice_id

            JOIN purchase_orders po 
                ON i.purchase_order_id = po.purchase_order_id

            JOIN suppliers s 
                ON po.supplier_id = s.supplier_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PAYMENT'
                AND a.document_id = p.payment_id

            ORDER BY p.payment_id DESC
        """

        cursor.execute(query)
        payments = cursor.fetchall()

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


@finance_dashboard_bp.route("/mark_payment_paid", methods=["POST"])
def mark_payment_paid():
    if session.get("user_role") != "finance":
        return jsonify({"success": False, "message": "Finance role required."}), 403

    data = request.get_json(silent=True) or {}
    payment_id = data.get("payment_id")
    try:
        payment_id = int(payment_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Select a valid payment."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                pay.payment_id,
                pay.payment_status,
                COALESCE(pay.requisition_id, po.requisition_id) AS requisition_id
            FROM payments pay
            JOIN invoices i ON i.invoice_id = pay.invoice_id
            JOIN purchase_orders po ON po.purchase_order_id = i.purchase_order_id
            WHERE pay.payment_id = %s
            FOR UPDATE
        """, (payment_id,))
        payment = cursor.fetchone()
        if not payment:
            return jsonify({"success": False, "message": "Payment not found."}), 404

        requisition_id = payment.get("requisition_id")
        if not requisition_id:
            conn.rollback()
            return jsonify({
                "success": False,
                "message": "This payment is not linked to a requisition."
            }), 409

        cursor.execute("""
            SELECT requisition_id
            FROM requisitions
            WHERE requisition_id = %s
            FOR UPDATE
        """, (requisition_id,))
        if not cursor.fetchone():
            conn.rollback()
            return jsonify({
                "success": False,
                "message": "The requisition linked to this payment was not found."
            }), 409

        cursor.execute("""
            SELECT ceo_status, final_status
            FROM approvals
            WHERE module_name = 'PAYMENT' AND document_id = %s
            FOR UPDATE
        """, (payment_id,))
        approval = cursor.fetchone()
        if not approval or approval.get("ceo_status") != "APPROVED":
            conn.rollback()
            return jsonify({
                "success": False,
                "message": "CEO approval is required before marking this payment as paid."
            }), 409

        if (
            payment["payment_status"] == "Completed"
            and approval.get("final_status") == "COMPLETED"
        ):
            cursor.execute(
                "SELECT status FROM requisitions WHERE requisition_id = %s",
                (requisition_id,)
            )
            requisition = cursor.fetchone()
            if requisition and requisition.get("status") != "Completed":
                cursor.execute("""
                    UPDATE requisitions
                    SET status = 'Completed'
                    WHERE requisition_id = %s
                """, (requisition_id,))
            cursor.execute("""
                UPDATE approvals
                SET final_status = 'COMPLETED'
                WHERE module_name = 'PRS' AND document_id = %s
            """, (requisition_id,))
            conn.commit()
            return jsonify({
                "success": True,
                "message": "Payment is already marked as paid.",
                "payment_id": payment_id,
                "payment_status": "Completed",
                "final_status": "COMPLETED",
                "requisition_id": requisition_id,
                "requisition_status": "Completed",
                "requisition_final_status": "COMPLETED"
            }), 200

        cursor.execute("""
            UPDATE payments
            SET payment_status = 'Completed'
            WHERE payment_id = %s
        """, (payment_id,))
        cursor.execute("""
            UPDATE approvals
            SET final_status = 'COMPLETED'
            WHERE module_name = 'PAYMENT' AND document_id = %s
        """, (payment_id,))
        cursor.execute("""
            UPDATE requisitions
            SET status = 'Completed'
            WHERE requisition_id = %s
        """, (requisition_id,))
        cursor.execute("""
            UPDATE approvals
            SET final_status = 'COMPLETED'
            WHERE module_name = 'PRS' AND document_id = %s
        """, (requisition_id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Payment marked as paid.",
            "payment_id": payment_id,
            "payment_status": "Completed",
            "final_status": "COMPLETED",
            "requisition_id": requisition_id,
            "requisition_status": "Completed",
            "requisition_final_status": "COMPLETED"
        }), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print("MARK PAYMENT PAID ERROR:", e)
        return jsonify({"success": False, "message": "Unable to mark payment as paid."}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@finance_dashboard_bp.route("/payment/<int:payment_id>")
def payment_slip(payment_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            p.payment_id,
            p.payment_no,
            p.amount AS amount,
            p.amount_paid,
            p.balance,
            p.payment_method,
            p.payment_date,
            p.payment_status AS status,
            i.invoice_number AS invoice_no,
            s.supplier_name,
            prepared.username AS prepared_by,
            prepared.signature AS prepared_signature,
            a.hod_status,
            a.hod_approved_at,
            hod.username AS hod_name,
            hod.signature AS hod_signature,
            a.ceo_status,
            a.ceo_approved_at,
            ceo.username AS ceo_name,
            ceo.signature AS ceo_signature
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN purchase_orders po ON i.purchase_order_id = po.purchase_order_id
        JOIN suppliers s ON po.supplier_id = s.supplier_id
        JOIN users prepared ON p.paid_by = prepared.user_id
        LEFT JOIN approvals a
            ON a.module_name = 'PAYMENT'
            AND a.document_id = p.payment_id
        LEFT JOIN users hod ON a.hod_user_id = hod.user_id
        LEFT JOIN users ceo ON a.ceo_user_id = ceo.user_id
        WHERE p.payment_id = %s
    """, (payment_id,))

    payment = cursor.fetchone()

    if not payment:
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": "Payment not found."}), 404

    for field in ("payment_date", "hod_approved_at", "ceo_approved_at"):
        if payment.get(field):
            payment[field] = payment[field].isoformat()

    cursor.execute("""
        SELECT 
            description AS item_name,
            quantity,
            unit_price,
            total_price AS total
        FROM invoice_items
        WHERE invoice_id = (
            SELECT invoice_id FROM payments WHERE payment_id = %s
        )
    """, (payment_id,))

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "data": {
            **payment,
            "items": items
        }
    })





@finance_dashboard_bp.route("/finance_invoice_data")
def finance_invoice_data():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            i.invoice_id,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.supplier_name,

            i.invoice_date AS submission_date,

            r.prs_no,
            d.department_name AS department,

            COALESCE(a.final_status, 'PENDING') AS status,

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

        JOIN purchase_orders p
            ON i.purchase_order_id = p.purchase_order_id

        JOIN requisitions r
            ON p.requisition_id = r.requisition_id

        JOIN departments d
            ON r.department_id = d.department_id

        LEFT JOIN approvals a
            ON a.module_name = 'INVOICE'
            AND a.document_id = i.invoice_id

        ORDER BY i.invoice_id DESC
    """)

    rows = cursor.fetchall()

    for row in rows:
        if row.get("invoice_date"):
            row["invoice_date"] = row["invoice_date"].isoformat()

        if row.get("submission_date"):
            row["submission_date"] = row["submission_date"].isoformat()

    cursor.close()
    conn.close()

    return jsonify(rows)


@finance_dashboard_bp.route("/finance_invoice_details/<int:invoice_id>")
def finance_invoice_details(invoice_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # =========================
        # INVOICE HEADER + APPROVAL
        # =========================
        cursor.execute("""
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.total_amount,
                i.supplier_name,

                r.prs_no,
                d.department_name AS department,
                p.po_number,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                COALESCE(a.final_status, 'PENDING') AS final_status,

                a.hod_approved_at,
                a.ceo_approved_at

            FROM invoices i

            JOIN purchase_orders p
                ON i.purchase_order_id = p.purchase_order_id

            JOIN requisitions r
                ON p.requisition_id = r.requisition_id

            JOIN departments d
                ON r.department_id = d.department_id

            LEFT JOIN approvals a
                ON a.approval_id = (
                    SELECT MAX(a2.approval_id)
                    FROM approvals a2
                    WHERE a2.module_name = 'INVOICE'
                    AND a2.document_id = i.invoice_id
                )

            WHERE i.invoice_id = %s
            LIMIT 1
        """, (invoice_id,))

        invoice = cursor.fetchone()

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        # =========================
        # FORMAT DATES SAFELY
        # =========================
        def fmt(d):
            return d.isoformat() if d else None

        invoice["invoice_date"] = fmt(invoice.get("invoice_date"))
        invoice["hod_approved_at"] = fmt(invoice.get("hod_approved_at"))
        invoice["ceo_approved_at"] = fmt(invoice.get("ceo_approved_at"))

        # =========================
        # INVOICE ITEMS
        # =========================
        cursor.execute("""
            SELECT
                description,
                quantity,
                unit_price,
                total_price
            FROM invoice_items
            WHERE invoice_id = %s
        """, (invoice_id,))

        invoice["items"] = cursor.fetchall()

        return jsonify(invoice)

    finally:
        cursor.close()
        conn.close()















