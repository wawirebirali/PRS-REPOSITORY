/*****************************************************************
        HOD DASHBOARD
******************************************************************/

// ================================================
// PAGE LOAD
// ================================================

document.addEventListener("DOMContentLoaded", function () {

    loadDashboard();

    startClock();

    animateKPIs();

});


// ================================================
// LOAD DASHBOARD
// ================================================

function loadDashboard() {

    loadDashboardSummary();

    loadBudgetSummary();

    loadRecentDocuments();

    loadNotifications();

    loadCharts();

}


// ================================================
// LIVE DATE & TIME
// ================================================

function startClock() {

    updateClock();

    setInterval(updateClock, 1000);

}

function updateClock() {

    const now = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    const date =
        now.toLocaleDateString(undefined, options);

    const time =
        now.toLocaleTimeString();

    const element =
        document.getElementById("currentDate");

    if (element) {

        element.innerHTML =
            `<div>${date}</div><small>${time}</small>`;

    }

}


// ================================================
// KPI ANIMATION
// ================================================

function animateKPIs() {

    document
    .querySelectorAll(".kpi-card h2")
    .forEach(counter => {

        const target =
            parseInt(counter.innerText) || 0;

        let value = 0;

        const speed =
            Math.max(10, target / 40);

        counter.innerText = 0;

        const interval =
        setInterval(() => {

            value += speed;

            if (value >= target) {

                counter.innerText = target;

                clearInterval(interval);

            } else {

                counter.innerText =
                    Math.floor(value);

            }

        },20);

    });

}


// ================================================
// DASHBOARD SUMMARY
// ================================================
// ============================================================
// LOAD HOD DASHBOARD SUMMARY
// ============================================================

function loadDashboardSummary() {

    fetch("/hod/dashboard_summary")

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Failed to load dashboard summary"
                );

            }

            return response.json();

        })

        .then(data => {

            console.log(
                "HOD Dashboard Summary:",
                data
            );


            // ==========================================
            // TOTAL REQUISITIONS
            // ==========================================

            const totalRequisitions =
                document.getElementById(
                    "totalRequisitions"
                );

            if (totalRequisitions) {

                totalRequisitions.innerText =
                    data.total_prs || 0;

            }


            // ==========================================
            // PENDING APPROVALS
            // ==========================================

            const pendingApprovals =
                document.getElementById(
                    "pendingApprovals"
                );

            if (pendingApprovals) {

                pendingApprovals.innerText =
                    data.pending_prs || 0;

            }


            // ==========================================
            // APPROVED
            // ==========================================

            const approvedCount =
                document.getElementById(
                    "approvedCount"
                );

            if (approvedCount) {

                approvedCount.innerText =
                    data.approved_prs || 0;

            }


            // ==========================================
            // REJECTED
            // ==========================================

            const rejectedCount =
                document.getElementById(
                    "rejectedCount"
                );

            if (rejectedCount) {

                rejectedCount.innerText =
                    data.rejected_prs || 0;

            }

            const pendingApprovalCount =
                document.getElementById(
                    "pendingApprovalCount"
                );

            if (pendingApprovalCount) {

                pendingApprovalCount.innerText =
                    data.pending_prs || 0;

            }


            // ==========================================
            // DISPLAY DEPARTMENT
            // OPTIONAL
            // ==========================================

            const departmentName =
                document.getElementById(
                    "departmentName"
                );

            if (departmentName) {

                departmentName.innerText =
                    data.department_name || "";

            }


            // ==========================================
            // ANIMATE KPI NUMBERS
            // ==========================================

            animateKPIs();

        })

        .catch(error => {

            console.error(
                "Dashboard Summary Error:",
                error
            );

        });

}



// ============================================================
// LOAD HOD BUDGET KPI SUMMARY
// ============================================================
// ==========================================================
// LOAD HOD BUDGET SUMMARY
// ==========================================================

