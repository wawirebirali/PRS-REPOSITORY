
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