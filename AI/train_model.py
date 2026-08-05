"""
===========================================================
PRMS SYSTEM - AI BUDGET PREDICTION MODULE

File:
    train_model.py

Purpose:
    Train the Machine Learning model for predicting
    departmental budgets.

Dataset:
    ai_budget_training_data_100_records.xlsx

Algorithm:
    Random Forest Regression

Output:
    budget_model.pkl
    feature_importance.xlsx

===========================================================
"""

# ==========================================================
# IMPORT REQUIRED LIBRARIES
# ==========================================================

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

# ==========================================================
# 1. LOAD DATASET
# ==========================================================

print("==========================================")
print("LOADING DATASET...")
print("==========================================")

df = pd.read_excel("ai_budget_training_data_100_records.xlsx")

print("Dataset loaded successfully.")
print("Number of Records :", df.shape[0])
print("Number of Columns :", df.shape[1])

print("\nFirst Five Records")
print(df.head())

# ==========================================================
# 2. DATA CLEANING
# ==========================================================

print("\nChecking Missing Values...")

print(df.isnull().sum())

df.fillna(0, inplace=True)

print("\nMissing values handled successfully.")

# ==========================================================
# 3. ENCODE CATEGORICAL DATA
# ==========================================================

print("\nEncoding categorical columns...")

encoder = {}

categorical_columns = [
    "financial_year",
    "department_id"
]

for column in categorical_columns:

    if column in df.columns:

        label_encoder = LabelEncoder()

        df[column] = label_encoder.fit_transform(
            df[column].astype(str)
        )

        encoder[column] = label_encoder

print("Categorical data encoded successfully.")

# ==========================================================
# 4. DEFINE FEATURES
# ==========================================================

features = [

    "department_id",

    "company_allocated_amount",

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

missing_features = []

for feature in features:

    if feature not in df.columns:

        missing_features.append(feature)

if len(missing_features) > 0:

    print("\nERROR")
    print("Missing Feature Columns:")

    for column in missing_features:

        print("-", column)

    exit()

X = df[features]

# ==========================================================
# 5. TARGET VARIABLE
# ==========================================================

target = "department_budget"

if target not in df.columns:

    print("\nERROR: department_budget column not found.")
    exit()

y = df[target]

print("\nFeature selection completed.")

# ==========================================================
# 6. SPLIT DATASET
# ==========================================================

print("\nSplitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42

)

print("Training Records :", len(X_train))
print("Testing Records  :", len(X_test))

# ==========================================================
# 7. CREATE MODEL
# ==========================================================

print("\nCreating Random Forest Model...")

model = RandomForestRegressor(

    n_estimators=500,

    max_depth=15,

    min_samples_split=5,

    random_state=42,

    n_jobs=-1

)

# ==========================================================
# 8. TRAIN MODEL
# ==========================================================

print("\nTraining AI Model...")

model.fit(

    X_train,

    y_train

)

print("Training completed successfully.")

# ==========================================================
# 9. EVALUATE MODEL
# ==========================================================

print("\nEvaluating model...")

prediction = model.predict(X_test)

mae = mean_absolute_error(

    y_test,

    prediction

)

mse = mean_squared_error(

    y_test,

    prediction

)

rmse = mse ** 0.5

r2 = r2_score(

    y_test,

    prediction

)

print("\n==========================================")
print("MODEL PERFORMANCE")
print("==========================================")
print("Mean Absolute Error      :", round(mae, 2))
print("Root Mean Square Error   :", round(rmse, 2))
print("R2 Score                 :", round(r2, 4))
print("==========================================")

# ==========================================================
# 10. FEATURE IMPORTANCE
# ==========================================================

importance = pd.DataFrame({

    "Feature": features,

    "Importance": model.feature_importances_

})

importance = importance.sort_values(

    by="Importance",

    ascending=False

)

print("\nFeature Importance")

print(importance)

importance.to_excel(

    "feature_importance.xlsx",

    index=False

)

print("\nFeature importance saved.")

# ==========================================================
# 11. SAVE MODEL
# ==========================================================

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

print("\n==========================================")
print("AI MODEL TRAINED SUCCESSFULLY")
print("==========================================")
print("Model File              : budget_model.pkl")
print("Feature Importance File : feature_importance.xlsx")
print("==========================================")
print("Ready for budget prediction.")