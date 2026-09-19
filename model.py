from db_connect import get_db_connection
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# ==================================================
# CREATE USER (SIGNUP)
# ==================================================
def create_user(username, email, phone, password, user_role, department, signature_path):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check duplicate email or username
        cursor.execute("""
            SELECT user_id FROM users
            WHERE email = %s OR username = %s
        """, (email, username))

        if cursor.fetchone():
            return {"success": False, "message": "Username or Email already exists"}

        # Hash password
        hashed_password = generate_password_hash(password)

        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, phone, password, user_role, department, signature)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (username, email, phone, hashed_password, user_role.lower(), department, signature_path))

        conn.commit()

        return {"success": True}

    except Exception as e:
        conn.rollback()
        print("Signup error:", e)
        return {"success": False, "message": "Signup failed"}

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET USER BY USERNAME (LOGIN)
# ==================================================
def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id, username, email, phone, password, user_role, department, signature
            FROM users
            WHERE username = %s OR email = %s
        """, (username, username))

        return cursor.fetchone()

    except Exception as e:
        if "unknown column" not in str(e).lower():
            print("Login fetch error:", e)
            return None

        try:
            cursor.execute("""
                SELECT user_id, username, email, password, user_role, department, signature
                FROM users
                WHERE username = %s OR email = %s
            """, (username, username))

            user = cursor.fetchone()
            if user:
                user["phone"] = None
            return user
        except Exception as fallback_error:
            print("Login fallback error:", fallback_error)
            return None

    finally:
        cursor.close()
        conn.close()

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email = %s",
        (email,)
    )

    user = cursor.fetchone()
    conn.close()

    return user

# ==================================================
# GET ALL USERS (FOR ADMIN)
# ==================================================
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id, username, email, phone, department, user_role, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        return cursor.fetchall()

    except Exception as e:
        print("Fetch users error:", e)
        return []

    finally:
        cursor.close()
        conn.close()

# ==================================================
# VERIFY PASSWORD (OPTIONAL HELP FUNCTION)
# ==================================================
def verify_password(stored_password, input_password):
    return check_password_hash(stored_password, input_password)

def insert_user(username, email, password, user_role, department):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO users (username, email, password, user_role, department)
        VALUES (%s, %s, %s, %s, %s)
    """, (username, email, password, user_role, department))

    conn.commit()
    conn.close()

