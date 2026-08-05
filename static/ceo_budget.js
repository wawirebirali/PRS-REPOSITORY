// ==========================================================
// CEO BUDGET MANAGEMENT - COMPLETE JAVASCRIPT
// ==========================================================


// ==========================================================
// GLOBAL SELECTED BUDGET VARIABLES
// ==========================================================

window.selectedCompanyBudget = null;

window.selectedCompanyBudgetId = null;

window.selectedDepartmentBudget = null;

window.departmentBudgets = [];



window.openCompanyBudgetApproval = function (budget) {

    console.log(
        "Opening Company Budget Approval:",
        budget
    );

    if (!budget) {

        alert(
            "Company budget information is missing."
        );

        return;
    }

    if (!budget.company_budget_id) {

        alert(
            "Company budget ID is missing."
        );

        return;
    }

    // Save selected company budget
    window.selectedCompanyBudget =
        budget;

    console.log(
        "Selected Company Budget:",
        budget.company_budget_id
    );


    // Hide company budget table
    const companyBudgetTable =
        document.getElementById(
            "companyBudgetTable"
        );

    if (companyBudgetTable) {

        companyBudgetTable.style.display =
            "none";

    }


    // Get approval panel
    const approvalPanel =
        document.getElementById(
            "budgetApprovalTab"
        );

    if (!approvalPanel) {

        console.error(
            "budgetApprovalTab was not found."
        );

        return;
    }


    // Fill budget number
    const approvalBudgetNo =
        document.getElementById(
            "approvalBudgetNo"
        );

    if (approvalBudgetNo) {

        approvalBudgetNo.textContent =
            budget.budget_no || "-";

    }


    // Fill financial year
    const approvalFinancialYear =
        document.getElementById(
            "approvalFinancialYear"
        );

    if (approvalFinancialYear) {

        approvalFinancialYear.textContent =
            budget.financial_year || "-";

    }


    // Fill budget type
    const approvalBudgetType =
        document.getElementById(
            "approvalBudgetType"
        );

    if (approvalBudgetType) {

        approvalBudgetType.textContent =
            budget.budget_type || "-";

    }


    // Fill allocated amount
    const approvalAmount =
        document.getElementById(
            "approvalAmount"
        );

    if (approvalAmount) {

        const amount =
            budget.allocated_amount ??
            budget.total_budget ??
            0;

        approvalAmount.textContent =
            "UGX " +
            formatCurrency(amount);

    }


    // Fill start date
    const approvalStartDate =
        document.getElementById(
            "approvalStartDate"
        );

    if (approvalStartDate) {

        approvalStartDate.textContent =
            budget.start_date
                ? formatDate(
                    budget.start_date
                )
                : "-";

    }


    // Fill end date
    const approvalEndDate =
        document.getElementById(
            "approvalEndDate"
        );

    if (approvalEndDate) {

        approvalEndDate.textContent =
            budget.end_date
                ? formatDate(
                    budget.end_date
                )
                : "-";

    }


    // Fill remarks
    const approvalRemarks =
        document.getElementById(
            "approvalRemarks"
        );

    if (approvalRemarks) {

        approvalRemarks.textContent =
            budget.remarks || "-";

    }


    // Fill status
    const approvalStatus =
        document.getElementById(
            "approvalStatus"
        );

    if (approvalStatus) {

        approvalStatus.textContent =
            budget.ceo_status ||
            "Pending";

    }


    // Fill approval date
    const approvalDate =
        document.getElementById(
            "approvalDate"
        );

    if (approvalDate) {

        approvalDate.textContent =
            budget.ceo_approval_date
                ? formatDateTime(
                    budget.ceo_approval_date
                )
                : "-";

    }


    // Change title
    const approvalTitle =
        approvalPanel.querySelector(
            ".predict-header h2"
        );

    if (approvalTitle) {

        approvalTitle.textContent =
            "Company Budget Approval";

    }


    // Show panel
    approvalPanel.style.display =
        "block";


    // Scroll to panel
    approvalPanel.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

};


// ==========================================================
// FORMAT CURRENCY
// ==========================================================

function formatCurrency(amount) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {

        return "0";

    }

    const number =
        Number(amount);

    if (isNaN(number)) {

        return "0";

    }

    return number.toLocaleString(
        "en-UG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


// ==========================================================
// FORMAT DATE
// ==========================================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "-";

    }

    const normalizedDate =
        String(dateValue).replace(
            " ",
            "T"
        );

    const date =
        new Date(normalizedDate);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ==========================================================
// FORMAT DATE AND TIME
// ==========================================================

function formatDateTime(dateTime) {

    if (!dateTime) {

        return "-";

    }

    const normalizedDateTime =
        String(dateTime).replace(
            " ",
            "T"
        );

    const date =
        new Date(
            normalizedDateTime
        );

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }

    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

}


// ==========================================================
// LOAD COMPANY BUDGETS
// ==========================================================