async function loadBudgetSummary() {

    console.log(
        "Loading HOD Budget Summary..."
    );

    try {

        const response = await fetch(
            "/hod/dashboard_budget_summary"
        );

        console.log(
            "Budget Summary Status:",
            response.status
        );

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }

        const data =
            await response.json();

        console.log(
            "HOD Budget Summary:",
            data
        );


        if (!data.success) {

            console.error(
                "Budget Summary Error:",
                data.message ||
                data.error
            );

            return;

        }


        // ==================================================
        // TOTAL BUDGET ALLOCATED
        // ==================================================

        const totalBudgetElement =
            document.getElementById(
                "totalBudgetAllocated"
            );

        if (totalBudgetElement) {

            totalBudgetElement.textContent =
                "UGX " +
                Number(
                    data.total_budget_allocated || 0
                ).toLocaleString();

        }


        // ==================================================
        // AMOUNT SPENT
        // ==================================================

        const amountSpentElement =
            document.getElementById(
                "amountSpent"
            );

        if (amountSpentElement) {

            amountSpentElement.textContent =
                "UGX " +
                Number(
                    data.amount_spent || 0
                ).toLocaleString();

        }


        // ==================================================
        // BUDGET BALANCE
        // ==================================================

        const budgetBalanceElement =
            document.getElementById(
                "budgetBalance"
            );

        if (budgetBalanceElement) {

            budgetBalanceElement.textContent =
                "UGX " +
                Number(
                    data.budget_balance || 0
                ).toLocaleString();

        }


        // ==================================================
        // DEPARTMENT BUDGET
        // ==================================================

        const departmentBudgetElement =
            document.getElementById(
                "departmentBudget"
            );

        if (departmentBudgetElement) {

            departmentBudgetElement.textContent =
                "UGX " +
                Number(
                    data.department_budget || 0
                ).toLocaleString();

        }


        // ==================================================
        // OPTIONAL: DISPLAY DEPARTMENT NAME
        // ==================================================

        console.log(
            "Department:",
            data.department_name
        );

        console.log(
            "Department ID:",
            data.department_id
        );

    }

    catch (error) {

        console.error(
            "Failed to load HOD Budget Summary:",
            error
        );

    }

}


// ================================================
// RECENT DOCUMENTS
// ================================================
// ==========================================================
// LOAD RECENT DOCUMENTS
// ==========================================================

function loadRecentDocuments() {

    fetch("/hod/recent_documents")

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "HTTP Error: " + response.status
                );

            }

            return response.json();

        })

        .then(data => {

            const pendingBody = document.getElementById("pendingApprovalTable");
            const recentBody = document.getElementById("recentRequisitionTable");

            const docs = Array.isArray(data) ? data : [];

            const formatDate = (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return isNaN(date.getTime())
                    ? "-"
                    : date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    });
            };

            const formatStatus = (value) => {
                return (value || "PENDING").toUpperCase();
            };

            if (pendingBody) {
                pendingBody.innerHTML = "";

                const pendingDocs = docs.filter(doc => {
                    const status = formatStatus(doc.status);
                    return status === "PENDING" || status === "AWAITING";
                });

                if (pendingDocs.length === 0) {
                    pendingBody.innerHTML = `
                        <tr><td colspan="5" style="text-align:center;">No pending approvals.</td></tr>
                    `;
                } else {
                    pendingDocs.slice(0, 8).forEach(doc => {
                        pendingBody.innerHTML += `
                            <tr>
                                <td>${doc.document_no || doc.prs_no || "-"}</td>
                                <td>${doc.department || "-"}</td>
                                <td>${doc.requested_by || doc.user || doc.created_by || "-"}</td>
                                <td>${formatDate(doc.date || doc.created_at || doc.submission_date)}</td>
                                <td>${formatStatus(doc.status)}</td>
                            </tr>
                        `;
                    });
                }
            }

            if (recentBody) {
                recentBody.innerHTML = "";

                if (docs.length === 0) {
                    recentBody.innerHTML = `
                        <tr><td colspan="5" style="text-align:center;">No recent requisitions.</td></tr>
                    `;
                } else {
                    docs.slice(0, 8).forEach(doc => {
                        recentBody.innerHTML += `
                            <tr>
                                <td>${doc.document_no || doc.prs_no || "-"}</td>
                                <td>${doc.department || "-"}</td>
                                <td>${doc.requested_by || doc.user || doc.created_by || "-"}</td>
                                <td>${formatStatus(doc.status)}</td>
                                <td>${formatDate(doc.date || doc.created_at || doc.submission_date)}</td>
                            </tr>
                        `;
                    });
                }
            }

        })

        .catch(error => {

            console.error("Recent Documents Error:", error);

        });

}
// ================================================
// NOTIFICATIONS
// ================================================

