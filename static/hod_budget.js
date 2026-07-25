//////////////////////////////////////////
// TOGGLE PREDICT BUDGET PANEL
//////////////////////////////////////////

function togglePredictBudget() {

    const panel = document.getElementById("predictBudgetTab");

    if (!panel) return;


    const visible = panel.style.display === "block";


    panel.style.display = visible ? "none" : "block";


    if (!visible) {

        panel.scrollIntoView({
            behavior: "smooth"
        });

    }

}





//////////////////////////////////////////
// SELECT ALL ITEMS
//////////////////////////////////////////

function toggleSelectAllItems() {

    const check =
        document.getElementById("selectAllItems");


    const items =
        document.getElementById("predictItems");


    if (!check || !items) return;



    Array.from(items.options).forEach(option => {

        option.selected = check.checked;

    });

}





//////////////////////////////////////////
// PREDICT BUDGET
//////////////////////////////////////////

function predictBudget() {


    const department =
        document.getElementById("predictDepartment").value;



    const items =
        Array.from(
            document.getElementById("predictItems").selectedOptions
        )
        .map(item => item.value);



    if (items.length === 0) {

        alert("Select budget items");
        return;

    }



    const start =
        document.getElementById("predictStart").value;



    const end =
        document.getElementById("predictEnd").value;



    if (!start || !end) {

        alert("Select dates");
        return;

    }



    const days =
        Math.max(

            Math.ceil(

                (new Date(end) - new Date(start))
                /
                (1000 * 60 * 60 * 24)

            ),

            1

        );



    const prediction =
        days * items.length * 50000;



    document.getElementById(
        "predictionContent"
    ).innerHTML = `

        <p>
            <b>Department:</b> ${department}
        </p>


        <p>
            <b>Items:</b> ${items.join(", ")}
        </p>


        <p>
            <b>Duration:</b> ${days} days
        </p>


        <h2>
            Predicted Budget:
            UGX ${prediction.toLocaleString()}
        </h2>

    `;



    document.getElementById(
        "predictionResult"
    ).style.display = "block";


}







//////////////////////////////////////////
// SEARCH BUDGET
//////////////////////////////////////////

function searchBudget() {


    const keyword =
        document.getElementById("budgetSearch")
        .value
        .toLowerCase();



    const filtered =
        budgets.filter(b =>


            (b.budget_no || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.department_name || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.budget_item || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.budget_type || "")
            .toLowerCase()
            .includes(keyword)


        );



    renderBudgetTable(filtered);


}








//////////////////////////////////////////
// OPEN CREATE BUDGET
//////////////////////////////////////////

function openCreateBudget() {


    document.getElementById(
        "createBudgetTab"
    ).style.display = "block";



    document.getElementById(
        "predictBudgetTab"
    ).style.display = "none";


}





function closeCreateBudget() {


    document.getElementById(
        "createBudgetTab"
    ).style.display = "none";


}





//////////////////////////////////////////
// DEPARTMENT BUDGET MODULE
//////////////////////////////////////////


// =====================================================
// GLOBAL BUDGET DATA
// =====================================================

let budgets = [];


// =====================================================
// CREATE DEPARTMENT BUDGET
// =====================================================

