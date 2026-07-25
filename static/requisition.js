
let rowIndex = 0;

/* ==============================
   INITIALIZE FORM
================================= */

document.addEventListener("DOMContentLoaded", function () {

    const dateInput = document.getElementById("submission_date");

    if(dateInput){

        dateInput.value = new Date().toISOString().split("T")[0];

    }

});


/* ==============================
   SHOW CREATE FORM
================================= */

// ==========================================================
// SHOW CREATE REQUISITION FORM
// ==========================================================
function showCreateForm() {

    document.getElementById(
        "requisitionList"
    ).style.display = "none";


    document.getElementById(
        "createForm"
    ).style.display = "block";


    // ==================================================
    // LOAD DEPARTMENTS
    // ==================================================

    loadRequisitionDepartments();


    // ==================================================
    // LOAD NEXT PRS NUMBER
    // ==================================================

    loadNextPRSNumber();


    // ==================================================
    // SET TODAY'S DATE
    // ==================================================

    const dateInput =
        document.getElementById(
            "submission_date"
        );


    if (dateInput) {

        dateInput.value =
            new Date()
            .toISOString()
            .split("T")[0];

    }


    // ==================================================
    // ADD FIRST ITEM ROW
    // ==================================================

    const tbody =
        document.querySelector(
            "#reqTable tbody"
        );


    if (
        tbody &&
        tbody.rows.length === 0
    ) {

        addRow();

    }

}


// ==========================================================
// LOAD NEXT PRS NUMBER
// ==========================================================

// ==========================================================
// LOAD NEXT PRS NUMBER
// ==========================================================

async function loadNextPRSNumber() {

    const prsInput =
        document.getElementById(
            "prs_no"
        );


    if (!prsInput) {

        console.error(
            "PRS number input #prs_no not found"
        );

        return;

    }


    prsInput.value =
        "Generating PRS Number...";


    try {

        const response =
            await fetch(
                "/requisition/api/next-prs-number"
            );


        const result =
            await response.json();


        console.log(
            "Next PRS Response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to generate PRS number."
            );

        }


        prsInput.value =
            result.prs_no;


        console.log(
            "PRS Number:",
            result.prs_no
        );


    } catch (error) {

        console.error(
            "PRS Number Error:",
            error
        );


        prsInput.value =
            "Unable to generate PRS";

    }

}
/* ==============================
   HIDE CREATE FORM
================================= */

function hideCreateForm(){

    document.getElementById("createForm").style.display = "none";

    document.getElementById("requisitionList").style.display = "block";

}


/* ==============================
   ADD ITEM
================================= */

function addRow(){

    const tableBody = document.querySelector("#reqTable tbody");

    if(!tableBody) return;

    const row = tableBody.insertRow();

    row.innerHTML = `

        <td>${rowIndex + 1}</td>
        

        <td>
            <input
            type="text"
            name="material_name_${rowIndex}"
            required>
        </td>

        <td>
            <input
            type="text"
            name="description_${rowIndex}">
        </td>

        <td>
            <input
            type="text"
            name="uom_${rowIndex}"
            required>
        </td>

        <td>
            <input
            type="number"
            name="qty_stock_${rowIndex}"
            min="0">
        </td>

        <td>
            <input
            type="number"
            name="qty_required_${rowIndex}"
            min="1"
            required>
        </td>

        <td>
            <input
            type="date"
            name="required_date_${rowIndex}"
            required>
        </td>

        <td>
            <input
            type="text"
            name="remark_${rowIndex}">
        </td>

    `;

    rowIndex++;

}


/* ==============================
   REMOVE ITEM
================================= */

function removeRow(){

    const tableBody = document.querySelector("#reqTable tbody");

    if(!tableBody) return;

    if(tableBody.rows.length > 1){

        tableBody.deleteRow(tableBody.rows.length - 1);

        rowIndex--;

    }

}


/* ==========================================
   CANCEL REQUISITION
========================================== */
function cancelRequisition() {

    // Ask user before cancelling
    if (!confirm("Are you sure you want to cancel this requisition?")) {
        return;
    }

    // Reset the form
    const form = document.querySelector("#createForm form");

    if (form) {
        form.reset();
    }

    // Set today's date again
    const dateInput = document.getElementById("submission_date");

    if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }

    // Clear all item rows
    const tbody = document.querySelector("#reqTable tbody");

    if (tbody) {
        tbody.innerHTML = "";
    }

    // Reset row counter
    rowIndex = 0;

    // Add one empty row
    addRow();

    // Hide form
    document.getElementById("createForm").style.display = "none";

    // Show requisition list
    document.getElementById("requisitionList").style.display = "block";
}

// ==========================================================
// LOAD DEPARTMENTS FOR REQUISITION FORM
// ==========================================================