# ==================================================
# GET ALL REQUISITIONS (FOR ADMIN)
# ==================================================
def get_all_requisitions():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT

                r.requisition_id,

                r.prs_no,

                d.department_id,

                d.department_name,

                COALESCE(
                    a.final_status,
                    'PENDING'
                ) AS status,

                r.submission_date,

                a.hod_approved_at

            FROM requisitions r

            JOIN departments d
                ON d.department_id = r.department_id

            LEFT JOIN approvals a
                ON a.document_id = r.requisition_id
               AND a.module_name = 'PRS'

            ORDER BY r.submission_date DESC
        """)

        return cursor.fetchall()

    finally:

        cursor.close()
        conn.close()
# ==================================================
# GET REQUISITION BY ID
# ==================================================
def get_requisition_items(requisition_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT material_name, description, uom, qty_required
        FROM requisition_items
        WHERE requisition_id = %s
    """, (requisition_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


# ==================================================
# CREATE REQUISITION
# ==================================================


# ==================================================
# APPROVE REQUISITION
# ==================================================
def approve_requisition(requisition_id, approver_id, role):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Only allow HOD and CEO
        date_column_map = {
            "HOD": "hod_approval_date",
            "CEO": "ceo_approval_date"
        }

        date_column = date_column_map.get(role)

        if not date_column:
            return {"success": False, "message": "Invalid role"}

        # 1. Update approval record
        cursor.execute(f"""
            UPDATE approvals
            SET action = 'Approved',
                {date_column} = NOW(),
                status = 'Completed'
            WHERE requisition_id = %s
              AND approver_id = %s
              AND role = %s
              AND status = 'Pending'
        """, (requisition_id, approver_id, role))

        if cursor.rowcount == 0:
            return {"success": False, "message": "No pending approval found"}

        # 2. Determine next stage
        next_stage_map = {
            "HOD": "CEO"
        }

        next_stage = next_stage_map.get(role)

        # 3. Get PRS number
        cursor.execute("""
            SELECT prs_no FROM requisitions
            WHERE requisition_id = %s
        """, (requisition_id,))

        row = cursor.fetchone()
        prs_no = row[0] if row else ""

        # 4. Move workflow forward
        if next_stage:
            cursor.execute("""
                UPDATE requisitions
                SET current_stage = %s,
                    status = %s
                WHERE requisition_id = %s
            """, (next_stage, f"PENDING_{next_stage}", requisition_id))

            # assign next approver (CEO)
            cursor.execute("""
                SELECT user_id FROM users
                WHERE user_role = %s
                LIMIT 1
            """, (next_stage.lower(),))

            next_user = cursor.fetchone()

            if next_user:
                next_user_id = next_user[0]

                cursor.execute("""
                    INSERT INTO approvals (requisition_id, approver_id, role, hod_status)
                    VALUES (%s, %s, %s, %s)
                """, (requisition_id, next_user_id, next_stage, "Pending"))

                create_notification(
                    next_user_id,
                    f"Requisition {prs_no} is pending your approval."
                )

        else:
            # Final approval (CEO)
            cursor.execute("""
                UPDATE requisitions
                SET status = 'APPROVED'
                WHERE requisition_id = %s
            """, (requisition_id,))

        conn.commit()

        return {"success": True}

    except Exception as e:
        conn.rollback()
        print("Approve requisition error:", e)
        return {"success": False, "message": "Approval failed"}

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET APPROVALS FOR REQUISITION
# ==================================================
def get_requisition_approvals(requisition_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT a.*, u.username, u.signature
            FROM approvals a
            JOIN users u ON a.approver_id = u.user_id
            WHERE a.requisition_id = %s
            ORDER BY a.created_at
        """, (requisition_id,))

        return cursor.fetchall()

    except Exception as e:
        print("Fetch approvals error:", e)
        return []

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET PENDING REQUISITIONS FOR ROLE
# ==================================================
def get_pending_requisitions_for_role(role):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT r.requisition_id,
                   r.prs_no,
                   d.department_name,
                   r.submission_date,
                   r.status,
                   a.hod_approval_date
            FROM requisitions r
            JOIN departments d ON r.department_id = d.department_id
            LEFT JOIN approvals a ON r.requisition_id = a.requisition_id AND a.role = 'HOD'
            WHERE r.current_stage = %s AND r.status != 'Rejected'
            ORDER BY r.submission_date DESC
        """, (role,))

        return cursor.fetchall()

    except Exception as e:
        print("Fetch pending requisitions error:", e)
        return []

    finally:
        cursor.close()
        conn.close()


def create_notification(user_id, message):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO notifications (user_id, message)
            VALUES (%s, %s)
        """, (user_id, message))
        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        print("Create notification error:", e)
        return {"success": False, "message": "Failed to create notification"}

    finally:
        cursor.close()
        conn.close()


def get_notifications_for_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT notification_id, message, status, created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        return cursor.fetchall()

    except Exception as e:
        print("Fetch notifications error:", e)
        return []

    finally:
        cursor.close()
        conn.close()


# ==================================================
# REJECT REQUISITION
# ==================================================
def reject_requisition(requisition_id, approver_id, role, reason=""):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Map role to approval date column
        date_column_map = {
            "HOD": "hod_approval_date",
            "CEO": "ceo_approval_date",
            "Finance": "finance_approval_date",
            "Procurement": "procurement_approval_date"
        }
        date_column = date_column_map.get(role, "hod_approval_date")

        # Update approval record with role-specific date column
        update_query = f"""
            UPDATE approvals
            SET action = 'Rejected', {date_column} = NOW(), status = 'Completed', remarks = %s
            WHERE requisition_id = %s AND approver_id = %s AND role = %s
        """
        cursor.execute(update_query, (reason, requisition_id, approver_id, role))

        cursor.execute("""
            UPDATE requisitions
            SET status = 'Rejected'
            WHERE requisition_id = %s
        """, (requisition_id,))

        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        print("Reject requisition error:", e)
        return {"success": False, "message": "Failed to reject requisition"}

    finally:
        cursor.close()
        conn.close()


# ==================================================
# GET APPROVED REQUISITIONS
# ==================================================
def get_approved_requisitions():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT r.requisition_id, r.prs_no, d.department_name, r.submission_date, r.status
            FROM requisitions r
            JOIN departments d ON r.department_id = d.department_id
            WHERE r.status = 'Approved' AND r.current_stage = 'Procurement'
            ORDER BY r.submission_date DESC
        """)

        return cursor.fetchall()

    except Exception as e:
        print("Fetch approved requisitions error:", e)
        return []

    finally:
        cursor.close()
        conn.close()



# ==================================================
# GET BASIC REQUISITIONS LIST (FOR HOD DASHBOARD)
# ==================================================

def get_requisitions_basic():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.hod_approval_date, '-') AS hod_approval_date

            FROM requisitions r
            JOIN departments d 
                ON r.department_id = d.department_id

            LEFT JOIN approvals a 
                ON a.approval_id = (
                    SELECT a2.approval_id
                    FROM approvals a2
                    WHERE a2.requisition_id = r.requisition_id
                      AND a2.role = 'HOD'
                    ORDER BY a2.hod_approval_date DESC, a2.approval_id DESC
                    LIMIT 1
                )

            ORDER BY r.submission_date DESC
        """)

        rows = cursor.fetchall()
        return rows

    except Exception as e:
        print("Error fetching requisitions:", e)
        return []

    finally:
        cursor.close()
        conn.close()


# get requisition by id
def get_requisition_by_id(requisition_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                r.requisition_id,
                r.prs_no,
                r.status,
                r.submission_date,
                d.department_name,

                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.hod_approval_date, '-') AS hod_approval_date

            FROM requisitions r
            JOIN departments d 
                ON r.department_id = d.department_id

            LEFT JOIN approvals a 
                ON a.approval_id = (
                    SELECT a2.approval_id
                    FROM approvals a2
                    WHERE a2.requisition_id = r.requisition_id
                      AND a2.role = 'HOD'
                    ORDER BY a2.hod_approval_date DESC, a2.approval_id DESC
                    LIMIT 1
                )

            WHERE r.requisition_id = %s
        """, (requisition_id,))

        result = cursor.fetchone()
        return result

    except Exception as e:
        print("ERROR:", e)
        return None

    finally:
        cursor.close()
        conn.close()



def get_latest_approval_by_requisition(requisition_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM approvals
        WHERE requisition_id = %s
        ORDER BY approval_id DESC
        LIMIT 1
    """, (requisition_id,))

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    return data