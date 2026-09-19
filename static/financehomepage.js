/* =====================================================
        FINANCE DASHBOARD JAVASCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
            LOAD DATE DEFAULTS
    ===================================================== */

    const today = new Date();

    const firstDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const dateInputs = document.querySelectorAll(
        "#financeDashboard input[type='date']"
    );

    if (dateInputs.length >= 2) {

        dateInputs[0].value =
            firstDay.toISOString().split("T")[0];

        dateInputs[1].value =
            today.toISOString().split("T")[0];
    }


    /* =====================================================
            CHART DEFAULT OPTIONS
    ===================================================== */

    if (typeof Chart !== "undefined") {

        Chart.defaults.font.family =
            "Segoe UI, Arial";

        Chart.defaults.plugins.legend.position =
            "bottom";
    }


    /* =====================================================
            INITIALIZE EMPTY CHARTS
    ===================================================== */

    initializeFinanceCharts();


    /* =====================================================
            LOAD FINANCE DATA
    ===================================================== */

    loadFinanceFilters();
    loadFinanceData();


    /* =====================================================
            REFRESH BUTTON
    ===================================================== */

    const refreshBtn = document.querySelector(
        "#financeDashboard .quick-btn.green"
    );

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                loadFinanceData();

            }
        );
    }


    /* =====================================================
            EXPORT BUTTON
    ===================================================== */

    const exportBtn = document.querySelector(
        "#financeDashboard .quick-btn.blue"
    );

    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                exportFinanceReport();

            }
        );
    }

});


async function loadFinanceFilters() {
    const departmentSelect = document.getElementById("financeDepartment");
    const yearSelect = document.getElementById("financeYear");

    try {
        const response = await fetch("/finance/api/dashboard/departments");
        const data = await response.json();

        if (data.success && departmentSelect) {
            data.departments.forEach(department => {
                const option = document.createElement("option");
                option.value = department.department_id;
                option.textContent = department.department_name;
                departmentSelect.appendChild(option);
            });
        }

        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= currentYear - 4; year -= 1) {
                const option = document.createElement("option");
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
        }

        [departmentSelect, yearSelect].forEach(select => {
            select?.addEventListener("change", loadFinanceData);
        });
        document.querySelectorAll("#financeDashboard input[type='date']")
            .forEach(input => input.addEventListener("change", loadFinanceData));
    } catch (error) {
        console.error("Finance filter loading error:", error);
    }
}


/* =====================================================
        CHART VARIABLES
===================================================== */

let financeCashFlowChart = null;
let financeBudgetChart = null;
let supplierPaymentChart = null;
let departmentExpenseChart = null;


/* =====================================================
        INITIALIZE EMPTY FINANCE CHARTS
===================================================== */