async function loadRequisitionDepartments() {

    const departmentSelect =
        document.getElementById("department");

    if (!departmentSelect) {

        console.error(
            "Department select #department not found"
        );

        return;
    }

    try {

        departmentSelect.innerHTML = `
            <option value="">
                Loading Departments...
            </option>
        `;

        const response = await fetch(
            "/requisition/api/departments"
        );

        console.log(
            "Department API Status:",
            response.status
        );

        const result =
            await response.json();

        console.log(
            "Departments Response:",
            result
        );

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load departments"
            );
        }

        departmentSelect.innerHTML = `
            <option value="">
                Select Department
            </option>
        `;

        result.data.forEach(
            department => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    department.department_id;

                option.textContent =
                    department.department_name;

                departmentSelect.appendChild(
                    option
                );

            }
        );

        console.log(
            "Departments loaded successfully"
        );

    } catch (error) {

        console.error(
            "Department AJAX Error:",
            error
        );

        departmentSelect.innerHTML = `
            <option value="">
                Failed to load Departments
            </option>
        `;
    }
}


// ==========================================================
// DEPARTMENT CHANGE
// ==========================================================

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id !==
            "department"
        ) {
            return;
        }

        const departmentId =
            event.target.value;

        console.log(
            "Selected Department ID:",
            departmentId
        );

        loadBudgetItemsForDepartment(
            departmentId
        );

    }
);


// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================
// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================
// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================
// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================

async function loadBudgetItemsForDepartment(
    departmentId
) {

    const budgetItemSelect =
        document.getElementById("departmentBudgetItem");


    // ======================================================
    // CHECK DROPDOWN EXISTS
    // ======================================================

    if (!budgetItemSelect) {

        console.error(
            "Budget Item dropdown #budgetItem not found"
        );

        return;
    }


    // ======================================================
    // NO DEPARTMENT SELECTED
    // ======================================================

    if (!departmentId) {

        budgetItemSelect.innerHTML = `
            <option value="">
                Select Department First
            </option>
        `;

        budgetItemSelect.disabled = true;

        return;
    }


    // ======================================================
    // SHOW LOADING
    // ======================================================

    budgetItemSelect.innerHTML = `
        <option value="">
            Loading Budget Items...
        </option>
    `;

    budgetItemSelect.disabled = true;


    try {

        // ==================================================
        // CALL API
        // ==================================================

        const response = await fetch(
            `/requisition/api/budget/department/${departmentId}`
        );


        console.log(
            "Budget Items API Status:",
            response.status
        );


        // ==================================================
        // READ JSON
        // ==================================================

        const result =
            await response.json();


        console.log(
            "Budget Items Response:",
            result
        );


        // ==================================================
        // CHECK API RESPONSE
        // ==================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load budget items"
            );

        }


        // ==================================================
        // GET BUDGET ARRAY
        // ==================================================

        const budgets =
            Array.isArray(result.data)
                ? result.data
                : [];


        console.log(
            "Budget items received:",
            budgets
        );


        console.log(
            "Number of budget items:",
            budgets.length
        );


        // ==================================================
        // CLEAR DROPDOWN
        // ==================================================

        budgetItemSelect.innerHTML = "";


        // ==================================================
        // DEFAULT OPTION
        // ==================================================

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            "Select Budget Item";

        budgetItemSelect.appendChild(
            defaultOption
        );


        // ==================================================
        // NO BUDGET ITEMS
        // ==================================================

        if (budgets.length === 0) {

            const noBudgetOption =
                document.createElement("option");

            noBudgetOption.value = "";

            noBudgetOption.textContent =
                "No Budget Items Available";

            budgetItemSelect.appendChild(
                noBudgetOption
            );

            budgetItemSelect.disabled = true;

            console.log(
                "No budget items found for department:",
                departmentId
            );

            return;
        }


        // ==================================================
        // ADD BUDGET ITEMS
        // ==================================================

        budgets.forEach(
            budget => {

                const option =
                    document.createElement(
                        "option"
                    );


                // ==========================================
                // DATABASE VALUE
                // ==========================================

                option.value =
                    budget.department_budget_id;


                // ==========================================
                // DISPLAY TEXT
                // ==========================================

                option.textContent =
                    budget.budget_item;


                // ==========================================
                // ADD OPTION TO DROPDOWN
                // ==========================================

                budgetItemSelect.appendChild(
                    option
                );


                console.log(
                    "Added Budget Item:",
                    budget.budget_item,
                    "ID:",
                    budget.department_budget_id
                );

            }
        );


        // ==================================================
        // ENABLE DROPDOWN
        // ==================================================

        budgetItemSelect.disabled = false;


        // ==================================================
        // SUCCESS DEBUG
        // ==================================================

        console.log(
            "SUCCESS: Budget Item dropdown populated."
        );


        console.log(
            "Budget Item dropdown HTML:",
            budgetItemSelect.innerHTML
        );


        console.log(
            "Budget Item dropdown children:",
            budgetItemSelect.children.length
        );


    } catch (error) {

        // ==================================================
        // ERROR
        // ==================================================

        console.error(
            "Budget Loading Error:",
            error
        );


        budgetItemSelect.innerHTML = `
            <option value="">
                Failed to load Budget Items
            </option>
        `;


        budgetItemSelect.disabled = true;

    }

}



// ==========================================================
// SUBMIT PURCHASE REQUISITION
// ==========================================================

