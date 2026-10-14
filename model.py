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
        try:
            cursor.execute("""
                INSERT INTO users (username, email, phone, password, user_role, department, signature)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (username, email, phone, hashed_password, user_role.lower(), department, signature_path))
        except Exception as e:
            if "unknown column 'phone'" not in str(e).lower():
                raise
            conn.rollback()
            cursor.execute("""
                INSERT INTO users (username, email, password, user_role, department, signature)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (username, email, hashed_password, user_role.lower(), department, signature_path))

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
        try:
            cursor.execute("""
                SELECT user_id, username, email, phone, department, user_role, created_at
                FROM users
                ORDER BY created_at DESC
            """)
        except Exception as e:
            if "unknown column 'phone'" not in str(e).lower():
                raise
            conn.rollback()
            cursor.execute("""
                SELECT user_id, username, email, department, user_role, created_at
                FROM users
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()
            for user in users:
                user["phone"] = None
            return users
        return cursor.fetchall()

    except Exception as e:
        print("Fetch users error:", e)
        return []

    finally:
        cursor.close()
        conn.close()


def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        try:
            cursor.execute("""
                SELECT user_id, username, email, phone, department, user_role,
                       signature, status, created_at, updated_at
                FROM users
                WHERE user_id = %s
            """, (user_id,))
        except Exception as e:
            if "unknown column 'phone'" not in str(e).lower():
                raise
            conn.rollback()
            cursor.execute("""
                SELECT user_id, username, email, department, user_role,
                       signature, status, created_at, updated_at
                FROM users
                WHERE user_id = %s
            """, (user_id,))
        user = cursor.fetchone()
        if user and "phone" not in user:
            user["phone"] = None
        return user
    except Exception as e:
        print("Fetch user error:", e)
        return None
    finally:
        cursor.close()
        conn.close()

def update_user(user_id, username, email, phone, user_role, department, password=None):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT user_id FROM users
            WHERE (email = %s OR username = %s) AND user_id <> %s
        """, (email, username, user_id))
        if cursor.fetchone():
            return {"success": False, "message": "Username or email already exists"}

        try:
            if password:
                hashed_password = generate_password_hash(password)
                cursor.execute("""
                    UPDATE users
                    SET username = %s, email = %s, phone = %s, user_role = %s,
                        department = %s, password = %s
                    WHERE user_id = %s
                """, (username, email, phone, user_role.lower(), department, hashed_password, user_id))
            else:
                cursor.execute("""
                    UPDATE users
                    SET username = %s, email = %s, phone = %s, user_role = %s,
                        department = %s
                    WHERE user_id = %s
                """, (username, email, phone, user_role.lower(), department, user_id))
        except Exception as e:
            if "unknown column 'phone'" not in str(e).lower():
                raise
            conn.rollback()
            if password:
                cursor.execute("""
                    UPDATE users
                    SET username = %s, email = %s, user_role = %s,
                        department = %s, password = %s
                    WHERE user_id = %s
                """, (username, email, user_role.lower(), department,
                      generate_password_hash(password), user_id))
            else:
                cursor.execute("""
                    UPDATE users
                    SET username = %s, email = %s, user_role = %s,
                        department = %s
                    WHERE user_id = %s
                """, (username, email, user_role.lower(), department, user_id))

        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        print("Update user error:", e)
        return {"success": False, "message": "Unable to update user account"}
    finally:
        cursor.close()
        conn.close()

# ==================================================
# VERIFY PASSWORD (OPTIONAL HELP FUNCTION)
# ==================================================
def verify_password(stored_password, input_password):
    return check_password_hash(stored_password, input_password)