async function loadCompanyBudgets() {

    console.log(
        "Loading Company Budgets..."
    );


    const budgetBody =
        document.getElementById(
            "companyBudgetBody"
        );


    if (!budgetBody) {

        console.error(
            "companyBudgetBody was not found."
        );

        return;

    }


    // ======================================================
    // SHOW LOADING
    // ======================================================

    budgetBody.innerHTML = `

        <tr>

            <td
                colspan="15"
                style="text-align:center;">

                Loading company budgets...

            </td>

        </tr>

    `;


    try {

        // ==================================================
        // CALL API
        // ==================================================

        const response =
            await fetch(
                "/ceo/api/company-budgets",
                {

                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        console.log(
            "Company Budgets HTTP Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // ==================================================
        // READ JSON
        // ==================================================

        const result =
            await response.json();


        console.log(
            "Company Budgets Response:",
            result
        );


        if (!result.success) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="15"
                        style="text-align:center;">

                        ${
                            result.message ||
                            "Failed to load company budgets."
                        }

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // SAVE COMPANY BUDGETS
        // ==================================================

        const companyBudgets =
            result.data || [];


        // ==================================================
        // CHECK EMPTY
        // ==================================================

        if (
            companyBudgets.length === 0
        ) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="15"
                        style="text-align:center;">

                        No company budgets found.

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // CLEAR TABLE
        // ==================================================

        budgetBody.innerHTML = "";


        // ==================================================
        // DISPLAY COMPANY BUDGETS
        // ==================================================

        companyBudgets.forEach(
            function(budget) {

                const row =
                    document.createElement(
                        "tr"
                    );


                // ==========================================
                // STORE COMPANY BUDGET ID
                // ==========================================

                row.dataset.companyBudgetId =
                    budget.company_budget_id;


                row.style.cursor =
                    "pointer";


                // ==========================================
                // CREATE ROW
                // ==========================================

                row.innerHTML = `

                    <td>
                        ${
                            budget.budget_no ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.financial_year ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.budget_type ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.department_name ||
                            "-"
                        }
                    </td>

                    <td>
                        UGX
                        ${
                            formatCurrency(
                                budget.allocated_amount ||
                                budget.total_budget ||
                                0
                            )
                        }
                    </td>

                    <td>
                        ${
                            budget.ceo_status ||
                            "Pending"
                        }
                    </td>

                    <td>
                        ${
                            budget.ceo_approval_date
                                ? formatDateTime(
                                    budget.ceo_approval_date
                                )
                                : "-"
                        }
                    </td>

                `;


                // ==========================================
                // CLICK COMPANY BUDGET ROW
                // ==========================================

                row.addEventListener(
                    "click",
                    function() {

                        console.log(
                            "Selected Company Budget:",
                            budget
                        );


                        console.log(
                            "Company Budget ID:",
                            budget.company_budget_id
                        );


                        // ==================================
                        // SAVE SELECTED COMPANY BUDGET
                        // ==================================

                        window.selectedCompanyBudget =
                            budget;


                        window.selectedCompanyBudgetId =
                            budget.company_budget_id;


                        // ==================================
                        // OPEN DEPARTMENT BUDGETS
                        // ==================================

                        window.openDepartmentBudgetsForCompany(
                            budget.company_budget_id
                        );

                    }
                );


                budgetBody.appendChild(
                    row
                );

            }
        );


        console.log(
            companyBudgets.length +
            " company budget(s) loaded."
        );

    }


    catch(error) {

        console.error(
            "Load Company Budgets Error:",
            error
        );


        budgetBody.innerHTML = `

            <tr>

                <td
                    colspan="15"
                    style="text-align:center;">

                    Failed to load company budgets.

                </td>

            </tr>

        `;

    }

}


// ==========================================================
// OPEN DEPARTMENT BUDGETS FOR COMPANY
// ==========================================================

window.openDepartmentBudgetsForCompany =
async function(
    companyBudgetId
) {

    console.log(
        "Opening Department Budgets for Company Budget ID:",
        companyBudgetId
    );


    // ======================================================
    // CHECK COMPANY BUDGET ID
    // ======================================================

    if (!companyBudgetId) {

        alert(
            "Company Budget ID is missing."
        );

        console.error(
            "Company Budget ID is missing."
        );

        return;

    }


    // ======================================================
    // SAVE COMPANY BUDGET ID
    // ======================================================

    window.selectedCompanyBudgetId =
        companyBudgetId;


    // ======================================================
    // HIDE COMPANY BUDGET TABLE
    // ======================================================

    const companyBudgetTable =
        document.getElementById(
            "companyBudgetTable"
        );


    if (companyBudgetTable) {

        companyBudgetTable.style.display =
            "none";

    }


    // ======================================================
    // GET DEPARTMENT BUDGET PANEL
    // ======================================================

    const departmentBudgetTab =
        document.getElementById(
            "departmentBudgetTab"
        );


    if (!departmentBudgetTab) {

        console.error(
            "departmentBudgetTab was not found."
        );

        return;

    }


    // ======================================================
    // SHOW DEPARTMENT BUDGET PANEL
    // ======================================================

    departmentBudgetTab.style.display =
        "block";


    // ======================================================
    // LOAD DEPARTMENT BUDGETS
    // ======================================================

    await loadDepartmentBudgetsForCompany(
        companyBudgetId
    );


    // ======================================================
    // SCROLL TO PANEL
    // ======================================================

    departmentBudgetTab.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

};


// ==========================================================
// LOAD DEPARTMENT BUDGETS FOR COMPANY
// ==========================================================

async function loadDepartmentBudgetsForCompany(
    companyBudgetId
) {

    console.log(
        "Loading department budgets for company:",
        companyBudgetId
    );


    const budgetBody =
        document.getElementById(
            "departmentBudgetBody"
        );


    if (!budgetBody) {

        console.error(
            "departmentBudgetBody was not found."
        );

        return;

    }


    // ======================================================
    // SHOW LOADING
    // ======================================================

    budgetBody.innerHTML = `

        <tr>

            <td
                colspan="15"
                style="text-align:center;">

                Loading department budgets...

            </td>

        </tr>

    `;


    try {

        // ==================================================
        // CALL API
        // ==================================================

        const response =
            await fetch(
                `/ceo/api/company-budget/${companyBudgetId}/department-budgets`,
                {

                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        console.log(
            "Department Budgets HTTP Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // ==================================================
        // READ JSON
        // ==================================================

        const result =
            await response.json();


        console.log(
            "Department Budgets Response:",
            result
        );


        if (!result.success) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="15"
                        style="text-align:center;">

                        ${
                            result.message ||
                            "Failed to load department budgets."
                        }

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // SAVE DEPARTMENT BUDGETS
        // ==================================================

        window.departmentBudgets =
            result.data || [];


        // ==================================================
        // CHECK EMPTY
        // ==================================================

        if (
            window.departmentBudgets.length === 0
        ) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="15"
                        style="text-align:center;">

                        No department budgets have been
                        created for this company budget.

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // CLEAR TABLE
        // ==================================================

        budgetBody.innerHTML = "";


        // ==================================================
        // DISPLAY DEPARTMENT BUDGETS
        // ==================================================

        window.departmentBudgets.forEach(
            function(budget) {

                const row =
                    document.createElement(
                        "tr"
                    );


                // ==========================================
                // STORE IDs
                // ==========================================

                row.dataset.departmentBudgetId =
                    budget.department_budget_id;


                row.dataset.companyBudgetId =
                    budget.company_budget_id;


                row.style.cursor =
                    "pointer";


                // ==========================================
                // CREATE ROW
                // ==========================================

                row.innerHTML = `

                    <td>
                        ${
                            budget.budget_no ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.department_name ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.budget_item ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.quantity ||
                            0
                        }
                    </td>

                    <td>
                        UGX
                        ${
                            formatCurrency(
                                budget.unit_cost ||
                                0
                            )
                        }
                    </td>

                    <td>
                        UGX
                        ${
                            formatCurrency(
                                budget.total_budget ||
                                0
                            )
                        }
                    </td>

                    <td>
                        ${
                            budget.budget_type ||
                            "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.start_date
                                ? formatDate(
                                    budget.start_date
                                )
                                : "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.end_date
                                ? formatDate(
                                    budget.end_date
                                )
                                : "-"
                        }
                    </td>

                    <td>
                        ${
                            budget.ceo_status ||
                            "Pending"
                        }
                    </td>

                    <td>
                        ${
                            budget.ceo_approval_date
                                ? formatDateTime(
                                    budget.ceo_approval_date
                                )
                                : "-"
                        }
                    </td>

                `;


                // ==========================================
                // CLICK DEPARTMENT BUDGET ROW
                // ==========================================

                row.addEventListener(
                    "click",
                    function() {

                        console.log(
                            "Selected Department Budget:",
                            budget
                        );


                        console.log(
                            "Department Budget ID:",
                            budget.department_budget_id
                        );


                        console.log(
                            "Company Budget ID:",
                            budget.company_budget_id
                        );


                        // ==================================
                        // SAVE SELECTED BUDGET
                        // ==================================

                        window.selectedDepartmentBudget =
                            budget;


                        // ==================================
                        // OPEN APPROVAL PANEL
                        // ==================================

                        window.openDepartmentBudgetApproval(
                            budget
                        );

                    }
                );


                budgetBody.appendChild(
                    row
                );

            }
        );


        console.log(
            window.departmentBudgets.length +
            " department budget(s) loaded."
        );

    }


    catch(error) {

        console.error(
            "Load Department Budgets Error:",
            error
        );


        budgetBody.innerHTML = `

            <tr>

                <td
                    colspan="15"
                    style="text-align:center;">

                    Failed to load department budgets.

                </td>

            </tr>

        `;

    }

}


// ==========================================================
// OPEN DEPARTMENT BUDGET APPROVAL PANEL
// ==========================================================

window.openDepartmentBudgetApproval =
function(
    budget
) {

    console.log(
        "Opening Department Budget Approval:",
        budget
    );


    // ======================================================
    // CHECK BUDGET
    // ======================================================

    if (!budget) {

        alert(
            "Department budget information is missing."
        );

        return;

    }


    // ======================================================
    // CHECK ID
    // ======================================================

    if (
        !budget.department_budget_id
    ) {

        alert(
            "Department budget ID is missing."
        );

        console.error(
            "Invalid Department Budget:",
            budget
        );

        return;

    }


    // ======================================================
    // SAVE SELECTED BUDGET
    // ======================================================

    window.selectedDepartmentBudget =
        budget;


    // ======================================================
    // GET APPROVAL PANEL
    // ======================================================

    const approvalPanel =
        document.getElementById(
            "departmentBudgetApprovalPanel"
        );


    if (!approvalPanel) {

        console.error(
            "departmentBudgetApprovalPanel was not found."
        );

        return;

    }


    // ======================================================
    // FILL BUDGET NUMBER
    // ======================================================

    const budgetNo =
        document.getElementById(
            "departmentApprovalBudgetNo"
        );


    if (budgetNo) {

        budgetNo.textContent =
            budget.budget_no || "-";

    }


    // ======================================================
    // FILL DEPARTMENT
    // ======================================================

    const department =
        document.getElementById(
            "departmentApprovalDepartment"
        );


    if (department) {

        department.textContent =
            budget.department_name || "-";

    }


    // ======================================================
    // FILL BUDGET ITEM
    // ======================================================

    const budgetItem =
        document.getElementById(
            "departmentApprovalBudgetItem"
        );


    if (budgetItem) {

        budgetItem.textContent =
            budget.budget_item || "-";

    }


    // ======================================================
    // FILL QUANTITY
    // ======================================================

    const quantity =
        document.getElementById(
            "departmentApprovalQuantity"
        );


    if (quantity) {

        quantity.textContent =
            budget.quantity || 0;

    }


    // ======================================================
    // FILL UNIT COST
    // ======================================================

    const unitCost =
        document.getElementById(
            "departmentApprovalUnitCost"
        );


    if (unitCost) {

        unitCost.textContent =
            "UGX " +
            formatCurrency(
                budget.unit_cost || 0
            );

    }


    // ======================================================
    // FILL TOTAL BUDGET
    // ======================================================

    const totalBudget =
        document.getElementById(
            "departmentApprovalAmount"
        );


    if (totalBudget) {

        totalBudget.textContent =
            "UGX " +
            formatCurrency(
                budget.total_budget || 0
            );

    }


    // ======================================================
    // FILL BUDGET TYPE
    // ======================================================

    const budgetType =
        document.getElementById(
            "departmentApprovalBudgetType"
        );


    if (budgetType) {

        budgetType.textContent =
            budget.budget_type || "-";

    }


    // ======================================================
    // FILL START DATE
    // ======================================================

    const startDate =
        document.getElementById(
            "departmentApprovalStartDate"
        );


    if (startDate) {

        startDate.textContent =
            budget.start_date
                ? formatDate(
                    budget.start_date
                )
                : "-";

    }


    // ======================================================
    // FILL END DATE
    // ======================================================

    const endDate =
        document.getElementById(
            "departmentApprovalEndDate"
        );


    if (endDate) {

        endDate.textContent =
            budget.end_date
                ? formatDate(
                    budget.end_date
                )
                : "-";

    }


    // ======================================================
    // FILL REMARKS
    // ======================================================

    const remarks =
        document.getElementById(
            "departmentApprovalRemarks"
        );


    if (remarks) {

        remarks.textContent =
            budget.remarks || "-";

    }


    // ======================================================
    // FILL CEO STATUS
    // ======================================================

    const status =
        document.getElementById(
            "departmentApprovalStatus"
        );


    if (status) {

        status.textContent =
            budget.ceo_status || "Pending";

    }


    // ======================================================
    // FILL CEO APPROVAL DATE
    // ======================================================

    const approvalDate =
        document.getElementById(
            "departmentApprovalDate"
        );


    if (approvalDate) {

        approvalDate.textContent =
            budget.ceo_approval_date
                ? formatDateTime(
                    budget.ceo_approval_date
                )
                : "-";

    }


    // ======================================================
    // SET PANEL TITLE
    // ======================================================

    const title =
        approvalPanel.querySelector(
            ".predict-header h2"
        );


    if (title) {

        title.textContent =
            "Department Budget Approval";

    }


    // ======================================================
    // SHOW PANEL
    // ======================================================

    approvalPanel.style.display =
        "block";


    // ======================================================
    // SCROLL TO PANEL
    // ======================================================

    approvalPanel.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });


    console.log(
        "Department Budget Approval Panel Opened."
    );

};


// ==========================================================
// APPROVE DEPARTMENT BUDGET
// ==========================================================

async function approveDepartmentBudget() {

    const budget =
        window.selectedDepartmentBudget;


    if (!budget) {

        alert(
            "Please select a department budget first."
        );

        return;

    }


    await updateDepartmentBudgetApproval(

        budget.department_budget_id,

        "Approved"

    );

}


// ==========================================================
// REJECT DEPARTMENT BUDGET
// ==========================================================

async function rejectDepartmentBudget() {

    const budget =
        window.selectedDepartmentBudget;


    if (!budget) {

        alert(
            "Please select a department budget first."
        );

        return;

    }


    await updateDepartmentBudgetApproval(

        budget.department_budget_id,

        "Rejected"

    );

}


// ==========================================================
// UPDATE DEPARTMENT BUDGET APPROVAL
// ==========================================================

async function updateDepartmentBudgetApproval(

    departmentBudgetId,

    status

) {

    try {

        console.log(
            "Updating Department Budget:",
            departmentBudgetId
        );


        console.log(
            "New CEO Status:",
            status
        );


        // ==================================================
        // CALL FLASK API
        // ==================================================

        const response =
            await fetch(

                `/ceo/api/department-budget/${departmentBudgetId}/approval`,

                {

                    method:
                        "PUT",

                    headers:
                        {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                    body:
                        JSON.stringify({

                            ceo_status:
                                status

                        })

                }

            );


        console.log(
            "Approval HTTP Status:",
            response.status
        );


        // ==================================================
        // READ RESPONSE
        // ==================================================

        const result =
            await response.json();


        console.log(
            "Approval Response:",
            result
        );


        // ==================================================
        // CHECK RESPONSE
        // ==================================================

        if (!result.success) {

            alert(

                result.message ||

                "Failed to update approval."

            );

            return;

        }


        // ==================================================
        // SUCCESS MESSAGE
        // ==================================================

        alert(

            result.message ||

            "Department budget approval updated successfully."

        );


        // ==================================================
        // UPDATE MEMORY
        // ==================================================

        if (
            window.selectedDepartmentBudget
        ) {

            window.selectedDepartmentBudget.ceo_status =
                result.ceo_status;


            window.selectedDepartmentBudget.ceo_approval_date =
                result.ceo_approval_date ||
                null;

        }


        // ==================================================
        // CLOSE APPROVAL PANEL
        // ==================================================

        const approvalPanel =
            document.getElementById(
                "departmentBudgetApprovalPanel"
            );


        if (approvalPanel) {

            approvalPanel.style.display =
                "none";

        }


        // ==================================================
        // SHOW DEPARTMENT BUDGET TAB
        // ==================================================

        const departmentBudgetTab =
            document.getElementById(
                "departmentBudgetTab"
            );


        if (departmentBudgetTab) {

            departmentBudgetTab.style.display =
                "block";

        }


        // ==================================================
        // RELOAD DEPARTMENT BUDGETS
        // ==================================================

        if (
            window.selectedCompanyBudgetId
        ) {

            await loadDepartmentBudgetsForCompany(

                window.selectedCompanyBudgetId

            );

        }

    }


    catch(error) {

        console.error(
            "Approval Update Error:",
            error
        );


        alert(
            "An error occurred while updating the approval."
        );

    }

}


// ==========================================================
// INITIALIZE CEO BUDGET MODULE
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "CEO Budget JavaScript Loaded."
        );

        // Uncomment this if you want company
        // budgets to load automatically.

        // loadCompanyBudgets();

    }
);

/* ==========================================================
        OPEN CREATE BUDGET PANEL
========================================================== */
/* ==========================================================
        OPEN CREATE BUDGET
========================================================== */

/* ==========================================================
        OPEN CREATE COMPANY BUDGET
========================================================== */

function openCreateBudget() {

    console.log(
        "Opening Create Company Budget..."
    );


    // ==========================================
    // CREATE BUDGET TAB
    // ==========================================

    const createBudgetTab =
        document.getElementById(
            "createBudgetTab"
        );


    // ==========================================
    // PREDICT BUDGET TAB
    // ==========================================

    const predictBudgetTab =
        document.getElementById(
            "predictBudgetTab"
        );


    // ==========================================
    // DEPARTMENT BUDGET TAB
    // ==========================================

    const departmentBudgetTab =
        document.getElementById(
            "departmentBudgetTab"
        );


    // ==========================================
    // APPROVAL TAB
    // ==========================================

    const budgetApprovalTab =
        document.getElementById(
            "budgetApprovalTab"
        );


    // ==========================================
    // MESSAGE
    // ==========================================

    const budgetMessage =
        document.getElementById(
            "budgetMessage"
        );


    // ==========================================
    // SHOW CREATE BUDGET
    // ==========================================

    if (createBudgetTab) {

        createBudgetTab.style.display =
            "block";

    } else {

        console.error(
            "ERROR: #createBudgetTab not found"
        );

    }


    // ==========================================
    // HIDE PREDICTION
    // ==========================================

    if (predictBudgetTab) {

        predictBudgetTab.style.display =
            "none";

    }


    // ==========================================
    // HIDE DEPARTMENT BUDGET
    // ==========================================

    if (departmentBudgetTab) {

        departmentBudgetTab.style.display =
            "none";

    }


    // ==========================================
    // HIDE APPROVAL
    // ==========================================

    if (budgetApprovalTab) {

        budgetApprovalTab.style.display =
            "none";

    }


    // ==========================================
    // CLEAR MESSAGE
    // ==========================================

    if (budgetMessage) {

        budgetMessage.innerHTML = "";

    }


    // ==========================================
    // LOAD DEPARTMENTS
    // ==========================================

    if (
        typeof loadCreateBudgetDepartments ===
        "function"
    ) {

        loadCreateBudgetDepartments();

    } else {

        console.error(
            "ERROR: loadCreateBudgetDepartments() not found"
        );

    }


    // ==========================================
    // GENERATE BUDGET NUMBER
    // ==========================================

    if (
        typeof generateBudgetNumber ===
        "function"
    ) {

        generateBudgetNumber();

    } else {

        console.error(
            "ERROR: generateBudgetNumber() not found"
        );

    }

}

/* ==========================================================
        CLOSE CREATE BUDGET PANEL
========================================================== */

function closeCreateBudget() {

    const createBudgetTab =
        document.getElementById(
            "createBudgetTab"
        );

    if (createBudgetTab) {

        createBudgetTab.style.display =
            "none";

    }

    clearBudgetForm();

}

/* ==========================================================
        GENERATE BUDGET NUMBER
========================================================== */
function generateBudgetNumber() {

    const budgetNoInput =
        document.getElementById("budgetNo");

    if (!budgetNoInput) {
        console.error(
            "budgetNo input not found"
        );
        return;
    }

    fetch("/ceo/api/budget/generate-number", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })

    .then(response => {

        console.log(
            "Budget Number HTTP Status:",
            response.status
        );

        if (!response.ok) {

            throw new Error(
                "Failed to generate budget number"
            );

        }

        return response.json();

    })

    .then(data => {

        console.log(
            "Budget Number Response:",
            data
        );

        if (data.success) {

            budgetNoInput.value =
                data.budget_no;

        } else {

            console.error(
                "Budget Number Error:",
                data.message
            );

        }

    })

    .catch(error => {

        console.error(
            "Budget Number Error:",
            error
        );

    });

}




/* ==========================================================
        LOAD DEPARTMENTS FOR CREATE BUDGET
========================================================== */
/* ==========================================================
        LOAD DEPARTMENTS FOR CREATE COMPANY BUDGET
========================================================== */

function loadCreateBudgetDepartments() {

    // Get Create Budget department dropdown
    const departmentSelect =
        document.getElementById(
            "createBudgetDepartment"
        );


    // Check if dropdown exists
    if (!departmentSelect) {

        console.error(
            "createBudgetDepartment select not found"
        );

        return;

    }


    // Show loading
    departmentSelect.innerHTML = `

        <option value="">
            Loading Departments...
        </option>

    `;


    // AJAX GET request
    fetch("/ceo/api/departments", {

        method: "GET",

        headers: {

            "Accept":
                "application/json"

        }

    })


    // Convert response to JSON
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }

        return response.json();

    })


    // Process JSON data
    .then(data => {

        console.log(
            "Departments Response:",
            data
        );


        // Clear dropdown
        departmentSelect.innerHTML = `

            <option value="">
                Select Department
            </option>

        `;


        // Check successful response
        if (
            data.success &&
            Array.isArray(data.data)
        ) {


            // Loop through departments
            data.data.forEach(
                department => {

                    // Create option
                    const option =
                        document.createElement(
                            "option"
                        );


                    // Set department ID
                    option.value =
                        department.department_id;


                    // Set department name
                    option.textContent =
                        department.department_name;


                    // Add option to select
                    departmentSelect.appendChild(
                        option
                    );

                }
            );


        } else {

            // No departments found
            departmentSelect.innerHTML = `

                <option value="">
                    No Departments Found
                </option>

            `;

        }

    })


    // Handle errors
    .catch(error => {

        console.error(
            "Department Loading Error:",
            error
        );


        departmentSelect.innerHTML = `

            <option value="">
                Failed to Load Departments
            </option>

        `;

    });

}