async function submitBudget() {

    // ==========================================
    // GET FORM VALUES
    // ==========================================

    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        ).value;

    const departmentId =
        document.getElementById(
            "budgetDepartment"
        ).value;

    const budgetItem =
        document.getElementById(
            "budgetItem"
        ).value.trim();

    const quantity =
        document.getElementById(
            "budgetQuantity"
        ).value || 1;

    const unitCost =
        document.getElementById(
            "budgetUnitCost"
        ).value;

    const budgetType =
        document.getElementById(
            "budgetType"
        ).value;

    const startDate =
        document.getElementById(
            "budgetStart"
        ).value;

    const endDate =
        document.getElementById(
            "budgetEnd"
        ).value;

    const remarks =
        document.getElementById(
            "budgetRemarks"
        ).value.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!departmentId) {

        alert(
            "Please select a department."
        );

        return;

    }


    if (!companyBudgetId) {

        alert(
            "No company budget is available for the selected department."
        );

        return;

    }


    if (!budgetItem) {

        alert(
            "Please enter the budget item."
        );

        return;

    }


    if (!quantity || Number(quantity) <= 0) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    if (!unitCost || Number(unitCost) <= 0) {

        alert(
            "Please enter a valid unit cost."
        );

        return;

    }


    if (!budgetType) {

        alert(
            "Please select budget type."
        );

        return;

    }


    if (!startDate) {

        alert(
            "Please select start date."
        );

        return;

    }


    if (!endDate) {

        alert(
            "Please select end date."
        );

        return;

    }


    if (endDate < startDate) {

        alert(
            "End date cannot be before start date."
        );

        return;

    }


    // ==========================================
    // CREATE JSON DATA
    // ==========================================

    const data = {

        company_budget_id:
            Number(companyBudgetId),

        department_id:
            Number(departmentId),

        budget_item:
            budgetItem,

        quantity:
            Number(quantity),

        unit_cost:
            Number(unitCost),

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
        "Sending Department Budget:",
        data
    );


    // ==========================================
    // SUBMIT BUTTON
    // ==========================================

    const submitButton =
        document.getElementById(
            "submitBudgetBtn"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
            "Saving...";

    }


    // ==========================================
    // AJAX REQUEST
    // ==========================================

    try {

        const response =
            await fetch(
                "/hod/api/budget/create",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        // ==========================================
        // CHECK HTTP RESPONSE
        // ==========================================

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // ==========================================
        // GET JSON RESPONSE
        // ==========================================

        const result =
            await response.json();


        console.log(
            "Create Budget Response:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.success) {

            alert(
                result.message ||
                "Department budget created successfully."
            );


            // ==========================================
            // CLEAR FORM
            // ==========================================

            clearDepartmentBudgetForm();


            // ==========================================
            // CLOSE CREATE BUDGET FORM
            // ==========================================

            closeCreateBudget();


            // ==========================================
            // RELOAD BUDGET TABLE
            // ==========================================

            loadBudgets();

        }


        // ==========================================
        // BACKEND ERROR
        // ==========================================

        else {

            alert(
                result.message ||
                "Failed to create department budget."
            );

        }


    }


    // ==========================================
    // AJAX / NETWORK ERROR
    // ==========================================

    catch(error) {

        console.error(
            "Create Department Budget Error:",
            error
        );


        alert(
            "Failed to create department budget. Please try again."
        );

    }


    // ==========================================
    // RE-ENABLE BUTTON
    // ==========================================

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                "Create Budget";

        }

    }

}



// =====================================================
// CLEAR DEPARTMENT BUDGET FORM
// =====================================================