def change_user_password(user_id, new_password):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE users SET password = %s WHERE user_id = %s",
            (generate_password_hash(new_password), user_id)
        )
        conn.commit()
        return cursor.rowcount == 1
    except Exception as e:
        conn.rollback()
        print("Password change error:", e)
        return False
    finally:
        cursor.close()
        conn.close()

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
        role = str(role).strip().upper()
        if role not in ("HOD", "CEO"):
            return {"success": False, "message": "Invalid role"}

        cursor.execute(
            "SELECT requisition_id FROM requisitions WHERE requisition_id = %s",
            (requisition_id,)
        )
        if not cursor.fetchone():
            return {"success": False, "message": "Requisition not found"}

        cursor.execute("""
            INSERT IGNORE INTO approvals (module_name, document_id)
            VALUES ('PRS', %s)
        """, (requisition_id,))
        cursor.execute("""
            SELECT hod_status, ceo_status
            FROM approvals
            WHERE module_name = 'PRS' AND document_id = %s
            FOR UPDATE
        """, (requisition_id,))
        approval = cursor.fetchone()

        if role == "HOD":
            if (approval[0] or "PENDING").upper() != "PENDING":
                return {"success": False, "message": "HOD has already processed this requisition"}
            cursor.execute("""
                UPDATE approvals
                SET hod_status='APPROVED', hod_user_id=%s,
                    hod_approved_at=NOW(), final_status='PENDING'
                WHERE module_name='PRS' AND document_id=%s
            """, (approver_id, requisition_id))
        else:
            if (approval[0] or "PENDING").upper() != "APPROVED":
                return {"success": False, "message": "HOD approval is required first"}
            if (approval[1] or "PENDING").upper() != "PENDING":
                return {"success": False, "message": "CEO has already processed this requisition"}
            cursor.execute("""
                UPDATE approvals
                SET ceo_status='APPROVED', ceo_user_id=%s,
                    ceo_approved_at=NOW(), final_status='APPROVED'
                WHERE module_name='PRS' AND document_id=%s
            """, (approver_id, requisition_id))

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
            SELECT
                a.hod_status,
                a.hod_approved_at,
                hod.username AS hod_username,
                hod.signature AS hod_signature,
                a.ceo_status,
                a.ceo_approved_at,
                ceo.username AS ceo_username,
                ceo.signature AS ceo_signature,
                a.remarks
            FROM approvals a
            LEFT JOIN users hod ON a.hod_user_id = hod.user_id
            LEFT JOIN users ceo ON a.ceo_user_id = ceo.user_id
            WHERE a.module_name = 'PRS'
              AND a.document_id = %s
            LIMIT 1
        """, (requisition_id,))

        row = cursor.fetchone()
        if not row:
            return []

        return [
            {
                "role": "HOD",
                "username": row["hod_username"],
                "signature": row["hod_signature"],
                "action": (row["hod_status"] or "PENDING").title(),
                "hod_approval_date": row["hod_approved_at"],
                "remarks": row["remarks"],
            },
            {
                "role": "CEO",
                "username": row["ceo_username"],
                "signature": row["ceo_signature"],
                "action": (row["ceo_status"] or "PENDING").title(),
                "ceo_approval_date": row["ceo_approved_at"],
                "remarks": row["remarks"],
            },
        ]

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
        normalized_role = str(role).strip().upper()
        if normalized_role == "CEO":
            approval_filter = "COALESCE(a.hod_status, 'PENDING') = 'APPROVED' AND COALESCE(a.ceo_status, 'PENDING') = 'PENDING'"
        elif normalized_role == "FINANCE":
            approval_filter = "a.final_status = 'APPROVED'"
        else:
            approval_filter = "COALESCE(a.hod_status, 'PENDING') = 'PENDING' AND COALESCE(a.final_status, 'PENDING') = 'PENDING'"

        cursor.execute(f"""
            SELECT
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,
                COALESCE(a.final_status, 'PENDING') AS status,
                a.hod_approved_at,
                a.ceo_approved_at
            FROM requisitions r
            JOIN departments d ON r.department_id = d.department_id
            LEFT JOIN approvals a
                ON a.module_name = 'PRS'
               AND a.document_id = r.requisition_id
            WHERE {approval_filter}
            ORDER BY r.submission_date DESC
        """)

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
        role = str(role).strip().upper()
        if role not in ("HOD", "CEO"):
            return {"success": False, "message": "Invalid role"}

        cursor.execute(
            "SELECT requisition_id FROM requisitions WHERE requisition_id = %s",
            (requisition_id,)
        )
        if not cursor.fetchone():
            return {"success": False, "message": "Requisition not found"}

        cursor.execute("""
            INSERT IGNORE INTO approvals (module_name, document_id)
            VALUES ('PRS', %s)
        """, (requisition_id,))

        if role == "HOD":
            cursor.execute("""
                UPDATE approvals
                SET hod_status='REJECTED', hod_user_id=%s,
                    hod_approved_at=NOW(), final_status='REJECTED', remarks=%s
                WHERE module_name='PRS' AND document_id=%s
                  AND COALESCE(hod_status, 'PENDING')='PENDING'
            """, (approver_id, reason, requisition_id))
        else:
            cursor.execute("""
                UPDATE approvals
                SET ceo_status='REJECTED', ceo_user_id=%s,
                    ceo_approved_at=NOW(), final_status='REJECTED', remarks=%s
                WHERE module_name='PRS' AND document_id=%s
                  AND hod_status='APPROVED'
                  AND COALESCE(ceo_status, 'PENDING')='PENDING'
            """, (approver_id, reason, requisition_id))

        if cursor.rowcount == 0:
            conn.rollback()
            return {"success": False, "message": "No pending approval found"}

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
            SELECT
                r.requisition_id,
                r.prs_no,
                d.department_name,
                r.submission_date,
                a.final_status AS status
            FROM requisitions r
            JOIN departments d ON r.department_id = d.department_id
            JOIN approvals a
                ON a.module_name = 'PRS'
               AND a.document_id = r.requisition_id
            WHERE a.final_status = 'APPROVED'
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
                r.submission_date,
                d.department_name,
                creator.username,
                creator.signature AS created_by_signature,

                COALESCE(a.final_status, 'PENDING') AS status,
                COALESCE(a.hod_status, 'PENDING') AS hod_status,
                COALESCE(a.ceo_status, 'PENDING') AS ceo_status,
                a.hod_approved_at,
                a.ceo_approved_at,
                hod.username AS hod_username,
                hod.signature AS hod_signature,
                ceo.username AS ceo_username,
                ceo.signature AS ceo_signature

            FROM requisitions r
            JOIN departments d 
                ON r.department_id = d.department_id
            JOIN users creator
                ON creator.user_id = r.user_id

            LEFT JOIN approvals a 
                ON a.module_name = 'PRS'
               AND a.document_id = r.requisition_id
            LEFT JOIN users hod ON hod.user_id = a.hod_user_id
            LEFT JOIN users ceo ON ceo.user_id = a.ceo_user_id

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
                WHERE module_name = 'PRS'
                    AND document_id = %s
        ORDER BY approval_id DESC
        LIMIT 1
    """, (requisition_id,))

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    return data