/* ==========================================================
        CREATE / SAVE COMPANY BUDGET
========================================================== */
/* ==========================================================
        SUBMIT COMPANY BUDGET
========================================================== */
function submitBudget() {

    // ==========================================
    // GET MESSAGE ELEMENT
    // ==========================================

    const message =
        document.getElementById("budgetMessage");


    // ==========================================
    // GET FORM VALUES
    // ==========================================

    const budgetNo =
        document.getElementById("budgetNo").value.trim();

    const financialYear =
        document.getElementById("financialYear").value;

    const departmentId =
        document.getElementById("createBudgetDepartment").value;

    const budgetAmount =
        document.getElementById("allocatedAmount").value;

    const budgetType =
        document.getElementById("budgetType").value;

    const startDate =
        document.getElementById("budgetStart").value;

    const endDate =
        document.getElementById("budgetEnd").value;

    const remarks =
        document.getElementById("budgetRemarks").value.trim();


    // ==========================================
    // CLEAR OLD MESSAGE
    // ==========================================

    message.innerHTML = "";


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!financialYear) {

        message.innerHTML =
            "Please select financial year.";

        return;
    }


    if (!departmentId) {

        message.innerHTML =
            "Please select department.";

        return;
    }


    if (
        !budgetAmount ||
        Number(budgetAmount) <= 0
    ) {

        message.innerHTML =
            "Please enter a valid budget amount.";

        return;
    }


    if (!budgetType) {

        message.innerHTML =
            "Please select budget type.";

        return;
    }


    if (!startDate) {

        message.innerHTML =
            "Please select start date.";

        return;
    }


    if (!endDate) {

        message.innerHTML =
            "Please select end date.";

        return;
    }


    if (endDate < startDate) {

        message.innerHTML =
            "End date cannot be before start date.";

        return;
    }


    // ==========================================
    // CREATE JSON DATA
    // ==========================================

    const budgetData = {

        budget_no:
            budgetNo,

        financial_year:
            financialYear,

        department_id:
            departmentId,

        allocated_amount:
            Number(budgetAmount),

        budget_type:
            budgetType,

        start_date:
            startDate,

        end_date:
            endDate,

        remarks:
            remarks
    };


    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
        "Sending Budget:",
        budgetData
    );


    // ==========================================
    // SHOW SAVING MESSAGE
    // ==========================================

    message.innerHTML =
        "Saving budget...";


    // ==========================================
    // GET SUBMIT BUTTON
    // ==========================================

    const submitButton =
        document.getElementById("submitBudgetBtn");


    // ==========================================
    // DISABLE SUBMIT BUTTON
    // ==========================================

    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
            "Saving...";

    }


    // ==========================================
    // AJAX POST REQUEST
    // ==========================================

    fetch(
        "/ceo/api/budget/create",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json"

            },

            body:
                JSON.stringify(
                    budgetData
                )

        }
    )


    // ==========================================
    // RECEIVE FLASK RESPONSE
    // ==========================================

    .then(response => {

        console.log(
            "Create Budget HTTP Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        return response.json();

    })


    // ==========================================
    // PROCESS FLASK RESPONSE
    // ==========================================

    .then(data => {

        console.log(
            "Create Budget Response:",
            data
        );


        // ==========================================
        // SUCCESSFUL SUBMISSION
        // ==========================================

        if (data.success) {

            console.log(
                "Company budget created successfully."
            );


            // ==========================================
            // SHOW SUCCESS MESSAGE
            // ==========================================

            message.innerHTML =
                data.message ||
                "Company budget created successfully.";


            // ==========================================
            // CLEAR FORM
            // ==========================================

            document.getElementById(
                "budgetNo"
            ).value = "";


            document.getElementById(
                "financialYear"
            ).value = "";


            document.getElementById(
                "createBudgetDepartment"
            ).value = "";


            document.getElementById(
                "allocatedAmount"
            ).value = "";


            document.getElementById(
                "budgetType"
            ).value = "";


            document.getElementById(
                "budgetStart"
            ).value = "";


            document.getElementById(
                "budgetEnd"
            ).value = "";


            document.getElementById(
                "budgetRemarks"
            ).value = "";


            // ==========================================
            // GENERATE NEW BUDGET NUMBER
            // ==========================================

            if (
                typeof generateBudgetNumber ===
                "function"
            ) {

                generateBudgetNumber();

            }


            // ==========================================
            // RELOAD COMPANY BUDGET TABLE
            // ==========================================

            if (
                typeof loadCompanyBudgets ===
                "function"
            ) {

                loadCompanyBudgets();

            }


            // ==========================================
            // HIDE CREATE BUDGET FORM
            // ==========================================

            const createBudgetTab =
                document.getElementById(
                    "createBudgetTab"
                );


            if (createBudgetTab) {

                createBudgetTab.style.display =
                    "none";

            }


            // ==========================================
            // SHOW BUDGET TABLE
            // ==========================================

            const companyBudgetTable =
                document.getElementById(
                    "companyBudgetTable"
                );


            if (companyBudgetTable) {

                companyBudgetTable.style.display =
                    "block";

            }


            // ==========================================
            // RE-ENABLE SUBMIT BUTTON
            // ==========================================

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    "Create Budget";

            }

        }


        // ==========================================
        // FAILED SUBMISSION
        // ==========================================

        else {

            console.error(
                "Budget creation failed:",
                data.message
            );


            message.innerHTML =
                data.message ||
                "Failed to create budget.";


            // Re-enable button

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    "Create Budget";

            }

        }

    })


    // ==========================================
    // HANDLE AJAX / NETWORK ERROR
    // ==========================================

    .catch(error => {

        console.error(
            "Create Budget Error:",
            error
        );


        message.innerHTML =
            "An error occurred while creating the budget. Please try again.";


        // Re-enable button

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                "Create Budget";

        }

    });

}






