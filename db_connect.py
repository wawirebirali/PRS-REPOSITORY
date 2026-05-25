import mysql.connector
from mysql.connector import Error

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root2",
            password="1234",
            database="prs"
        )

        if connection.is_connected():
            print("✅ Database connected successfully")
            return connection

    except Error as e:
        print("❌ Failed to connect to database")
        print(f"Error: {e}")
        return None


# 👇 THIS IS REQUIRED when running the file directly
if __name__ == "__main__":
    conn = get_db_connection()
    if conn:
        conn.close()