document.addEventListener(
    "submit",
    async function (event) {

        // Only handle the requisition form
        const form = event.target.closest(
            "#createForm form"
        );

        if (!form) {
            return;
        }

        // Prevent normal page submission
        event.preventDefault();


        // ==================================================
        // GET FORM DATA
        // ==================================================

        const formData = new FormData(form);


        // ==================================================
        // GET SELECTED DEPARTMENT
        // ==================================================

        const departmentId =
            document.getElementById(
                "department"
            )?.value;


        // ==================================================
        // GET SELECTED BUDGET ITEM
        // ==================================================

        const departmentBudgetId =
            document.getElementById(
                "departmentBudgetItem"
            )?.value;


        // ==================================================
        // VALIDATE DEPARTMENT
        // ==================================================

        if (!departmentId) {

            alert(
                "Please select a department."
            );

            return;
        }


        // ==================================================
        // VALIDATE BUDGET ITEM
        // ==================================================

        if (!departmentBudgetId) {

            alert(
                "Please select a budget item."
            );

            return;
        }


        // ==================================================
        // MAKE SURE VALUES ARE IN FORMDATA
        // ==================================================

        formData.set(
            "department_id",
            departmentId
        );


        formData.set(
            "department_budget_id",
            departmentBudgetId
        );


        // ==================================================
        // DEBUG
        // ==================================================

        console.log(
            "Submitting Requisition..."
        );

        console.log(
            "Department ID:",
            departmentId
        );

        console.log(
            "Department Budget ID:",
            departmentBudgetId
        );


        // ==================================================
        // SUBMIT BUTTON
        // ==================================================

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );


        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Submitting...";

        }


        try {

            // ==================================================
            // SEND TO FLASK
            // ==================================================

            const response = await fetch(
                "/requisition/submit",
                {
                    method: "POST",
                    body: formData
                }
            );


            console.log(
                "Submit Status:",
                response.status
            );


            // ==================================================
            // READ JSON RESPONSE
            // ==================================================

            const result =
                await response.json();


            console.log(
                "Submit Response:",
                result
            );


            // ==================================================
            // CHECK RESPONSE
            // ==================================================

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Failed to create requisition."
                );

            }


            // ==================================================
            // PRS CREATED SUCCESSFULLY
            // ==================================================

            alert(
                `Requisition ${result.prs_no} created successfully!`
            );


            // ==================================================
            // DISPLAY PRS NUMBER
            // ==================================================

            const prsDisplay =
                document.getElementById(
                    "generatedPRS"
                );


            if (prsDisplay) {

                prsDisplay.textContent =
                    result.prs_no;

                prsDisplay.style.display =
                    "block";

            }


            // ==================================================
            // OPTIONAL: SHOW PRS IN INPUT
            // ==================================================

            const prsInput =
                document.getElementById(
                    "prs_no"
                );


            if (prsInput) {

                prsInput.value =
                    result.prs_no;

            }


            // ==================================================
            // RESET FORM
            // ==================================================

            form.reset();


            // ==================================================
            // RESET DATE
            // ==================================================

            const dateInput =
                document.getElementById(
                    "submission_date"
                );


            if (dateInput) {

                dateInput.value =
                    new Date()
                    .toISOString()
                    .split("T")[0];

            }


            // ==================================================
            // RESET DEPARTMENT
            // ==================================================

            const departmentSelect =
                document.getElementById(
                    "department"
                );


            if (departmentSelect) {

                departmentSelect.value =
                    "";

            }


            // ==================================================
            // RESET BUDGET ITEM
            // ==================================================

            const budgetItemSelect =
                document.getElementById(
                    "departmentBudgetItem"
                );


            if (budgetItemSelect) {

                budgetItemSelect.innerHTML = `
                    <option value="">
                        Select Department First
                    </option>
                `;

                budgetItemSelect.disabled =
                    true;

            }


            // ==================================================
            // CLEAR ITEM ROWS
            // ==================================================

            const tbody =
                document.querySelector(
                    "#reqTable tbody"
                );


            if (tbody) {

                tbody.innerHTML =
                    "";

            }


            // ==================================================
            // RESET ROW INDEX
            // ==================================================

            rowIndex = 0;


            // ==================================================
            // ADD FIRST EMPTY ROW
            // ==================================================

            addRow();


            // ==================================================
            // HIDE CREATE FORM
            // ==================================================

            document.getElementById(
                "createForm"
            ).style.display =
                "none";


            // ==================================================
            // SHOW REQUISITION LIST
            // ==================================================

            document.getElementById(
                "requisitionList"
            ).style.display =
                "block";


            // ==================================================
            // RELOAD REQUISITIONS
            // ==================================================

            if (
                typeof loadRequisitions ===
                "function"
            ) {

                loadRequisitions();

            }


        } catch (error) {

            console.error(
                "REQUISITION SUBMIT ERROR:",
                error
            );


            alert(
                error.message ||
                "An error occurred while creating requisition."
            );


        } finally {

            // ==================================================
            // ENABLE SUBMIT BUTTON
            // ==================================================

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Submit Requisition";

            }

        }

    }
);