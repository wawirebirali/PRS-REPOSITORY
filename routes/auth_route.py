import base64

from flask import Blueprint, render_template, request, redirect, flash, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import os
import uuid

from model import change_user_password, get_user_by_username, create_user, get_user_by_email, insert_user

auth_bp = Blueprint("auth", __name__)

# =========================
@auth_bp.route("/user-login", methods=["GET", "POST"])
def user_login():

    if request.method == "POST":

        username = request.form["username"].strip()
        password = request.form["password"]

        user = get_user_by_username(username)

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid username or password", "danger")
            return redirect(url_for("auth.user_login"))

        session.clear()

        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["user_role"] = user["user_role"].lower()

        flash("Login successful", "success")

        role = session["user_role"]

        if role == "procurement":
            return redirect(url_for(
            "procurement_dashboard.procurement_dashboard"
        ))
            

        elif role == "ceo":
            return redirect(url_for("ceo.ceo_dashboard"))

        elif role == "hod":
            return redirect(url_for("hod_dashboard.hod_dashboard"))

        elif role == "finance":
            return redirect(url_for("finance_dashboard.dashboard"))

        elif role == "admin":
            return redirect(url_for("admin_dashboard.admin_dashboard"))

        elif role == "employee":
            return redirect(url_for("employee_dashboard.employee_dashboard"))

        else:
            flash("Unauthorized role", "danger")
            return redirect(url_for("auth.user_login"))

    return render_template("user_login.html", form_action=url_for("auth.user_login"), page_title="User Login")

# =========================
# ROLE-SPECIFIC LOGIN ROUTES
# =========================
@auth_bp.route("/hod-login", methods=["GET", "POST"])
def hod_login():
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"]

        user = get_user_by_username(username)

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid username or password", "danger")
            return redirect(url_for("auth.hod_login"))

        # Verify user is HOD
        if user["user_role"].lower() != "hod":
            flash("This account is not authorized as HOD", "danger")
            return redirect(url_for("auth.hod_login"))

        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["user_role"] = "hod"

        flash("Login successful", "success")
        return redirect(url_for("hod_dashboard.hod_dashboard"))

    return render_template("user_login.html", form_action=url_for("auth.hod_login"), page_title="HOD Login")


@auth_bp.route("/procurement-login", methods=["GET", "POST"])
def procurement_login():

    if request.method == "POST":

        username = request.form["username"].strip()
        password = request.form["password"]

        user = get_user_by_username(username)

        # ❌ invalid login → stay on SAME page
        if not user or not check_password_hash(user["password"], password):
            flash("Invalid username or password", "danger")
            return redirect(url_for("auth.procurement_login"))

        # ❌ role check
        if user["user_role"].lower() != "procurement":
            flash("This account is not authorized for Procurement", "danger")
            return redirect(url_for("auth.procurement_login"))

        # ✅ login success
        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["user_role"] = "procurement"

        flash("Login successful", "success")

        # 🔥 FIX THIS LINE (MOST IMPORTANT)
        return redirect(url_for("procurement_dashboard.procurement_dashboard"))

    return render_template(
        "user_login.html",
        form_action=url_for("auth.procurement_login"),
        page_title="Procurement Login"
    )

@auth_bp.route("/ceo-login", methods=["GET", "POST"])
def ceo_login():
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"]

        user = get_user_by_username(username)

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid username or password", "danger")
            return redirect(url_for("auth.ceo_login"))

        # Verify user is CEO
        if user["user_role"].lower() != "ceo":
            flash("This account is not authorized for CEO", "danger")
            return redirect(url_for("auth.ceo_login"))

        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["user_role"] = "ceo"

        flash("Login successful", "success")
        return redirect(url_for("ceo.ceo_dashboard"))

    return render_template("user_login.html", form_action=url_for("auth.ceo_login"), page_title="CEO Login")


@auth_bp.route("/finance-login", methods=["GET", "POST"])
def finance_login():
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"]

        user = get_user_by_username(username)

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid username or password", "danger")
            return redirect(url_for("auth.finance_login"))

        # Verify user is Finance
        if user["user_role"].lower() != "finance":
            flash("This account is not authorized for Finance", "danger")
            return redirect(url_for("auth.finance_login"))

        session.clear()
        session["user_id"] = user["user_id"]
        session["username"] = user["username"]
        session["user_role"] = "finance"

        flash("Login successful", "success")
        return redirect(url_for("finance_dashboard.dashboard"))

    return render_template("user_login.html", form_action=url_for("auth.finance_login"), page_title="Finance Login")


