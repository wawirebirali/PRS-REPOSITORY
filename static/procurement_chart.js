/* =====================================================
        PROCUREMENT DASHBOARD JS
===================================================== */

let procurementActivityChart = null;
let documentStatusChart = null;
let departmentChart = null;
let supplierChart = null;
let materialChart = null;

function setDashboardDate() {
    const dashboardDateEl = document.getElementById("dashboardDate");
    if (dashboardDateEl) {
        dashboardDateEl.innerText = new Date().toLocaleDateString();
    }
}

function destroyCharts() {
    [procurementActivityChart, documentStatusChart, departmentChart, supplierChart, materialChart].forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });

    procurementActivityChart = null;
    documentStatusChart = null;
    departmentChart = null;
    supplierChart = null;
    materialChart = null;
}

function loadDashboard() {
    if (typeof window.Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    fetch("/procurement/dashboard_data")
        .then(response => {
            if (!response.ok) {
                throw new Error("Dashboard API Error");
            }
            return response.json();
        })
        .then(data => {
            const safeArray = value => Array.isArray(value) ? value : [];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const months = safeArray(data.months).map(month => monthNames[Number(month) - 1] || month);

            const totalPR = document.getElementById("totalPR");
            const pendingPR = document.getElementById("pendingPR");
            const totalQRF = document.getElementById("totalQRF");
            const totalPO = document.getElementById("totalPO");
            const totalGRN = document.getElementById("totalGRN");

            if (totalPR) totalPR.innerText = data.total_pr ?? 0;
            if (pendingPR) pendingPR.innerText = data.pending_pr ?? 0;
            if (totalQRF) totalQRF.innerText = data.total_qrf ?? 0;
            if (totalPO) totalPO.innerText = data.total_po ?? 0;
            if (totalGRN) totalGRN.innerText = data.total_grn ?? 0;

            destroyCharts();

            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false
            };

            const activityCanvas = document.getElementById("procurementActivityChart");
            if (activityCanvas) {
                procurementActivityChart = new Chart(activityCanvas, {
                    type: "bar",
                    data: {
                        labels: months,
                        datasets: [
                            { label: "Requisitions", data: safeArray(data.pr_monthly) },
                            { label: "Purchase Orders", data: safeArray(data.po_monthly) },
                            { label: "GRN", data: safeArray(data.grn_monthly) }
                        ]
                    },
                    options: chartOptions
                });
            }

            const documentStatusCanvas = document.getElementById("documentStatusChart");
            if (documentStatusCanvas) {
                documentStatusChart = new Chart(documentStatusCanvas, {
                    type: "pie",
                    data: {
                        labels: ["Pending", "Approved", "Completed", "Rejected"],
                        datasets: [{
                            data: safeArray(data.status).length ? safeArray(data.status) : [1, 1, 1, 1]
                        }]
                    },
                    options: chartOptions
                });
            }

            const departmentCanvas = document.getElementById("departmentChart");
            if (departmentCanvas) {
                departmentChart = new Chart(departmentCanvas, {
                    type: "bar",
                    data: {
                        labels: safeArray(data.departments),
                        datasets: [{ label: "Requests", data: safeArray(data.department_count) }]
                    },
                    options: chartOptions
                });
            }

            const supplierCanvas = document.getElementById("supplierChart");
            if (supplierCanvas) {
                supplierChart = new Chart(supplierCanvas, {
                    type: "bar",
                    data: {
                        labels: safeArray(data.suppliers),
                        datasets: [{ label: "Purchase Orders", data: safeArray(data.supplier_orders) }]
                    },
                    options: chartOptions
                });
            }

            const materialCanvas = document.getElementById("materialChart");
            if (materialCanvas) {
                materialChart = new Chart(materialCanvas, {
                    type: "bar",
                    data: {
                        labels: safeArray(data.materials),
                        datasets: [{ label: "Quantity Requested", data: safeArray(data.material_qty) }]
                    },
                    options: chartOptions
                });
            }

            const recentTable = document.getElementById("recentProcurement");
            if (recentTable) {
                recentTable.innerHTML = "";
                (data.recent_documents || []).forEach(doc => {
                    recentTable.innerHTML += `
                        <tr>
                            <td>${doc.document || "-"}</td>
                            <td>${doc.number || "-"}</td>
                            <td>${doc.status || "-"}</td>
                            <td>${doc.date || "-"}</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(error => {
            console.error("Dashboard Error:", error);
        });
}

window.loadDashboard = loadDashboard;

document.addEventListener("DOMContentLoaded", () => {
    setDashboardDate();
    if (document.getElementById("dashboard")) {
        loadDashboard();
    }
});
