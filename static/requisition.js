
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

function showCreateForm(){

    document.getElementById("requisitionList").style.display = "none";

    document.getElementById("createForm").style.display = "block";

    // Set today's date
    const dateInput = document.getElementById("submission_date");

    if(dateInput){

        dateInput.value = new Date().toISOString().split("T")[0];

    }

    // Add first row only once
    const tbody = document.querySelector("#reqTable tbody");

    if(tbody && tbody.rows.length === 0){

        addRow();

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
// LOAD DEPARTMENTS
// ==========================================================

async function loadRequisitionDepartments() {

    const departmentSelect =
        document.getElementById("department");


    try {

        const response =
            await fetch("/hod/api/departments");


        const result =
            await response.json();


        console.log(
            "Departments Response:",
            result
        );


        if (!result.success) {

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


        result.data.forEach(department => {

            const option =
                document.createElement("option");


            option.value =
                department.department_id;


            option.textContent =
                department.department_name;


            departmentSelect.appendChild(
                option
            );

        });


    } catch (error) {

        console.error(
            "Error loading departments:",
            error
        );

    }

}








// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================

// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================
// ==========================================================
// LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
// ==========================================================

async function loadBudgetItemsForDepartment(departmentId) {

    const budgetItemSelect =
        document.getElementById("budgetItem");


    // ======================================================
    // CHECK BUDGET ITEM SELECT EXISTS
    // ======================================================

    if (!budgetItemSelect) {

        console.error(
            "Budget Item select element not found."
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
        // AJAX REQUEST
        // ==================================================

        const response = await fetch(
            `/hod/api/budget/department/${departmentId}`
        );


        console.log(
            "Budget API HTTP Status:",
            response.status
        );


        // ==================================================
        // CONVERT RESPONSE TO JSON
        // ==================================================

        const result =
            await response.json();


        console.log(
            "Department Budget Response:",
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
                "Failed to load budget items."
            );

        }


        // ==================================================
        // CLEAR OLD BUDGET ITEMS
        // ==================================================

        budgetItemSelect.innerHTML = `
            <option value="">
                Select Budget Item
            </option>
        `;


        // ==================================================
        // CHECK IF BUDGET ITEMS EXIST
        // ==================================================

        if (
            !result.data ||
            result.data.length === 0
        ) {

            budgetItemSelect.innerHTML = `
                <option value="">
                    No Budget Items Available
                </option>
            `;

            budgetItemSelect.disabled = true;

            return;

        }


        // ==================================================
        // ADD BUDGET ITEMS
        // ==================================================

        result.data.forEach(
            budget => {

                const option =
                    document.createElement(
                        "option"
                    );


                // ==================================================
                // VALUE SENT TO FLASK
                // ==================================================

                option.value =
                    budget.department_budget_id;


                // ==================================================
                // TEXT DISPLAYED TO USER
                // ==================================================

                option.textContent =
                    budget.budget_item;


                // ==================================================
                // ADD TO DROPDOWN
                // ==================================================

                budgetItemSelect.appendChild(
                    option
                );

            }
        );


        // ==================================================
        // ENABLE BUDGET ITEM DROPDOWN
        // ==================================================

        budgetItemSelect.disabled = false;


    } catch (error) {

        console.error(
            "Budget Item AJAX Error:",
            error
        );


        budgetItemSelect.innerHTML = `
            <option value="">
                Failed to Load Budget Items
            </option>
        `;

        budgetItemSelect.disabled = true;

    }

}



// ==========================================================
// INITIALIZE DEPARTMENT AND BUDGET ITEM AJAX
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // ==================================================
        // GET DEPARTMENT SELECT
        // ==================================================

        const departmentSelect =
            document.getElementById(
                "department"
            );


        // ==================================================
        // CHECK DEPARTMENT SELECT EXISTS
        // ==================================================

        if (!departmentSelect) {

            console.error(
                "Department select element not found."
            );

            return;

        }


        // ==================================================
        // LOAD DEPARTMENTS
        // ==================================================

        loadRequisitionDepartments();


        // ==================================================
        // DEPARTMENT CHANGE EVENT
        // ==================================================

        departmentSelect.addEventListener(
            "change",
            function() {

                const departmentId =
                    this.value;


                console.log(
                    "Selected Department ID:",
                    departmentId
                );


                // ==================================================
                // LOAD BUDGET ITEMS FOR SELECTED DEPARTMENT
                // ==================================================

                loadBudgetItemsForDepartment(
                    departmentId
                );

            }
        );

    }
);