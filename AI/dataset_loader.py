"""
===========================================================
PRMS SYSTEM - AI DATASET LOADER

Purpose:
    Load training dataset when database
    has less than 50 records.

Dataset:
    budget_training_data.xlsx

===========================================================
"""


import pandas as pd
import os



# ==========================================================
# DATASET PATH
# ==========================================================


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


DATASET_PATH = os.path.join(
    BASE_DIR,
    "budget_training_data.xlsx"
)



# ==========================================================
# LOAD DATASET FEATURES
# ==========================================================


def get_dataset_features(department_id):


    """
    Load historical budget features
    from Excel dataset.
    """



    if not os.path.exists(DATASET_PATH):

        raise FileNotFoundError(

            f"AI dataset not found: {DATASET_PATH}"

        )



    # Read Excel file

    df = pd.read_excel(
        DATASET_PATH
    )



    if df.empty:

        raise Exception(
            "AI dataset is empty"
        )



    # Pick a historical example

    sample = df.sample(
        n=1
    ).copy()



    # Remove target variable

    sample = sample.drop(

        columns=[
            "department_budget"
        ],

        errors="ignore"

    )



    # Convert row to dictionary

    features = sample.iloc[0].to_dict()



    # Replace department ID

    features["department_id"] = department_id



    return features