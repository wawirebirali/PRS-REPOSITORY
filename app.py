from flask import Flask, render_template, url_for, redirect, session
import os
from routes.auth_route import create_default_admin
# =========================
# BLUEPRINT IMPORTS
# =========================
from routes.auth_route import auth_bp
from routes.budget_prediction import budget_ai_bp
from routes.maindashboard import maindashboard_bp
from routes.hod_route import hod_dashboard_bp
from routes.employee_route import employee_dashboard_bp
from routes.hod_dashboard_view import hod_dashboard_view_bp
from routes.ceo_dashboard_view import ceo_dashboard_view_bp
from routes.ceo_route import ceo_dashboard_bp
from routes.procurement_route import procurement_dashboard_bp
from routes.procurement_view import procurement_view_bp
from routes.requisition_route import requisition_bp
from routes.admin_route import admin_dashboard_bp
from routes.finance_route import finance_dashboard_bp
from model import get_notifications_for_user
from routes.finance_view import finance_view_dashboard_bp
# =========================
# APP INITIALIZATION
# =========================
app = Flask(__name__)

# Secret key (safe fallback)
app.secret_key = os.environ.get(
    "SECRET_KEY",
    "prs-dev-secret-key"
)

# =========================
# REGISTER BLUEPRINTS
# =========================
app.register_blueprint(auth_bp)
app.register_blueprint(budget_ai_bp)
app.register_blueprint(maindashboard_bp)
app.register_blueprint(hod_dashboard_bp, url_prefix="/hod")
app.register_blueprint(employee_dashboard_bp, url_prefix="/employee")
app.register_blueprint(ceo_dashboard_view_bp, url_prefix="/ceo")
app.register_blueprint(hod_dashboard_view_bp, url_prefix="/hod")
app.register_blueprint(ceo_dashboard_bp, url_prefix="/ceo")
app.register_blueprint(procurement_dashboard_bp, url_prefix="/procurement")
app.register_blueprint(procurement_view_bp, url_prefix="/procurement")
app.register_blueprint(admin_dashboard_bp, url_prefix="/admin")
app.register_blueprint(requisition_bp)
app.register_blueprint(finance_dashboard_bp, url_prefix="/finance")
app.register_blueprint(finance_view_dashboard_bp, url_prefix="/finance")
# =========================
# CREATE DEFAULT ADMIN (SAFE)
# =========================

# =========================
# EXTRA STATIC PAGES
# =========================

@app.route("/report")
def report():
    return render_template("report.html")


@app.route("/quotation")
def quotation():
    return render_template("quotation.html")


@app.route("/notification")
def notification():
    if not session.get("user_id"):
        return redirect(url_for("auth.user_login"))

    notifications = get_notifications_for_user(session.get("user_id"))
    return render_template("notification.html", notifications=notifications)


with app.app_context():
    create_default_admin()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