function initializeFinanceCharts() {

    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js is not loaded."
        );

        return;
    }


    /* =================================================
            MONTHLY CASH FLOW
    ================================================= */

    const cashFlowCanvas =
        document.getElementById(
            "financeCashFlow"
        );


    if (cashFlowCanvas) {

        financeCashFlowChart =
            new Chart(
                cashFlowCanvas,
                {

                    type: "line",

                    data: {

                        labels: [],

                        datasets: [

                            {
                                label: "Income",
                                data: [],
                                borderWidth: 3,
                                fill: false
                            },

                            {
                                label: "Expenses",
                                data: [],
                                borderWidth: 3,
                                fill: false
                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        layout: {
                            padding: 8
                        },

                        plugins: {

                            legend: {
                                display: true
                            }

                        }

                    }

                }
            );
    }


    /* =================================================
            BUDGET VS ACTUAL
    ================================================= */

    const budgetCanvas =
        document.getElementById(
            "financeBudgetChart"
        );


    if (budgetCanvas) {

        financeBudgetChart =
            new Chart(
                budgetCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [],

                        datasets: [

                            {
                                label: "Budget",
                                data: [],
                                borderWidth: 1
                            },

                            {
                                label: "Spent",
                                data: [],
                                borderWidth: 1
                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        layout: {
                            padding: 8
                        }

                    }

                }
            );
    }


    /* =================================================
            SUPPLIER PAYMENTS
    ================================================= */

    const supplierCanvas =
        document.getElementById(
            "supplierPaymentChart"
        );


    if (supplierCanvas) {

        supplierPaymentChart =
            new Chart(
                supplierCanvas,
                {

                    type: "doughnut",

                    data: {

                        labels: [],

                        datasets: [

                            {
                                data: [],
                                borderWidth: 1
                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        layout: {
                            padding: 8
                        }

                    }

                }
            );
    }


    /* =================================================
            DEPARTMENT EXPENSES
    ================================================= */

    const departmentCanvas =
        document.getElementById(
            "departmentExpenseChart"
        );


    if (departmentCanvas) {

        departmentExpenseChart =
            new Chart(
                departmentCanvas,
                {

                    type: "pie",

                    data: {

                        labels: [],

                        datasets: [

                            {
                                data: [],
                                borderWidth: 1
                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        layout: {
                            padding: 8
                        }

                    }

                }
            );
    }

}


/* =====================================================
        LOAD FINANCE DATA
===================================================== */

async function loadFinanceData() {

    try {

        const departmentSelect =
            document.querySelector(
                "#financeDashboard #financeDepartment"
            );


        const yearSelect =
            document.querySelector(
                "#financeDashboard #financeYear"
            );


        const dates =
            document.querySelectorAll(
                "#financeDashboard input[type='date']"
            );


        const department =
            departmentSelect
                ? departmentSelect.value
                : "";


        const year =
            yearSelect
                ? yearSelect.value
                : "";


        let startDate =
            dates.length >= 1
                ? dates[0].value
                : "";


        let endDate =
            dates.length >= 2
                ? dates[1].value
                : "";

        if (year) {
            startDate = `${year}-01-01`;
            endDate = `${year}-12-31`;
        }


        console.log(
            "Loading finance dashboard:",
            {
                department,
                year,
                startDate,
                endDate
            }
        );


        /* =================================================
                SHOW LOADING STATE
        ================================================= */

        setFinanceLoadingState();


        /* =================================================
                CALL FLASK API
        ================================================= */

        const response = await fetch(
            "/finance/api/dashboard",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    department: department,

                    year: year,

                    start: startDate,

                    end: endDate

                })

            }
        );


        if (!response.ok) {

            throw new Error(
                "Finance API failed: " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "Finance API response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Finance dashboard request failed."
            );
        }


        /* =================================================
                UPDATE DASHBOARD
        ================================================= */

        updateFinanceCards(data);

        updateBudgetUtilization(data);

        updatePaymentWorkflow(data);

        updatePendingPayments(data);

        updateRecentTransactions(data);

        updateFinanceCharts(data);


    }
    catch (error) {

        console.error(
            "FINANCE DASHBOARD ERROR:",
            error
        );


        clearFinanceDashboard();


        console.error(
            "Unable to load finance dashboard data."
        );
    }

}


/* =====================================================
        LOADING STATE
===================================================== */

function setFinanceLoadingState() {

    const ids = [

        "availableCash",
        "totalBudget",
        "budgetUsed",
        "pendingPayments",
        "outstandingDebt",
        "paidInvoices"

    ];


    ids.forEach(function (id) {

        const element =
            document.getElementById(id);


        if (element) {

            if (
                id === "pendingPayments" ||
                id === "paidInvoices"
            ) {

                element.textContent = "0";

            }
            else {

                element.textContent =
                    "UGX 0";
            }

        }

    });

}


/* =====================================================
        CLEAR DASHBOARD
===================================================== */

function clearFinanceDashboard() {

    const ids = [

        "availableCash",
        "totalBudget",
        "budgetUsed",
        "outstandingDebt"

    ];


    ids.forEach(function (id) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                "UGX 0";
        }

    });


    const countIds = [

        "pendingPayments",
        "paidInvoices"

    ];


    countIds.forEach(function (id) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent = "0";
        }

    });


    const containers = [

        "budgetUtilizationContainer",
        "paymentWorkflowBody",
        "pendingPaymentsBody",
        "recentTransactionsBody"

    ];


    containers.forEach(function (id) {

        const element =
            document.getElementById(id);


        if (element) {

            element.innerHTML = "";
        }

    });


    clearFinanceCharts();

}


/* =====================================================
        UPDATE KPI CARDS
===================================================== */