function clearDepartmentBudgetForm() {

    // ==========================================
    // CLEAR COMPANY BUDGET
    // ==========================================

    const companyBudget =
        document.getElementById(
            "companyBudget"
        );

    if (companyBudget) {

        companyBudget.value = "";

        companyBudget.placeholder =
            "Select Department First";

    }


    // ==========================================
    // CLEAR HIDDEN COMPANY BUDGET ID
    // ==========================================

    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        );

    if (companyBudgetId) {

        companyBudgetId.value = "";

    }


    // ==========================================
    // CLEAR DEPARTMENT
    // ==========================================

    const department =
        document.getElementById(
            "budgetDepartment"
        );

    if (department) {

        department.value = "";

    }


    // ==========================================
    // CLEAR BUDGET ITEM
    // ==========================================

    const budgetItem =
        document.getElementById(
            "budgetItem"
        );

    if (budgetItem) {

        budgetItem.value = "";

    }


    // ==========================================
    // CLEAR QUANTITY
    // ==========================================

    const quantity =
        document.getElementById(
            "budgetQuantity"
        );

    if (quantity) {

        quantity.value = "";

    }


    // ==========================================
    // CLEAR UNIT COST
    // ==========================================

    const unitCost =
        document.getElementById(
            "budgetUnitCost"
        );

    if (unitCost) {

        unitCost.value = "";

    }


    // ==========================================
    // CLEAR BUDGET TYPE
    // ==========================================

    const budgetType =
        document.getElementById(
            "budgetType"
        );

    if (budgetType) {

        budgetType.value = "";

    }


    // ==========================================
    // CLEAR START DATE
    // ==========================================

    const startDate =
        document.getElementById(
            "budgetStart"
        );

    if (startDate) {

        startDate.value = "";

    }


    // ==========================================
    // CLEAR END DATE
    // ==========================================

    const endDate =
        document.getElementById(
            "budgetEnd"
        );

    if (endDate) {

        endDate.value = "";

    }


    // ==========================================
    // CLEAR REMARKS
    // ==========================================

    const remarks =
        document.getElementById(
            "budgetRemarks"
        );

    if (remarks) {

        remarks.value = "";

    }

}



// =====================================================
// LOAD DEPARTMENTS
// =====================================================

async function loadDepartments() {

    try {

        const response =
            await fetch(
                "/hod/api/departments"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load departments"
            );

        }


        const result =
            await response.json();


        console.log(
            "Departments:",
            result
        );


        // ==========================================
        // DEPARTMENT SELECTS
        // ==========================================

        const selects = [

            document.getElementById(
                "budgetDepartment"
            ),

            document.getElementById(
                "predictDepartment"
            )

        ];


        // ==========================================
        // POPULATE SELECTS
        // ==========================================

        selects.forEach(select => {

            if (!select) {

                return;

            }


            select.innerHTML = `

                <option value="">
                    Select Department
                </option>

            `;


            if (
                result.success &&
                result.data
            ) {

                result.data.forEach(
                    dept => {

                        select.innerHTML += `

                            <option
                                value="${dept.department_id}">
                                ${dept.department_name}
                            </option>

                        `;

                    }
                );

            }

        });


    }


    catch(error) {

        console.error(
            "Load Departments Error:",
            error
        );

    }

}



// ==========================================================
// DEPARTMENT CHANGE EVENT
// ==========================================================

function setupDepartmentChangeEvent() {

    const departmentSelect =
        document.getElementById(
            "budgetDepartment"
        );


    const companyBudgetContainer =
        document.getElementById(
            "companyBudgetContainer"
        );


    const companyBudget =
        document.getElementById(
            "companyBudget"
        );


    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        );


    // ======================================================
    // CHECK DEPARTMENT SELECT
    // ======================================================

    if (!departmentSelect) {

        console.error(
            "budgetDepartment was not found."
        );

        return;

    }


    // ======================================================
    // DEPARTMENT CHANGE
    // ======================================================

    departmentSelect.addEventListener(
        "change",
        async function() {

            const departmentId =
                this.value;


            console.log(
                "Selected Department ID:",
                departmentId
            );


            // ==================================================
            // NO DEPARTMENT SELECTED
            // ==================================================

            if (!departmentId) {

                // Hide Company Budget

                if (companyBudgetContainer) {

                    companyBudgetContainer.style.display =
                        "none";

                }


                // Clear Company Budget

                if (companyBudget) {

                    companyBudget.value =
                        "";

                }


                // Clear hidden ID

                if (companyBudgetId) {

                    companyBudgetId.value =
                        "";

                }


                return;

            }


            // ==================================================
            // DEPARTMENT SELECTED
            // SHOW COMPANY BUDGET
            // ==================================================

            if (companyBudgetContainer) {

                companyBudgetContainer.style.display =
                    "block";

            }


            if (companyBudget) {

                companyBudget.value =
                    "Loading...";

            }


            if (companyBudgetId) {

                companyBudgetId.value =
                    "";

            }


            // ==================================================
            // LOAD COMPANY BUDGET
            // ==================================================

            await loadCompanyBudgetForDepartment(
                departmentId
            );

        }
    );

}


