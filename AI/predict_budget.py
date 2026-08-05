"""
===========================================================
PRMS SYSTEM - AI BUDGET PREDICTION MODULE

File:
    predict_budget.py

Purpose:
    Load trained AI model and predict
    departmental budget.

Model:
    budget_model.pkl

===========================================================
"""


# ==========================================================
# IMPORTS
# ==========================================================

import os
import pickle
import pandas as pd




# ==========================================================
# LOAD AI MODEL
# ==========================================================


print("==========================================")
print("LOADING AI MODEL...")
print("==========================================")


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


MODEL_PATH = os.path.join(
    BASE_DIR,
    "budget_model.pkl"
)



if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(

        f"AI model not found: {MODEL_PATH}"

    )



try:

    with open(
        MODEL_PATH,
        "rb"
    ) as file:

        model_package = pickle.load(file)


except Exception as e:

    raise Exception(

        f"Failed loading AI model: {e}"

    )




# ==========================================================
# EXTRACT MODEL COMPONENTS
# ==========================================================


try:

    model = model_package["model"]

    features = model_package["features"]

    encoder = model_package.get(
        "encoder",
        {}
    )


except Exception as e:


    raise Exception(

        "Invalid budget_model.pkl format. "
        "Expected: model, features, encoder. "
        f"{e}"

    )





print("AI MODEL LOADED SUCCESSFULLY")

print("------------------------------------------")

print(
    "Model:",
    type(model).__name__
)


print("Features:")


for feature in features:

    print(
        "-",
        feature
    )


print("------------------------------------------")





# ==========================================================
# PREDICTION FUNCTION
# ==========================================================


def predict_budget(input_data):


    """
    Predict department budget.


    Parameters:

        input_data : dict


    Returns:

        predicted budget

    """



    # Convert dictionary to dataframe

    data = pd.DataFrame(
        [input_data]
    )




    # ======================================================
    # CLEAN DATA
    # ======================================================


    # Replace missing values

    data = data.fillna(0)



    # ======================================================
    # HANDLE ENCODING
    # ======================================================


    for column, label_encoder in encoder.items():


        if column in data.columns:


            value = str(
                data[column].iloc[0]
            )



            # Known category

            if value in label_encoder.classes_:


                data[column] = (

                    label_encoder
                    .transform(
                        [value]
                    )

                )



            else:


                # New future value
                # Example:
                # 2031/2032


                print(
                    "WARNING:",
                    column,
                    value,
                    "not found."
                    "Using default encoding."
                )



                data[column] = -1





    # ======================================================
    # CHECK REQUIRED FEATURES
    # ======================================================


    missing_features = [

        feature

        for feature in features

        if feature not in data.columns

    ]



    if missing_features:


        raise ValueError(

            f"Missing required features: "
            f"{missing_features}"

        )





    # Keep same order as training

    data = data[features]




    # ======================================================
    # FINAL CLEANING
    # ======================================================


    data = data.fillna(0)




    # ======================================================
    # AI PREDICTION
    # ======================================================


    prediction = model.predict(
        data
    )



    return round(

        float(prediction[0]),

        2

    )






# ==========================================================
# TEST
# ==========================================================


if __name__ == "__main__":



    test_data = {


        "department_id":7,


        "financial_year":
        "2031/2032",


        "company_allocated_amount":50000000,


        "budget_quantity":20,


        "budget_unit_cost":2500000,


        "total_requisitions":15,


        "total_requested_items":25,


        "requested_quantity":40,


        "total_purchase_orders":10,


        "ordered_quantity":35,


        "purchase_order_cost":45000000,


        "average_unit_price":2500000,


        "total_grn_received":8,


        "received_quantity":30,


        "rejected_quantity":2,


        "budget_utilization_percentage":90,


        "remaining_budget":5000000,


        "delivery_completion_percentage":95

    }



    result = predict_budget(
        test_data
    )



    print()

    print(
        "=========================================="
    )

    print(
        "PREDICTED BUDGET:"
    )

    print(
        f"UGX {result:,.2f}"
    )

    print(
        "=========================================="
    )