function loadNotifications() {

    fetch("/hod/dashboard_notifications")

    .then(response => response.json())

    .then(data => {

        const box =
            document.getElementById("notificationBox");

        if (!box) return;

        box.innerHTML = "";

        data.forEach(n => {

            box.innerHTML += `

            <div class="notification">

                <div class="notification-icon">

                    🔔

                </div>

                <div>

                    <div class="notification-title">

                        ${n.title}

                    </div>

                    <div class="notification-text">

                        ${n.message}

                    </div>

                </div>

            </div>

            `;

        });

    })

    .catch(console.error);

}





/*****************************************************************
        DASHBOARD CHARTS
******************************************************************/

let monthlyChart = null;
let departmentChart = null;
let statusChart = null;
let supplierChart = null;
let spendingChart = null;


// =====================================================
// LOAD ALL CHARTS
// =====================================================

function loadCharts(){

    loadMonthlyChart();

    loadDepartmentChart();

    loadStatusChart();

    loadSupplierChart();

    loadSpendingChart();

}


// =====================================================
// MONTHLY APPROVALS
// =====================================================

function loadMonthlyChart(){

    fetch("/hod/dashboard/monthly")

    .then(res=>res.json())

    .then(data=>{

        const ctx = document.getElementById("monthlyRequisitionChart");

        if(!ctx) return;

        if(monthlyChart){ monthlyChart.destroy(); }

        monthlyChart = new Chart(ctx,{

            type:"bar",

            data:{

                labels:data.labels || [],

                datasets:[{

                    label:"Requisitions",
                    data:data.values || [],
                    borderWidth:1,
                    borderRadius:8,
                    backgroundColor:["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#2563eb"]

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ display:false } }

            }

        });

    })

    .catch(console.error);

}



// =====================================================
// DEPARTMENT REQUESTS
// =====================================================

function loadDepartmentChart(){

    fetch("/hod/dashboard/departments")

    .then(res=>res.json())

    .then(data=>{

        const ctx = document.getElementById("budgetChart");

        if(!ctx) return;

        if(departmentChart){ departmentChart.destroy(); }

        departmentChart = new Chart(ctx,{

            type:"bar",

            data:{

                labels:data.labels || [],

                datasets:[{

                    label:"Requests",
                    data:data.values || [],
                    backgroundColor:["#16a34a", "#3b82f6", "#f59e0b", "#9333ea", "#dc2626", "#06b6d4"]

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ display:false } }

            }

        });

    })

    .catch(console.error);

}



// =====================================================
// DOCUMENT STATUS
// =====================================================