// =====================================================
// LOAD COMPANY BUDGET FOR SELECTED DEPARTMENT
// =====================================================

// ==========================================================
// LOAD COMPANY BUDGET FOR SELECTED DEPARTMENT
// ==========================================================

async function loadCompanyBudgetForDepartment(
    departmentId
) {

    const companyBudget =
        document.getElementById(
            "companyBudget"
        );


    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        );


    const companyBudgetContainer =
        document.getElementById(
            "companyBudgetContainer"
        );


    try {

        const response =
            await fetch(
                "/hod/api/company-budget/" +
                encodeURIComponent(
                    departmentId
                ),
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        console.log(
            "Company Budget Response:",
            result
        );


        // ==================================================
        // COMPANY BUDGET FOUND
        // ==================================================

        if (
            response.ok &&
            result.success === true &&
            result.data
        ) {

            // Show field

            if (companyBudgetContainer) {

                companyBudgetContainer.style.display =
                    "block";

            }


            // Display company budget number

            if (companyBudget) {

                companyBudget.value =
                    result.data.budget_no ||
                    "No Budget Number";

            }


            // Save company budget ID

            if (companyBudgetId) {

                companyBudgetId.value =
                    result.data.company_budget_id ||
                    "";

            }


            console.log(
                "Company Budget Number:",
                result.data.budget_no
            );


            console.log(
                "Company Budget ID:",
                result.data.company_budget_id
            );

        }


        // ==================================================
        // NO COMPANY BUDGET FOUND
        // ==================================================

        else {

            if (companyBudget) {

                companyBudget.value =
                    "";

                companyBudget.placeholder =
                    "No Company Budget Available";

            }


            if (companyBudgetId) {

                companyBudgetId.value =
                    "";

            }


            alert(
                result.message ||
                "No company budget is available for this department."
            );

        }

    }


    catch(error) {

        console.error(
            "Load Company Budget Error:",
            error
        );


        if (companyBudget) {

            companyBudget.value =
                "";

            companyBudget.placeholder =
                "Failed to load Company Budget";

        }


        if (companyBudgetId) {

            companyBudgetId.value =
                "";

        }

    }

}



// ==========================================================
// PAGE LOAD
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        // Load departments

        await loadDepartments();


        // Setup department selection

        setupDepartmentChangeEvent();

    }
);
// =====================================================
// LOAD DEPARTMENT BUDGETS
// =====================================================
// =====================================================
// LOAD DEPARTMENT BUDGETS
// =====================================================

// ==========================================================
// LOAD DEPARTMENT BUDGETS
// ==========================================================

