"""
===========================================================
PRMS SYSTEM - AI BUDGET PREDICTION API

File:
    budget_prediction.py

Purpose:
    Flask API endpoint for AI department budget prediction.

Logic:

    Database records >= 50
        |
        Use PRMS database features


    Database records < 50
        |
        Use AI training dataset


Endpoint:

    GET /api/budget/predict/<department_id>

===========================================================
"""


from flask import Blueprint, jsonify

from db_connect import get_db_connection


from AI.predict_budget import predict_budget


from AI.dataset_loader import get_dataset_features


from models.budget_features import (
    get_department_budget_features,
    check_budget_training_data
)



# ==================================================
# BLUEPRINT
# ==================================================

budget_ai_bp = Blueprint(
    "budget_ai",
    __name__
)



# ==================================================
# AI BUDGET PREDICTION API
# ==================================================

@budget_ai_bp.route(
    "/api/budget/predict/<int:department_id>",
    methods=["GET"]
)
def predict_department_budget(department_id):


    try:


        # ==================================================
        # CHECK AVAILABLE HISTORICAL DATA
        # ==================================================


        total_records = check_budget_training_data()



        # ==================================================
        # OPTION 1:
        # USE REAL PRMS DATABASE
        # ==================================================

        if total_records >= 50:


            budget_data = get_department_budget_features(

                department_id

            )


            prediction_source = "PRMS DATABASE"



        # ==================================================
        # OPTION 2:
        # USE AI DATASET
        # ==================================================

        else:


            budget_data = get_dataset_features(

                department_id

            )


            prediction_source = "AI DATASET"



        # ==================================================
        # AI MODEL PREDICTION
        # ==================================================


        predicted_amount = predict_budget(

            budget_data

        )



        # ==================================================
        # RESPONSE
        # ==================================================


        return jsonify({


            "success": True,


            "message":
            "Budget prediction successful",


            "prediction_source":
            prediction_source,


            "training_records":
            total_records,


            "department_id":
            department_id,


            "predicted_budget":
            predicted_amount,


            "currency":
            "UGX"


        })



    except Exception as e:



        return jsonify({


            "success": False,


            "message":
            "Budget prediction failed",


            "error":
            str(e)


        }), 500


    




@budget_ai_bp.route(
    "/ceo/api/departments",
    methods=["GET"]
)
def get_departments():

    try:

        conn = get_db_connection()

        cursor = conn.cursor(dictionary=True)


        cursor.execute("""
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        """)


        departments = cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify({

            "success": True,

            "data": departments

        })


    except Exception as e:

        print(
            "Department API Error:",
            e
        )


        return jsonify({

            "success": False,

            "message": str(e),

            "data": []

        }), 500