# =========================
# SIGNUP
# =========================

UPLOAD_FOLDER = "static/signatures"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    role = session.get("user_role") or session.get("role")
    if not role or role.lower() != "admin":
        return redirect(url_for("auth.admin_login"))

    if request.method == "POST":

        username = request.form["username"].strip()
        email = request.form["email"].strip()
        phone = request.form.get("phone", "").strip()
        password = request.form["password"]
        user_role = request.form["user_role"]
        department = request.form.get("department")

        if user_role.lower() not in {"admin", "finance", "ceo", "hod", "procurement", "employee"}:
            flash("Select a valid user role", "danger")
            return render_template("signup.html")

        # =========================
        # CANVAS SIGNATURE (NEW)
        # =========================
        signature_data = request.form.get("signature_data")

        if not signature_data:
            flash("Signature is required", "danger")
            return render_template("signup.html")

        try:
            # remove header: data:image/png;base64,
            header, encoded = signature_data.split(",", 1)

            binary_data = base64.b64decode(encoded)

            os.makedirs(UPLOAD_FOLDER, exist_ok=True)

            unique_name = f"{uuid.uuid4().hex}.png"
            signature_path = os.path.join(UPLOAD_FOLDER, unique_name)

            with open(signature_path, "wb") as f:
                f.write(binary_data)

            db_signature_path = f"signatures/{unique_name}"

        except Exception:
            flash("Invalid signature data", "danger")
            return render_template("signup.html")

        # =========================
        # CREATE USER
        # =========================
        result = create_user(
            username=username,
            email=email,
            phone=phone,
            password=password,
            user_role=user_role,
            department=department,
            signature_path=db_signature_path
        )

        if result["success"]:
            flash("Account created successfully", "success")
            return redirect(url_for("admin_dashboard.admin_dashboard"))

        flash(result["message"], "danger")

    return render_template("signup.html")

def create_default_admin():
    admin_email = "admin@prs.com"
    admin_password = "admin123"

    # check if admin exists
    existing_admin = get_user_by_email(admin_email)

    if existing_admin:
        print("ℹ️ Admin already exists")
        return

    hashed_password = generate_password_hash(admin_password)

    insert_user(
        username="System Admin",
        email=admin_email,
        password=hashed_password,
        user_role="admin",
        department="Administration"
    )

    print("✅ Default admin created")
    print("📌 Email: admin@prs.com")

@auth_bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        user = get_user_by_email(email)

        if not user:
            return render_template("admin_login.html", error="Admin not found")

        # ensure user is admin
        if user["user_role"] != "admin":
            return render_template("admin_login.html", error="Not an admin account")

        # check password
        if not check_password_hash(user["password"], password):
            return render_template("admin_login.html", error="Invalid password")

        # create session
        session["user_id"] = user["user_id"]
        session["role"] = user["user_role"]
        session["username"] = user["username"]

        # redirect to admin dashboard (FIXED)
        return redirect(url_for("admin_dashboard.admin_dashboard"))

    # GET request → show login page (FIXED)
    return render_template("admin_login.html")

@auth_bp.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        user = get_user_by_email(email)

        if not user:
            flash('No user found with that email address.', 'danger')
            return render_template('forgot_password.html')

        if user.get("user_role") != "admin":
            flash('That email is not an administrator account.', 'danger')
            return render_template('forgot_password.html')

        current_password = request.form.get('current_password', '')
        new_password = request.form.get('new_password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not check_password_hash(user['password'], current_password):
            flash('Current password is incorrect.', 'danger')
            return render_template('forgot_password.html')

        if len(new_password) < 8:
            flash('New password must be at least 8 characters long.', 'danger')
            return render_template('forgot_password.html')

        if new_password != confirm_password:
            flash('New password and confirmation do not match.', 'danger')
            return render_template('forgot_password.html')

        if not change_user_password(user['user_id'], new_password):
            flash('Unable to update the password. Please try again.', 'danger')
            return render_template('forgot_password.html')

        flash('Password changed. Sign in with your new password.', 'success')
        return redirect(url_for('auth.admin_login'))

    return render_template('forgot_password.html')



@auth_bp.route("/logout")
def logout():
    session.clear()  # destroys all user session data
    flash("You have been logged out successfully", "success")
    return redirect(url_for("maindashboard.home"))
    