function updateFinanceCards(data) {

    const finance =
        data.finance || data;


    setText(
        "availableCash",
        formatCurrency(
            finance.cash ??
            finance.available_cash ??
            0
        )
    );


    setText(
        "totalBudget",
        formatCurrency(
            finance.budget ??
            finance.total_budget ??
            0
        )
    );


    setText(
        "budgetUsed",
        formatCurrency(
            finance.used ??
            finance.budget_used ??
            finance.amount_spent ??
            0
        )
    );


    setText(
        "pendingPayments",
        finance.pending ??
        finance.pending_payments ??
        0
    );


    setText(
        "outstandingDebt",
        formatCurrency(
            finance.debt ??
            finance.outstanding_debt ??
            0
        )
    );


    setText(
        "paidInvoices",
        finance.paid ??
        finance.paid_invoices ??
        0
    );

}


/* =====================================================
        BUDGET UTILIZATION
===================================================== */

function updateBudgetUtilization(data) {

    const container =
        document.getElementById(
            "budgetUtilizationContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const budgets =
        data.budget_utilization ||
        data.budgets ||
        [];


    if (!Array.isArray(budgets) ||
        budgets.length === 0) {

        return;
    }


    budgets.forEach(function (budget) {

        const budgetAmount =
            Number(
                budget.budget ??
                budget.budget_amount ??
                0
            );


        const spent =
            Number(
                budget.spent ??
                budget.amount_spent ??
                0
            );


        let percentage = 0;


        if (budgetAmount > 0) {

            percentage =
                (spent / budgetAmount) * 100;
        }


        percentage =
            Math.min(
                Math.max(
                    percentage,
                    0
                ),
                100
            );


        const row =
            document.createElement("div");


        row.className =
            "progress-item";


        row.innerHTML = `

            <span>
                ${escapeHtml(
                    budget.department_name ||
                    budget.department ||
                    budget.budget_item ||
                    ""
                )}
            </span>

            <div class="progress">

                <span
                    style="width:${percentage}%"
                ></span>

            </div>

            <b>
                ${percentage.toFixed(1)}%
            </b>

        `;


        container.appendChild(row);

    });

}


/* =====================================================
        PAYMENT WORKFLOW
===================================================== */

function updatePaymentWorkflow(data) {

    const tbody =
        document.getElementById(
            "paymentWorkflowBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const workflow =
        data.payment_workflow ||
        data.workflow ||
        [];


    if (!Array.isArray(workflow) ||
        workflow.length === 0) {

        return;
    }


    workflow.forEach(function (item) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(
                    item.status || ""
                )}
            </td>

            <td>
                ${item.total ?? 0}
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =====================================================
        PENDING PAYMENTS
===================================================== */

function updatePendingPayments(data) {

    const tbody =
        document.getElementById(
            "pendingPaymentsBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const payments =
        data.pending_payment_list ||
        data.pending_payments_list ||
        data.pending_payments ||
        [];


    if (!Array.isArray(payments) ||
        payments.length === 0) {

        return;
    }


    payments.forEach(function (payment) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(
                    payment.supplier ||
                    ""
                )}
            </td>

            <td>
                ${formatCurrency(
                    payment.amount || 0
                )}
            </td>

            <td>

                <span class="badge badge-warning">
                    ${escapeHtml(
                        payment.status ||
                        "Pending"
                    )}
                </span>

            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =====================================================
        RECENT TRANSACTIONS
===================================================== */

function updateRecentTransactions(data) {

    const tbody =
        document.getElementById(
            "recentTransactionsBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const transactions =
        data.recent_transactions ||
        [];


    if (!Array.isArray(transactions) ||
        transactions.length === 0) {

        return;
    }


    transactions.forEach(function (transaction) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(
                    transaction.reference ||
                    transaction.payment_no ||
                    transaction.invoice_no ||
                    ""
                )}
            </td>

            <td>
                ${formatCurrency(
                    transaction.amount || 0
                )}
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =====================================================
        UPDATE CHARTS
===================================================== */

function updateFinanceCharts(data) {

    updateCashFlowChart(
        data.cash_flow ||
        data.monthly_cash_flow ||
        []
    );


    updateBudgetChart(
        data.budget_vs_actual ||
        data.budget_utilization ||
        []
    );


    updateSupplierChart(
        data.supplier_payments ||
        []
    );


    updateDepartmentChart(
        data.department_expenses ||
        []
    );

}


/* =====================================================
        CASH FLOW CHART
===================================================== */

function updateCashFlowChart(data) {

    if (!financeCashFlowChart) {
        return;
    }


    if (!Array.isArray(data)) {
        return;
    }


    financeCashFlowChart.data.labels =
        data.map(function (item) {

            return item.month || "";

        });


    financeCashFlowChart.data.datasets[0].data =
        data.map(function (item) {

            return Number(
                item.income || 0
            );

        });


    financeCashFlowChart.data.datasets[1].data =
        data.map(function (item) {

            return Number(
                item.expenses || 0
            );

        });


    financeCashFlowChart.update();

}


/* =====================================================
        BUDGET VS ACTUAL CHART
===================================================== */

function updateBudgetChart(data) {

    if (!financeBudgetChart) {
        return;
    }


    if (!Array.isArray(data)) {
        return;
    }


    financeBudgetChart.data.labels =
        data.map(function (item) {

            return (
                item.department ||
                item.department_name ||
                item.budget_item ||
                ""
            );

        });


    financeBudgetChart.data.datasets[0].data =
        data.map(function (item) {

            return Number(
                item.budget ||
                item.budget_amount ||
                0
            );

        });


    financeBudgetChart.data.datasets[1].data =
        data.map(function (item) {

            return Number(
                item.spent ||
                item.amount_spent ||
                0
            );

        });


    financeBudgetChart.update();

}


/* =====================================================
        SUPPLIER PAYMENT CHART
===================================================== */

function updateSupplierChart(data) {

    if (!supplierPaymentChart) {
        return;
    }


    if (!Array.isArray(data)) {
        return;
    }


    supplierPaymentChart.data.labels =
        data.map(function (item) {

            return item.status || "";

        });


    supplierPaymentChart.data.datasets[0].data =
        data.map(function (item) {

            return Number(
                item.total ||
                item.amount ||
                0
            );

        });


    supplierPaymentChart.update();

}


/* =====================================================
        DEPARTMENT EXPENSE CHART
===================================================== */

function updateDepartmentChart(data) {

    if (!departmentExpenseChart) {
        return;
    }


    if (!Array.isArray(data)) {
        return;
    }


    departmentExpenseChart.data.labels =
        data.map(function (item) {

            return (
                item.department ||
                item.department_name ||
                ""
            );

        });


    departmentExpenseChart.data.datasets[0].data =
        data.map(function (item) {

            return Number(
                item.amount ||
                item.expense ||
                item.amount_spent ||
                0
            );

        });


    departmentExpenseChart.update();

}


/* =====================================================
        CLEAR CHARTS
===================================================== */

function clearFinanceCharts() {

    if (financeCashFlowChart) {

        financeCashFlowChart.data.labels = [];

        financeCashFlowChart.data.datasets
            .forEach(function (dataset) {

                dataset.data = [];

            });

        financeCashFlowChart.update();
    }


    if (financeBudgetChart) {

        financeBudgetChart.data.labels = [];

        financeBudgetChart.data.datasets
            .forEach(function (dataset) {

                dataset.data = [];

            });

        financeBudgetChart.update();
    }


    if (supplierPaymentChart) {

        supplierPaymentChart.data.labels = [];

        supplierPaymentChart.data.datasets[0].data = [];

        supplierPaymentChart.update();
    }


    if (departmentExpenseChart) {

        departmentExpenseChart.data.labels = [];

        departmentExpenseChart.data.datasets[0].data = [];

        departmentExpenseChart.update();
    }

}


/* =====================================================
        FORMAT CURRENCY
===================================================== */

function formatCurrency(value) {

    const amount =
        Number(value) || 0;


    return "UGX " +
        amount.toLocaleString(
            "en-UG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


/* =====================================================
        SET TEXT
===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    }

}


/* =====================================================
        ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
        EXPORT REPORT
===================================================== */

function exportFinanceReport() {

    const dashboard =
        document.getElementById(
            "financeDashboard"
        );


    if (!dashboard) {

        console.error(
            "Finance dashboard element not found."
        );

        return;
    }


    if (typeof html2pdf === "undefined") {

        console.error(
            "html2pdf library is not loaded."
        );

        return;
    }


    html2pdf()
        .from(dashboard)
        .save(
            "Finance_Dashboard_Report.pdf"
        );

}