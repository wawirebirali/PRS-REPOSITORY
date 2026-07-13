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
        document.getElementById("dashboardDate");

    if (element) {

        element.innerHTML =

            `
            <div>${date}</div>
            <small>${time}</small>
            `;

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

function loadDashboardSummary() {

    fetch("/hod/dashboard_summary")

    .then(response => response.json())

    .then(data => {

        document.getElementById("totalPRS").innerText =
            data.total_prs || 0;

        document.getElementById("pendingPRS").innerText =
            data.pending_prs || 0;

        document.getElementById("approvedPRS").innerText =
            data.approved_prs || 0;

        document.getElementById("rejectedPRS").innerText =
            data.rejected_prs || 0;

        animateKPIs();

    })

    .catch(error => {

        console.error(error);

    });

}


// ================================================
// RECENT DOCUMENTS
// ================================================

function loadRecentDocuments() {

    fetch("/hod/recent_documents")

    .then(response => response.json())

    .then(data => {

        const body =
            document.getElementById("recentDocuments");

        if (!body) return;

        body.innerHTML = "";

        data.forEach(doc => {

            body.innerHTML += `

            <tr>

                <td>${doc.document_no}</td>

                <td>${doc.department}</td>

                <td>

                    <span class="badge badge-info">

                        ${doc.module}

                    </span>

                </td>

                <td>

                    ${doc.status}

                </td>

                <td>

                    ${doc.date}

                </td>

            </tr>

            `;

        });

    })

    .catch(console.error);

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


// =====================================================
// LOAD ALL CHARTS
// =====================================================

function loadCharts(){

    loadMonthlyChart();

    loadDepartmentChart();

    loadStatusChart();

    loadSupplierChart();

}


// =====================================================
// MONTHLY APPROVALS
// =====================================================

function loadMonthlyChart(){

    fetch("/hod/dashboard/monthly")

    .then(res=>res.json())

    .then(data=>{

        const ctx =
        document.getElementById("monthlyChart");

        if(!ctx) return;

        if(monthlyChart){

            monthlyChart.destroy();

        }

        monthlyChart =
        new Chart(ctx,{

            type:"bar",

            data:{

                labels:data.labels,

                datasets:[{

                    label:"Documents",

                    data:data.values,

                    borderWidth:1,

                    borderRadius:8,

                    backgroundColor:[
                        "#2563eb",
                        "#3b82f6",
                        "#60a5fa",
                        "#93c5fd",
                        "#1d4ed8",
                        "#2563eb",
                        "#60a5fa",
                        "#3b82f6",
                        "#2563eb",
                        "#93c5fd",
                        "#60a5fa",
                        "#2563eb"
                    ]

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    }

                }

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

        const ctx =
        document.getElementById("departmentChart");

        if(!ctx) return;

        if(departmentChart){

            departmentChart.destroy();

        }

        departmentChart =
        new Chart(ctx,{

            type:"pie",

            data:{

                labels:data.labels,

                datasets:[{

                    data:data.values,

                    backgroundColor:[

                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#9333ea",
                        "#dc2626",
                        "#06b6d4"

                    ]

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
// DOCUMENT STATUS
// =====================================================

function loadStatusChart(){

    fetch("/hod/dashboard/status")

    .then(res=>res.json())

    .then(data=>{

        const ctx =
        document.getElementById("statusChart");

        if(!ctx) return;

        if(statusChart){

            statusChart.destroy();

        }

        statusChart =
        new Chart(ctx,{

            type:"doughnut",

            data:{

                labels:[

                    "Approved",
                    "Pending",
                    "Rejected"

                ],

                datasets:[{

                    data:[

                        data.approved,
                        data.pending,
                        data.rejected

                    ],

                    backgroundColor:[

                        "#16a34a",
                        "#f59e0b",
                        "#dc2626"

                    ]

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

        const ctx =
        document.getElementById("supplierChart");

        if(!ctx) return;

        if(supplierChart){

            supplierChart.destroy();

        }

        supplierChart =
        new Chart(ctx,{

            type:"line",

            data:{

                labels:data.labels,

                datasets:[{

                    label:"Orders",

                    data:data.values,

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