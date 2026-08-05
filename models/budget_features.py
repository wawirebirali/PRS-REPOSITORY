"""
===========================================================
PRMS SYSTEM - AI BUDGET FEATURE EXTRACTION MODULE

File:
    budget_features.py

Purpose:
    Extract clean budget prediction features
    from PRMS database.

AI Features:

    department_id
    company_allocated_amount
    budget_quantity
    budget_unit_cost
    total_requisitions
    total_requested_items
    requested_quantity
    total_purchase_orders
    ordered_quantity
    purchase_order_cost
    average_unit_price
    total_grn_received
    received_quantity
    rejected_quantity
    budget_utilization_percentage
    remaining_budget
    delivery_completion_percentage


===========================================================
"""


from db_connect import get_db_connection



# ==========================================================
# CHECK AVAILABLE HISTORICAL DATA
# ==========================================================

def check_budget_training_data():

    """
    Check if enough PRMS historical data exists.

    AI starts using database after 50 records.
    """


    connection = get_db_connection()

    cursor = connection.cursor()



    query = """

    SELECT COUNT(DISTINCT db.department_budget_id)

    FROM department_budget db

    INNER JOIN requisitions r

    ON db.department_id = r.department_id

    """



    cursor.execute(query)



    total_records = cursor.fetchone()[0]



    cursor.close()

    connection.close()



    return total_records





# ==========================================================
# EXTRACT DEPARTMENT FEATURES
# ==========================================================


def get_department_budget_features(department_id):


    """
    Extract AI input features
    from PRMS database.
    """



    connection = get_db_connection()



    cursor = connection.cursor(
        dictionary=True
    )



    query = """

SELECT


    -- ==========================
    -- COMPANY BUDGET
    -- ==========================

    cb.allocated_amount
    AS company_allocated_amount,



    -- ==========================
    -- DEPARTMENT BUDGET
    -- ==========================

    db.department_id,


    db.quantity
    AS budget_quantity,


    db.unit_cost
    AS budget_unit_cost,



    -- ==========================
    -- REQUISITION FEATURES
    -- ==========================

    COALESCE(rq.total_requisitions,0)
    AS total_requisitions,


    COALESCE(rq.total_requested_items,0)
    AS total_requested_items,


    COALESCE(rq.requested_quantity,0)
    AS requested_quantity,



    -- ==========================
    -- PURCHASE ORDER FEATURES
    -- ==========================

    COALESCE(po.total_purchase_orders,0)
    AS total_purchase_orders,


    COALESCE(po.ordered_quantity,0)
    AS ordered_quantity,


    COALESCE(po.purchase_order_cost,0)
    AS purchase_order_cost,


    COALESCE(po.average_unit_price,0)
    AS average_unit_price,



    -- ==========================
    -- GRN FEATURES
    -- ==========================

    COALESCE(gr.total_grn_received,0)
    AS total_grn_received,


    COALESCE(gr.received_quantity,0)
    AS received_quantity,


    COALESCE(gr.rejected_quantity,0)
    AS rejected_quantity,



    -- ==========================
    -- AI ENGINEERED FEATURES
    -- ==========================


    (
        COALESCE(po.purchase_order_cost,0)

        /

        NULLIF(db.total_budget,0)

    ) * 100

    AS budget_utilization_percentage,



    (
        db.total_budget

        -

        COALESCE(
            po.purchase_order_cost,
            0
        )

    )

    AS remaining_budget,



    (
        COALESCE(
            gr.received_quantity,
            0
        )

        /

        NULLIF(
            po.ordered_quantity,
            0
        )

    ) * 100

    AS delivery_completion_percentage



FROM company_budget cb



INNER JOIN department_budget db

ON cb.company_budget_id =
   db.company_budget_id



-- ==================================
-- REQUISITION SUMMARY
-- ==================================

LEFT JOIN (

    SELECT


        r.department_id,


        COUNT(DISTINCT r.requisition_id)
        AS total_requisitions,


        COUNT(ri.item_id)
        AS total_requested_items,


        SUM(ri.qty_required)
        AS requested_quantity



    FROM requisitions r


    LEFT JOIN requisition_items ri

    ON r.requisition_id =
       ri.requisition_id


    GROUP BY r.department_id


) rq


ON db.department_id =
   rq.department_id





-- ==================================
-- PURCHASE ORDER SUMMARY
-- ==================================

LEFT JOIN (


    SELECT


        r.department_id,


        COUNT(DISTINCT po.purchase_order_id)
        AS total_purchase_orders,


        SUM(poi.quantity)
        AS ordered_quantity,


        SUM(poi.total_price)
        AS purchase_order_cost,


        AVG(poi.unit_price)
        AS average_unit_price



    FROM purchase_orders po


    INNER JOIN requisitions r

    ON po.requisition_id =
       r.requisition_id



    LEFT JOIN purchase_order_items poi

    ON po.purchase_order_id =
       poi.purchase_order_id



    GROUP BY r.department_id



) po



ON db.department_id =
   po.department_id






-- ==================================
-- GRN SUMMARY
-- ==================================

LEFT JOIN (


    SELECT


        r.department_id,


        COUNT(DISTINCT g.grn_id)
        AS total_grn_received,


        SUM(gi.quantity_received)
        AS received_quantity,


        SUM(gi.quantity_rejected)
        AS rejected_quantity



    FROM grn g



    INNER JOIN purchase_orders po

    ON g.po_id =
       po.purchase_order_id



    INNER JOIN requisitions r

    ON po.requisition_id =
       r.requisition_id



    LEFT JOIN grn_items gi

    ON g.grn_id =
       gi.grn_id



    GROUP BY r.department_id



) gr



ON db.department_id =
   gr.department_id





WHERE db.department_id = %s



LIMIT 1


"""



    cursor.execute(

        query,

        (department_id,)

    )



    result = cursor.fetchone()



    cursor.close()

    connection.close()




    if result is None:


        raise Exception(

            "No budget data found "
            "for selected department"

        )




    # Replace NULL values

    for key in result:


        if result[key] is None:

            result[key] = 0



    return result