/* ==========================================================
        CLEAR CREATE COMPANY BUDGET FORM
========================================================== */

function clearBudgetForm() {

    const budgetNo =
        document.getElementById(
            "budgetNo"
        );

    const financialYear =
        document.getElementById(
            "financialYear"
        );

    const department =
        document.getElementById(
            "createBudgetDepartment"
        );

    const allocatedAmount =
        document.getElementById(
            "allocatedAmount"
        );

    const budgetType =
        document.getElementById(
            "budgetType"
        );

    const budgetStart =
        document.getElementById(
            "budgetStart"
        );

    const budgetEnd =
        document.getElementById(
            "budgetEnd"
        );

    const budgetRemarks =
        document.getElementById(
            "budgetRemarks"
        );

    const budgetMessage =
        document.getElementById(
            "budgetMessage"
        );


    // ==========================================
    // CLEAR FIELDS
    // ==========================================

    if (budgetNo) {
        budgetNo.value = "";
    }

    if (financialYear) {
        financialYear.value = "";
    }

    if (department) {
        department.value = "";
    }

    if (allocatedAmount) {
        allocatedAmount.value = "";
    }

    if (budgetType) {
        budgetType.value = "";
    }

    if (budgetStart) {
        budgetStart.value = "";
    }

    if (budgetEnd) {
        budgetEnd.value = "";
    }

    if (budgetRemarks) {
        budgetRemarks.value = "";
    }

    if (budgetMessage) {
        budgetMessage.innerHTML = "";
    }

}