async function loadBudgets() {

    console.log(
        "Loading Department Budgets..."
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
                "/hod/api/department-budgets",
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        // ==================================================
        // DEBUG STATUS
        // ==================================================

        console.log(
            "Department Budget API Status:",
            response.status
        );


        // ==================================================
        // CHECK HTTP ERROR
        // ==================================================

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // ==================================================
        // GET JSON
        // ==================================================

        const result =
            await response.json();


        // ==================================================
        // DEBUG RESPONSE
        // ==================================================

        console.log(
            "Department Budget API Response:",
            result
        );


        // ==================================================
        // CHECK SUCCESS
        // ==================================================

        if (
            !result.success
        ) {

            throw new Error(

                result.message ||

                "Failed to load department budgets."

            );

        }


        // ==================================================
        // GET DATA
        // ==================================================

        const budgets =
            result.data || [];


        // ==================================================
        // CHECK EMPTY
        // ==================================================

        if (
            budgets.length === 0
        ) {

            budgetBody.innerHTML = `

                <tr>

                    <td
                        colspan="15"
                        style="text-align:center;">

                        No department budgets found.

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
        // DISPLAY EACH BUDGET
        // ==================================================

        budgets.forEach(
            function(budget) {


                // ==========================================
                // CREATE TABLE ROW
                // ==========================================

                const row =
                    document.createElement(
                        "tr"
                    );


                // ==========================================
                // STORE BUDGET IDS
                // ==========================================

                row.dataset.departmentBudgetId =
                    budget.department_budget_id;


                row.dataset.companyBudgetId =
                    budget.company_budget_id;


                // ==========================================
                // SPENT
                // ==========================================

                const spent =
                    Number(
                        budget.spent || 0
                    );


                // ==========================================
                // TOTAL BUDGET
                // ==========================================

                const totalBudget =
                    Number(
                        budget.total_budget || 0
                    );


                // ==========================================
                // BALANCE
                // ==========================================

                const balance =
                    Number(
                        budget.balance !== undefined

                            ? budget.balance

                            : totalBudget - spent
                    );


                // ==========================================
                // CREATE ROW
                // ==========================================

                row.innerHTML = `

                    <!-- SELECT -->

                    <td>

                        <input
                            type="checkbox"
                            class="budgetCheckbox"
                            value="${budget.department_budget_id}"
                        >

                    </td>


                    <!-- BUDGET NO -->

                    <td>

                        ${
                            budget.department_budget_no ||
                            "-"
                        }

                    </td>


                    <!-- COMPANY BUDGET -->

                    <td>
                        ${
                            budget.company_budget_no ||
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


                    <!-- BUDGET ITEM -->

                    <td>

                        ${
                            budget.budget_item ||
                            "-"
                        }

                    </td>


                    <!-- QUANTITY -->

                    <td>

                        ${
                            budget.quantity ||
                            0
                        }

                    </td>


                    <!-- UNIT COST -->

                    <td>

                        UGX
                        ${
                            formatCurrency(
                                budget.unit_cost
                            )
                        }

                    </td>


                    <!-- TOTAL BUDGET -->

                    <td>

                        UGX
                        ${
                            formatCurrency(
                                totalBudget
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
                            formatDate(
                                budget.start_date
                            )
                        }

                    </td>


                    <!-- END DATE -->

                    <td>

                        ${
                            formatDate(
                                budget.end_date
                            )
                        }

                    </td>


                    <!-- SPENT -->

                    <td>

                        UGX
                        ${
                            formatCurrency(
                                spent
                            )
                        }

                    </td>


                    <!-- BALANCE -->

                    <td>

                        UGX
                        ${
                            formatCurrency(
                                balance
                            )
                        }

                    </td>


                    <!-- CEO APPROVAL DATE -->

                    <td>

                        ${
                            formatDateTime(
                                budget.ceo_approval_date
                            )
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
                // CLICK ROW
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

                        window.selectedDepartmentBudget =
                            budget;


                        console.log(
                            "Selected Department Budget:",
                            budget
                        );


                        // ==================================
                        // OPEN APPROVAL PANEL
                        // ==================================

                        if (
                            typeof openDepartmentBudgetApproval ===
                            "function"
                        ) {

                            openDepartmentBudgetApproval(
                                budget
                            );

                        }

                    }
                );


                // ==========================================
                // ADD ROW
                // ==========================================

                budgetBody.appendChild(
                    row
                );

            }
        );


        console.log(
            budgets.length +
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

                    <br>

                    ${
                        error.message
                    }

                </td>

            </tr>

        `;

    }

}




// ==========================================================
// FORMAT CURRENCY
// ==========================================================

function formatCurrency(
    amount
) {

    const number =
        Number(
            amount || 0
        );


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

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(
            dateValue
        );


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
// FORMAT DATE TIME
// ==========================================================

function formatDateTime(
    dateTimeValue
) {

    if (!dateTimeValue) {

        return "-";

    }


    const date =
        new Date(
            dateTimeValue
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
// PAGE LOAD
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "HOD Budget Page Loaded."
        );


        loadBudgets();

    }
);