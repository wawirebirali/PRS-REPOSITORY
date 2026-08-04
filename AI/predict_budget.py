"""
===========================================================
PRMS SYSTEM - AI BUDGET PREDICTION MODULE

File:
    predict_budget.py

Purpose:
    Load trained budget prediction model and predict
    expected departmental budget.

Input:
    Department budget features

Output:
    Predicted budget amount

Model:
    budget_model.pkl

===========================================================
"""


# ==========================================================
# IMPORT REQUIRED LIBRARIES
# ==========================================================

import pickle
import pandas as pd



# ==========================================================
# LOAD TRAINED MODEL
# ==========================================================


print("Loading AI budget prediction model...")


with open(

    "budget_model.pkl",

    "rb"

) as file:


    model_data = pickle.load(file)



# Extract model and features

model = model_data["model"]

features = model_data["features"]



print("Model loaded successfully")





# ==========================================================
# PREDICTION FUNCTION
# ==========================================================


def predict_budget(input_data):

    """
    Predict departmental budget.

    Parameters:
        input_data:
            Dictionary containing budget features


    Returns:
        Predicted budget amount

    """



    # Convert dictionary into DataFrame

    data = pd.DataFrame(

        [input_data]

    )



    # Arrange columns exactly as training data

    data = data[features]



    # Generate prediction

    prediction = model.predict(

        data

    )


    return round(

        prediction[0],

        2

    )







# ==========================================================
# TEST PREDICTION
# ==========================================================


if __name__ == "__main__":


    # Example department budget request


    sample_budget = {

    "company_allocated_amount": 50000000,

    "department_id": 7,

    "budget_quantity": 20,

    "budget_unit_cost": 2500000,


    "total_requisitions": 15,

    "total_requested_items": 25,

    "requested_quantity": 40,


    "total_purchase_orders": 10,

    "ordered_quantity": 35,

    "purchase_order_cost": 45000000,

    "average_unit_price": 2500000,


    "total_grn_received": 8,

    "received_quantity": 30,

    "rejected_quantity": 2,


    "budget_utilization_percentage": 90,

    "remaining_budget": 5000000,

    "delivery_completion_percentage": 95

}


    result = predict_budget(

        sample_budget

    )



    print("==============================")

    print(

        "Predicted Department Budget:",

        result

    )

    print("==============================")


    