/* ==========================================================
        SELECT A BUDGET
========================================================== */

function selectBudget(checkbox) {

    if (checkbox.checked) {

        selectedBudgetId =
            checkbox.value;

        console.log(
            "Selected Budget ID:",
            selectedBudgetId
        );

    } else {

        selectedBudgetId = null;

    }

}


/* ==========================================================
        SELECT ALL BUDGETS
========================================================== */

function selectAllBudgets(
    masterCheckbox
) {

    const checkboxes =
        document.querySelectorAll(
            ".budget-checkbox"
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                masterCheckbox.checked;

        }
    );


    if (masterCheckbox.checked &&
        checkboxes.length > 0) {

        selectedBudgetId =
            checkboxes[0].value;

    } else {

        selectedBudgetId = null;

    }

}


/* ==========================================================
        INITIALIZE BUDGET MODULE
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Load company budgets
        loadCompanyBudgets();

    }
);


// ==========================================================
// CURRENT SELECTED COMPANY BUDGET
// ==========================================================

let selectedCompanyBudget = null;



// ==========================================================
// FORMAT CURRENCY
// ==========================================================

function formatCurrency(amount) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {

        return "0.00";

    }


    return Number(amount).toLocaleString(
        "en-UG",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}



// ==========================================================
// FORMAT DATE
// ==========================================================

function formatDate(dateValue) {

    if (
        !dateValue ||
        dateValue === "null" ||
        dateValue === "undefined"
    ) {

        return "-";

    }


    return dateValue;

}



// ==========================================================
// LOAD COMPANY BUDGETS
// ==========================================================
// ==========================================================
// SELECTED COMPANY BUDGET
// ==========================================================


// ==========================================================
// LOAD COMPANY BUDGETS
// ==========================================================

async function loadCompanyBudgets() {

    console.log(
        "Loading company budgets..."
    );


    // ======================================================
    // GET TABLE BODY
    // ======================================================

    const budgetBody =
        document.getElementById(
            "budgetBody"
        );


    // ======================================================
    // CHECK TABLE BODY
    // ======================================================

    if (!budgetBody) {

        console.error(
            "ERROR: budgetBody was not found."
        );

        return;

    }


    // ======================================================
    // SHOW LOADING
    // ======================================================

    budgetBody.innerHTML = `

        <tr>

            <td
                colspan="17"
                style="text-align:center;">

                Loading company budgets...

            </td>

        </tr>

    `;


    try {


        // ==================================================
        // AJAX REQUEST
        // ==================================================

        const response =
            await fetch(
                "/ceo/api/company-budgets",
                {

                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        // ==================================================
        // DEBUG HTTP STATUS
        // ==================================================

        console.log(
            "Company Budgets HTTP Status:",
            response.status
        );


        // ==================================================
        // CHECK HTTP RESPONSE
        // ==================================================

        if (!response.ok) {

            throw new Error(

                "HTTP Error: " +
                response.status

            );

        }


        // ==================================================
        // CONVERT TO JSON
        // ==================================================

        const result =
            await response.json();


        // ==================================================
        // DEBUG RESPONSE
        // ==================================================

        console.log(
            "Company Budgets Response:",
            result
        );


        // ==================================================
        // CHECK API SUCCESS
        // ==================================================

        if (
            !result.success
        ) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="17"
                        style="text-align:center;">

                        ${
                            result.message ||
                            "Failed to load company budgets."
                        }

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // GET BUDGET DATA
        // ==================================================

        const budgets =
            result.data || [];


        // ==================================================
        // CHECK IF NO DATA
        // ==================================================

        if (
            budgets.length === 0
        ) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="17"
                        style="text-align:center;">

                        No company budgets found.

                    </td>

                </tr>

            `;

            return;

        }


        // ==================================================
        // CLEAR TABLE
        // ==================================================

        budgetBody.innerHTML = "";


        // ==================================================
        // DISPLAY COMPANY BUDGETS
        // ==================================================

        budgets.forEach(
            budget => {


                // ==========================================
                // CREATE ROW
                // ==========================================

                const row =
                    document.createElement(
                        "tr"
                    );


                // ==========================================
                // STORE COMPANY BUDGET ID
                // ==========================================

                row.dataset.companyBudgetId =
                    budget.company_budget_id;


                // ==========================================
                // MAKE ROW CLICKABLE
                // ==========================================

                row.style.cursor =
                    "pointer";


                // ==========================================
                // CREATE ROW CONTENT
                // ==========================================

                row.innerHTML = `

                    <!-- SELECT CHECKBOX -->

                    <td>

                        <input
                            type="checkbox"
                            class="budgetCheckbox"
                            value="${budget.company_budget_id}">

                    </td>


                    <!-- BUDGET NO -->

                    <td>

                        ${
                            budget.budget_no ||
                            "-"
                        }

                    </td>


                    <!-- FINANCIAL YEAR -->

                    <td>

                        ${
                            budget.financial_year ||
                            "-"
                        }

                    </td>


                    <!-- DEPARTMENT -->

                    <td>

                        ${
                            budget.department_name ||
                            "-"
                        }

                    </td>


                    <!-- TOTAL BUDGET -->

                    <td>

                        ${
                            typeof formatCurrency ===
                            "function"

                            ?

                            formatCurrency(
                                budget.total_budget || 0
                            )

                            :

                            (
                                budget.total_budget ||
                                "0.00"
                            )
                        }

                    </td>


                    <!-- BUDGET TYPE -->

                    <td>

                        ${
                            budget.budget_type ||
                            "-"
                        }

                    </td>


                    <!-- START DATE -->

                    <td>

                        ${
                            typeof formatDate ===
                            "function"

                            ?

                            formatDate(
                                budget.start_date
                            )

                            :

                            (
                                budget.start_date ||
                                "-"
                            )
                        }

                    </td>


                    <!-- END DATE -->

                    <td>

                        ${
                            typeof formatDate ===
                            "function"

                            ?

                            formatDate(
                                budget.end_date
                            )

                            :

                            (
                                budget.end_date ||
                                "-"
                            )
                        }

                    </td>


                    <!-- SPENT -->

                    <td>

                        ${
                            budget.spent ||
                            "0.00"
                        }

                    </td>


                    <!-- BALANCE -->

                    <td>

                        ${
                            typeof formatCurrency ===
                            "function"

                            ?

                            formatCurrency(
                                budget.balance || 0
                            )

                            :

                            (
                                budget.total_budget ||
                                "0.00"
                            )
                        }

                    </td>


                    <!-- CREATED BY -->

                    <td>

                        ${
                            budget.created_by_name ||
                            budget.created_by ||
                            "-"
                        }

                    </td>


                    <!-- CREATED DATE -->

                    <td>

                        ${
                            typeof formatDate ===
                            "function"

                            ?

                            formatDate(
                                budget.created_at
                            )

                            :

                            (
                                budget.created_at ||
                                "-"
                            )
                        }

                    </td>


                    <!-- CEO APPROVAL DATE -->

                    <td>

                        ${
                            budget.ceo_approval_date ||

                            "-"
                        }

                    </td>


                    <!-- CEO STATUS -->

                    <td>

                        ${
                            budget.ceo_status ||
                            "Pending"
                        }

                    </td>

                `;


                // ==========================================
                // CHECKBOX
                // DO NOT OPEN APPROVAL PANEL
                // ==========================================

                const checkbox =
                    row.querySelector(
                        ".budgetCheckbox"
                    );


                if (checkbox) {

                    checkbox.addEventListener(
                        "click",
                        function(event) {

                            event.stopPropagation();

                        }
                    );

                }


                // ==========================================
                // CLICK COMPANY BUDGET ROW
                // ==========================================
                

                row.addEventListener(
                    "click",
                    function(event) {


                        // ==================================
                        // IGNORE CHECKBOX
                        // ==================================

                        if (
                            event.target.closest(
                                ".budgetCheckbox"
                            )
                        ) {

                            return;

                        }


                        // ==================================
                        // SAVE SELECTED BUDGET
                        // ==================================

                        selectedCompanyBudget =
                            budget;


                        console.log(
                            "Selected Company Budget:",
                            selectedCompanyBudget
                        );


                        console.log(
                            "Selected Company Budget ID:",
                            budget.company_budget_id
                        );


                        // ==================================
                        // OPEN APPROVAL PANEL
                        // ==================================

                        window.openCompanyBudgetApproval(
                            budget
                        );

                    }
                );


                // ==========================================
                // ADD ROW TO TABLE
                // ==========================================

                budgetBody.appendChild(
                    row
                );

            }
        );


        // ==================================================
        // SUCCESS MESSAGE
        // ==================================================

        console.log(

            budgets.length +
            " company budget(s) loaded successfully."

        );


    }

    catch(error) {


        // ==================================================
        // HANDLE ERROR
        // ==================================================

        console.error(

            "Load Company Budgets Error:",

            error

        );


        budgetBody.innerHTML = `

            <tr>

                <td
                    colspan="17"
                    style="text-align:center;">

                    Failed to load company budgets.

                </td>

            </tr>

        `;

    }

}




















/* ==========================================================
   AI BUDGET PREDICTION MODULE
========================================================== */


