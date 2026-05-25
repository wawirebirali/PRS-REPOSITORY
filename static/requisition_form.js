console.log("JS loaded successfully");

function addRow() {
    const tbody = document.querySelector("#reqTable tbody");
    const rowCount = tbody.rows.length + 1;
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" name="material_name[]" required></td>
        <td><input type="text" name="uom[]" required></td>
        <td><input type="number" name="quantity_in_stock[]" min="0" required></td>
        <td><input type="number" name="quantity_required[]" min="1" required></td>
        <td><input type="date" name="required_date[]" required></td>
        <td><input type="text" name="remark[]"></td>
    `;

    const today = new Date().toISOString().split("T")[0];
    row.querySelector('input[type="date"]').min = today;

    tbody.appendChild(row);
}

function removeRow() {
    const tbody = document.querySelector("#reqTable tbody");
    if (tbody.rows.length > 0) {
        tbody.deleteRow(tbody.rows.length - 1);
        Array.from(tbody.rows).forEach((row, index) => {
            row.cells[0].innerText = index + 1;
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("submission_date").value = today;

    for (let i = 0; i < 5; i++) {
        addRow();
    }
});