function loadStatusChart(){

    fetch("/hod/dashboard/status")

    .then(res=>res.json())

    .then(data=>{

        const ctx = document.getElementById("approvalChart");

        if(!ctx) return;

        if(statusChart){ statusChart.destroy(); }

        statusChart = new Chart(ctx,{

            type:"doughnut",

            data:{

                labels:["Approved", "Pending", "Rejected"],

                datasets:[{

                    data:[data.approved || 0, data.pending || 0, data.rejected || 0],
                    backgroundColor:["#16a34a", "#f59e0b", "#dc2626"]

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false

            }

        });

    })

    .catch(console.error);

}



// =====================================================
// SUPPLIER PERFORMANCE
// =====================================================

function loadSupplierChart(){

    fetch("/hod/dashboard/suppliers")

    .then(res=>res.json())

    .then(data=>{

        const ctx = document.getElementById("materialChart");

        if(!ctx) return;

        if(supplierChart){ supplierChart.destroy(); }

        supplierChart = new Chart(ctx,{

            type:"line",

            data:{

                labels:data.labels || [],

                datasets:[{

                    label:"Orders",
                    data:data.values || [],
                    fill:false,
                    borderWidth:3,
                    tension:.4,
                    borderColor:"#2563eb",
                    backgroundColor:"#2563eb"

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false

            }

        });

    })

    .catch(console.error);

}

function loadSpendingChart(){

    fetch("/hod/dashboard/monthly")

    .then(res=>res.json())

    .then(data=>{

        const ctx = document.getElementById("spendingChart");

        if(!ctx) return;

        Chart.getChart(ctx)?.destroy();
        spendingChart = new Chart(ctx,{

            type:"line",

            data:{

                labels:data.labels || [],

                datasets:[{

                    label:"Spending",
                    data:(data.values || []).map(value => value * 120),
                    borderColor:"#9333ea",
                    backgroundColor:"rgba(147,51,234,0.2)",
                    borderWidth:2,
                    tension:.3,
                    fill:true

                }]

            },

            options:{

                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ display:false } }

            }

        });

    })

    .catch(console.error);

}



// =====================================================
// AUTO REFRESH
// =====================================================

setInterval(function(){

    loadDashboardSummary();

    loadRecentDocuments();

    loadNotifications();

    loadCharts();

},30000);


/*****************************************************************
        HOD DASHBOARD UTILITIES
******************************************************************/

// =====================================================
// SEARCH RECENT DOCUMENTS
// =====================================================

function searchDashboard() {

    const search =
        document.getElementById("dashboardSearch")
        ?.value
        .toLowerCase() || "";

    document
    .querySelectorAll("#recentDocuments tr")
    .forEach(row => {

        row.style.display =
            row.innerText
                .toLowerCase()
                .includes(search)
            ? ""
            : "none";

    });

}


// =====================================================
// REFRESH DASHBOARD
// =====================================================

function refreshDashboard() {

    loadDashboardSummary();

    loadRecentDocuments();

    loadNotifications();

    loadCharts();

    animateKPIs();

}


// =====================================================
// PRINT DASHBOARD
// =====================================================

function printDashboard() {

    window.print();

}


// =====================================================
// FULL SCREEN
// =====================================================

function toggleFullscreen() {

    if (!document.fullscreenElement) {

        document.documentElement.requestFullscreen();

    } else {

        document.exitFullscreen();

    }

}


// =====================================================
// DOWNLOAD CHART AS IMAGE
// =====================================================

function downloadChart(chartId, filename) {

    const canvas =
        document.getElementById(chartId);

    if (!canvas) {

        alert("Chart not found");

        return;

    }

    const link =
        document.createElement("a");

    link.download = filename;

    link.href =
        canvas.toDataURL("image/png");

    link.click();

}


// =====================================================
// EXPORT ALL CHARTS
// =====================================================

function exportCharts() {

    downloadChart(
        "monthlyChart",
        "Monthly_Approvals.png"
    );

    downloadChart(
        "departmentChart",
        "Departments.png"
    );

    downloadChart(
        "statusChart",
        "Status.png"
    );

    downloadChart(
        "supplierChart",
        "Suppliers.png"
    );

}


// =====================================================
// PROGRESS BAR ANIMATION
// =====================================================

function animateProgressBars() {

    document
        .querySelectorAll(".progress-bar")
        .forEach(bar => {

            const target =
                bar.dataset.value || 0;

            bar.style.width = "0%";

            setTimeout(() => {

                bar.style.width =
                    target + "%";

            }, 300);

        });

}


// =====================================================
// SHOW LOADING
// =====================================================

function showLoading() {

    const loader =
        document.getElementById("dashboardLoader");

    if (loader) {

        loader.style.display = "flex";

    }

}


// =====================================================
// HIDE LOADING
// =====================================================

function hideLoading() {

    const loader =
        document.getElementById("dashboardLoader");

    if (loader) {

        loader.style.display = "none";

    }

}


// =====================================================
// LIVE NOTIFICATION COUNT
// =====================================================

function updateNotificationCount() {

    fetch("/hod/dashboard_notifications")

    .then(res => res.json())

    .then(data => {

        const badge =
            document.getElementById("notificationCount");

        if (badge) {

            badge.innerText =
                data.length;

        }

    })

    .catch(console.error);

}


// =====================================================
// SCROLL TO TOP
// =====================================================

function scrollTopDashboard() {

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}


// =====================================================
// DARK MODE
// =====================================================

function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

}


// =====================================================
// INITIALIZE UTILITIES
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    animateProgressBars();

    updateNotificationCount();

});