/* ==========================================================
   OPEN AI PREDICTION PANEL
========================================================== */

function openAIBudgetPrediction() {

    const panel = document.getElementById("predictBudgetTab");

    if (!panel) {
        alert("Prediction panel not found.");
        return;
    }

    panel.style.display = "block";

    loadPredictionDepartments();

}


/* ==========================================================
   LOAD DEPARTMENTS
========================================================== */

async function loadPredictionDepartments() {


    const departmentSelect =
        document.getElementById("budgetDepartment");


    if (!departmentSelect) {

        console.error(
            "budgetDepartment element not found"
        );

        return;

    }


    departmentSelect.innerHTML =
        `<option value="">Loading departments...</option>`;


    try {


        const response =
            await fetch("/ceo/api/departments");


        const result =
            await response.json();



        departmentSelect.innerHTML =
            `<option value="">Select Department</option>`;



        if (result.success) {


            result.data.forEach(department => {


                departmentSelect.innerHTML += `

                    <option value="${department.department_id}">
                        ${department.department_name}
                    </option>

                `;


            });


        }


    }

    catch(error) {


        console.error(
            "Department loading error:",
            error
        );


        departmentSelect.innerHTML =
            `<option>
                Failed to load departments
            </option>`;


    }


}



/* ==========================================================
   LOAD DEPARTMENT BUDGET ITEMS
========================================================== */


