"""
===========================================================
PRMS SYSTEM - AI BUDGET PREDICTION MODULE

File:
    train_model.py

Purpose:
    Train the final Machine Learning model for predicting
    departmental budgets.

Dataset:
    budget_dataset.xlsx

Algorithm:
    Random Forest Regression

Output:
    budget_model.pkl

===========================================================
"""


# ===========================================================
# IMPORT REQUIRED LIBRARIES
# ===========================================================


import pandas as pd
import pickle

from sklearn.model_selection import train_test_split

from sklearn.ensemble import RandomForestRegressor

from sklearn.preprocessing import LabelEncoder

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)




# ===========================================================
# 1. LOAD DATASET FROM EXCEL
# ===========================================================


print("Loading budget dataset...")


df = pd.read_excel(
    "ai_budget_training_data_100_records.xlsx"
)



print("Dataset loaded successfully")

print("Number of records:", df.shape[0])

print("Number of features:", df.shape[1])



# Display first records

print(df.head())





# ===========================================================
# 2. DATA CLEANING
# ===========================================================


print("\nChecking missing values...")


print(df.isnull().sum())



# Replace missing values

df.fillna(

    0,

    inplace=True

)



print("Missing values handled")






# ===========================================================
# 3. ENCODE CATEGORICAL DATA
# ===========================================================


"""
Machine learning models cannot understand text.

Example:

Operational  ---> 0
Capital      ---> 1

Laptop       ---> 0
Printer      ---> 1

"""


encoder = {}



categorical_columns = [

    "financial_year"

    

]



for column in categorical_columns:


    if column in df.columns:


        label_encoder = LabelEncoder()


        df[column] = label_encoder.fit_transform(

            df[column].astype(str)

        )


        encoder[column] = label_encoder




print("Categorical data encoded")







# ===========================================================
# 4. DEFINE AI FEATURES
# ===========================================================


"""
These are the variables used by AI
to predict future departmental budget.
"""


features = [

    "company_allocated_amount",


    "department_id",

    "budget_quantity",

    "budget_unit_cost",


    "total_requisitions",

    "total_requested_items",

    "requested_quantity",


    "total_purchase_orders",

    "ordered_quantity",

    "purchase_order_cost",

    "average_unit_price",


    "total_grn_received",

    "received_quantity",

    "rejected_quantity",


    "budget_utilization_percentage",

    "remaining_budget",

    "delivery_completion_percentage"

]





# Check features exist

missing_features = []


for feature in features:

    if feature not in df.columns:

        missing_features.append(feature)



if missing_features:


    print(
        "Missing columns:",
        missing_features
    )

    exit()




X = df[features]






# ===========================================================
# 5. DEFINE TARGET VARIABLE
# ===========================================================


"""
This is what AI learns to predict.

Target:

department_budget

"""


y = df["department_budget"]





# ===========================================================
# 6. SPLIT DATA FOR TRAINING AND TESTING
# ===========================================================


"""
80% data -> Training

20% data -> Testing

"""


X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.2,

    random_state=42

)



print("\nData split completed")







# ===========================================================
# 7. CREATE MACHINE LEARNING MODEL
# ===========================================================



model = RandomForestRegressor(

    n_estimators=200,

    random_state=42

)



print("\nTraining AI model...")





# ===========================================================
# 8. TRAIN MODEL
# ===========================================================


model.fit(

    X_train,

    y_train

)



print("Training completed")







# ===========================================================
# 9. MODEL EVALUATION
# ===========================================================



prediction = model.predict(

    X_test

)



mae = mean_absolute_error(

    y_test,

    prediction

)



mse = mean_squared_error(

    y_test,

    prediction

)



rmse = mse ** 0.5



accuracy = r2_score(

    y_test,

    prediction

)



print("\n========== MODEL PERFORMANCE ==========")


print(
    "Mean Absolute Error:",
    mae
)


print(
    "Root Mean Square Error:",
    rmse
)


print(
    "R2 Accuracy:",
    accuracy
)


print(
    "======================================"
)






# ===========================================================
# 10. SAVE TRAINED MODEL
# ===========================================================



model_package = {


    "model": model,


    "encoder": encoder,


    "features": features


}



with open(

    "budget_model.pkl",

    "wb"

) as file:


    pickle.dump(

        model_package,

        file

    )





print("\n===================================")

print("AI MODEL SAVED SUCCESSFULLY")

print("File: budget_model.pkl")

print("===================================")