document.addEventListener(
    "DOMContentLoaded",
    function(){


        const department =
            document.getElementById(
                "budgetDepartment"
            );


        if(department){


            department.addEventListener(
                "change",
                loadBudgetItems
            );


        }


    }
);



async function loadBudgetItems(){


    const departmentId =
        document.getElementById(
            "budgetDepartment"
        ).value;



    const itemSelect =
        document.getElementById(
            "predictItems"
        );



    if(!itemSelect){

        return;

    }



    itemSelect.innerHTML =
        "";



    if(!departmentId){

        return;

    }



    itemSelect.innerHTML =
        `
        <option>
            Loading items...
        </option>
        `;



    try{


        const response =
            await fetch(
                `/ceo/api/department/${departmentId}/budget-items`
            );



        const result =
            await response.json();



        itemSelect.innerHTML =
            "";



        if(result.success){


            result.data.forEach(item=>{


                itemSelect.innerHTML += `

                    <option value="${item.department_budget_id}">
                        ${item.budget_item}
                    </option>

                `;


            });


        }

        else{


            itemSelect.innerHTML =
            `
            <option>
                No budget items found
            </option>
            `;


        }


    }


    catch(error){


        console.error(
            "Budget item loading error:",
            error
        );


        itemSelect.innerHTML =
        `
        <option>
            Failed to load items
        </option>
        `;


    }



}




/* ==========================================================
   AI BUDGET PREDICTION
========================================================== */


async function predictBudget(){



    const departmentId =
        document.getElementById(
            "budgetDepartment"
        ).value;




    if(!departmentId){


        alert(
            "Please select department"
        );


        return;


    }



    const payload = {


        department_id:
            departmentId


    };




    const resultBox =
        document.getElementById(
            "predictionResult"
        );



    const content =
        document.getElementById(
            "predictionContent"
        );




    if(resultBox){

        resultBox.style.display =
            "block";

    }



    if(content){


        content.innerHTML = `

            <h3>
                AI is predicting budget...
            </h3>

        `;

    }




    try{



        const response =
            await fetch(
                "/ceo/api/predict-budget",
                {

                    method:"POST",


                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:
                    JSON.stringify(payload)


                }
            );





        const data =
            await response.json();





        console.log(
            "AI Prediction Response:",
            data
        );





        if(!data.success){


            content.innerHTML = `

                <div class="alert alert-danger">

                    ${data.error}

                </div>

            `;


            return;


        }






        content.innerHTML = `


        <div class="prediction-card">


            <h2>
                AI Budget Prediction
            </h2>


            <hr>



            <p>

                <strong>
                Department ID:
                </strong>

                ${data.department_id}

            </p>




            <p>

                <strong>
                Predicted Budget:
                </strong>


                UGX 
                ${Number(
                    data.predicted_budget
                ).toLocaleString()}


            </p>




            <p>

                <strong>
                Status:
                </strong>


                Prediction Completed Successfully


            </p>



        </div>


        `;



    }



    catch(error){


        console.error(
            "Prediction error:",
            error
        );



        content.innerHTML = `


        <div class="alert alert-danger">

            Failed to generate AI prediction.

        </div>


        `;


    }



}