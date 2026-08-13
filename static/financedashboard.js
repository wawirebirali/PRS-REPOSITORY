
// ==============================
// SEARCH PRS
// ==============================
function searchPRS() {

    let input = document.getElementById("prsSearch");
    let filter = input.value.toLowerCase();

    let rows = document.getElementById("prsTable")
        .getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
        let text = rows[i].innerText.toLowerCase();
        rows[i].style.display = text.includes(filter) ? "" : "none";
    }
}
// ==============================
// LOAD PRS LIST (FINANCE MODULE)
// ==============================
// ==============================
// LOAD PRS LIST (FIXED)
// ==============================
// ==============================
// LOAD FINANCE PRS LIST
// ==============================

// ==============================
// LOAD PRS LIST (FINANCE)
// ==============================
function loadFinanceRequisitionModule() {

    fetch("/finance/api/finance_requisition")
        .then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(data => {

            const body = document.getElementById("prsBody");
            body.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                body.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;">No PRS found</td>
                    </tr>`;
                return;
            }

            data.forEach(item => {

                const row = document.createElement("tr");

                // ==============================
                // ROW CONTENT
                // ==============================
                row.innerHTML = `
                    <td style="text-align:center;">
                        <input
                            type="radio"
                            name="financeRequisition"
                            value="${item.requisition_id}"
                            onchange="selectFinanceRequisition(${item.requisition_id})"
                        >
                    </td>

                    <td>${item.prs_no ?? "-"}</td>

                    <td>${item.department_name ?? "-"}</td>

                    <td>
                        ${item.final_status ?? item.status ?? "PENDING"}
                    </td>

                    <td>${item.submission_date ?? "-"}</td>

                    <td>${item.due ?? "-"}</td>
                `;

                // ==============================
                // CLICK EVENT (LOAD DETAILS)
                // ==============================
                row.addEventListener("click", function () {

                    loadRequisitionDetails(item.requisition_id);

                    // highlight selected row
                    document.querySelectorAll("#prsBody tr")
                        .forEach(r => r.classList.remove("selected"));

                    this.classList.add("selected");
                });

                body.appendChild(row);
            });
        })
        .catch(err => {
            console.error("PRS LIST ERROR:", err);
            alert("Failed to load PRS list");
        });
}


// ==============================
// LOAD PRS DETAILS (SLIP PANEL)
// ==============================
function loadRequisitionDetails(reqId) {

    fetch("/finance/api/finance_requisitiondetails/" + reqId)
        .then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(data => {

            console.log("DETAILS:", data);

            // ==============================
            // HEADER INFO
            // ==============================
            document.getElementById("prs_no").innerText = data.prs_no ?? "-";
            document.getElementById("dept").innerText = data.department ?? "-";
            document.getElementById("submission").innerText = data.submission_date ?? "-";

            document.getElementById("hod_status").innerText = data.hod_status ?? "PENDING";
            document.getElementById("ceo_status").innerText = data.ceo_status ?? "PENDING";

            document.getElementById("hod_approval_date").innerText =
                data.hod_approved_at ?? "-";

            document.getElementById("ceo_approval_date").innerText =
                data.ceo_approved_at ?? "-";

            // ==============================
            // ITEMS TABLE
            // ==============================
            const tbody = document.getElementById("items_body");
            tbody.innerHTML = "";

            if (Array.isArray(data.items) && data.items.length > 0) {

                data.items.forEach((item, i) => {
                    const row = `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${item.material_name ?? "-"}</td>
                            <td>${item.uom ?? "-"}</td>
                            <td>${item.qty_required ?? 0}</td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML("beforeend", row);
                });

            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;">No items found</td>
                    </tr>`;
            }
        })
        .catch(err => {
            console.error("DETAIL ERROR:", err);
            alert("Failed to load PRS details");
        });
}


// ==============================
// AUTO LOAD ON PAGE OPEN
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    loadFinanceRequisitionModule();
});


// ==============================
// OPTIONAL: RELOAD MODULE
// ==============================
function refreshFinancePRS() {
    loadFinanceRequisitionModule();
}

function openModule(moduleId, btn){

    // Hide all modules
    document.querySelectorAll(".module").forEach(mod => {
        mod.classList.remove("active");
    });

    // Show selected module
    const target = document.getElementById(moduleId);
    if(target){
        target.classList.add("active");
    } else {
        console.error("Module not found: " + moduleId);
        return;
    }

    // Update sidebar active state
    document.querySelectorAll(".sidebar button").forEach(b => {
        b.classList.remove("active");
    });

    if(btn){
        btn.classList.add("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadFinanceRequisitionModule();
});





// ==============================
// INVOICE LOADING
// ==============================
// ==============================
// SEARCH INVOICE
// ==============================

// ==============================
// SEARCH INVOICE
// ==============================
function searchInvoice() {

    const input = document.getElementById("invoiceSearch").value.toLowerCase();
    const rows = document.querySelectorAll("#invoiceTable tbody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}


// ==============================
// INIT MODULE (IMPORTANT)
// ==============================
function initInvoiceModule() {
    loadInvoiceModule();
}


// ==============================
// LOAD INVOICE LIST
// ==============================
function loadInvoiceModule() {

    fetch("/finance/finance_invoice_data")
        .then(res => res.json())
        .then(data => {

            const body = document.getElementById("invoiceBody");

            if (!body) {
                console.error("invoiceBody not found in DOM");
                return;
            }

            body.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                body.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;padding:15px;">
                            No invoices found
                        </td>
                    </tr>`;
                return;
            }

            data.forEach(item => {

                const row = document.createElement("tr");
                row.dataset.id = item.invoice_id;

                row.innerHTML = `
                    <td>
                        <input type="radio" name="invoiceSelect">
                    </td>
                    <td>${item.prs_no || "-"}</td>
                    <td>${item.invoice_number || "-"}</td>
                    <td>${item.grn_no || "-"}</td>
                    <td>${item.supplier_name || "-"}</td>
                    <td>${item.department || "-"}</td>
                    <td>${item.final_status || item.status || "PENDING"}</td>
                    <td>${item.invoice_date || "-"}</td>
                `;

                // CLICK HANDLER
                row.addEventListener("click", () => {

                    document.querySelectorAll("#invoiceBody tr")
                        .forEach(r => r.classList.remove("selected"));

                    row.classList.add("selected");

                    const radio = row.querySelector("input[type='radio']");
                    if (radio) radio.checked = true;

                    loadInvoiceDetails(item.invoice_id);
                });

                body.appendChild(row);
            });

        })
        .catch(err => {
            console.error("Invoice load error:", err);
        });
}


// ==============================
// LOAD INVOICE DETAILS
// ==============================
function loadInvoiceDetails(invoiceId) {

    if (!invoiceId) return;

    fetch(`/finance/finance_invoice_details/${invoiceId}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch invoice details");
            return res.json();
        })
        .then(data => {

            // HEADER
            document.getElementById("i_invoice").innerText = data.invoice_number || "-";
            document.getElementById("i_grn").innerText = data.grn_no || "-";
            document.getElementById("i_supplier").innerText = data.supplier_name || "-";
            document.getElementById("i_amount").innerText = data.total_amount || "0";
            document.getElementById("i_date").innerText = data.invoice_date || "-";

            // ITEMS
            const tbody = document.querySelector("#invoiceItemsBody");

            if (!tbody) return;

            tbody.innerHTML = "";

            if (Array.isArray(data.items) && data.items.length > 0) {

                data.items.forEach(item => {

                    const tr = document.createElement("tr");

                    tr.innerHTML = `
                        <td>${item.description || "-"}</td>
                        <td>${item.quantity || "-"}</td>
                        <td>${item.unit_price || "-"}</td>
                        <td>${item.total_price || "-"}</td>
                    `;

                    tbody.appendChild(tr);
                });

            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;">
                            No items found
                        </td>
                    </tr>`;
            }
        })
        .catch(err => {
            console.error("Invoice detail error:", err);
            alert("Failed to load invoice details");
        });
}


// ==============================
// PRINT
// ==============================
function printInvoice() {
    window.print();
}


// ==============================
// AUTO START (VERY IMPORTANT)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    initInvoiceModule();
});

// ==============================
// SHARE QUOTATION REQUEST
// ==============================
function shareQuotation(){

let supplier = document.getElementById("sp_name").innerText

if(supplier=="-"){
alert("Select a supplier first")
return
}

let table = document.getElementById("sharedPRS")

let row = table.insertRow()

row.innerHTML = `
<td>PRS-${Math.floor(Math.random()*1000)}</td>
<td>Quotation Sent</td>
<td>-</td>
`

alert("Quotation request sent to "+supplier)

}





// =========================
// GLOBAL STATE
// =========================
let selectedPaymentId = null;

// =========================
// LOAD PAYMENT NO ON PAGE OPEN
// =========================
function loadPaymentNo() {
    fetch("/finance/next_payment_no")
        .then(res => res.json())
        .then(data => {
            document.getElementById("cp_payment").value = data.payment_no;
        })
        .catch(err => console.error("Payment No Error:", err));
}

// =========================
// INVOICE DROPDOWN / SELECTION
// =========================
function loadInvoices() {
    fetch("/procurement/invoice_data")
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("cp_invoice");
            select.innerHTML = `<option value="">-- Select Invoice --</option>`;

            data.forEach(inv => {
                let option = document.createElement("option");
                option.value = inv.invoice_id;
                option.textContent = inv.invoice_number;
                select.appendChild(option);
            });
        })
        .catch(err => console.error(err));
}











/* FINANCE DASHBOARD*/

function loadPayments() {

    fetch("/finance/payments/api")
        .then(res => res.json())
        .then(res => {

            if (!res.success) {
                alert(res.message || "Failed to load payments");
                return;
            }

            const data = res.data;
            const tbody = document.getElementById("paymentBody");

            tbody.innerHTML = "";

            data.forEach(p => {

                let statusColor = "";

                if (p.status === "APPROVED") {
                    statusColor = "green";
                } else if (p.status === "REJECTED") {
                    statusColor = "red";
                } else {
                    statusColor = "orange";
                }

                const row = `
                    <tr data-id="${p.payment_id}" onclick="selectPayment(this)">
                        <td><input type="radio" name="pay"></td>
                        <td>${p.payment_no}</td>
                        <td>${p.supplier_name}</td>
                        <td>${p.invoice_no}</td>
                        <td>${p.amount_paid}</td>

                        <td style="color:${statusColor}; font-weight:bold;">
                            ${p.status || "PENDING"}
                        </td>

                        <td>${p.payment_date}</td>
                    </tr>
                `;

                tbody.innerHTML += row;
            });

        })
        .catch(err => {
            console.error("Error loading payments:", err);
        });
}

window.onload = function () {
    loadPayments();
};


function selectPayment(row) {

    const id = row.getAttribute("data-id");

    fetch(`/finance/payment/${id}`)
        .then(res => res.json())
        .then(res => {

            if (!res.success) {
                alert("Failed to load slip");
                return;
            }

            const d = res.data;

            document.getElementById("payNumber").innerText = d.payment_no;
            document.getElementById("payInvoice").innerText = d.invoice_no;
            document.getElementById("paySupplier").innerText = d.supplier_name;
            document.getElementById("payAmount").innerText = d.amount;
            document.getElementById("payAmountPaid").innerText = d.amount_paid;
            document.getElementById("payBalance").innerText = d.balance;
            document.getElementById("payMethod").innerText = d.payment_method;
            document.getElementById("payStatus").innerText = d.status;
            document.getElementById("payDate").innerText = d.payment_date;

            const tbody = document.getElementById("paymentItemsBody");
            tbody.innerHTML = "";

            d.items.forEach(i => {
                tbody.innerHTML += `
                    <tr>
                        <td>${i.item_name}</td>
                        <td>${i.quantity}</td>
                        <td>${i.unit_price}</td>
                        <td>${i.total}</td>
                    </tr>
                `;
            });

        })
        .catch(err => console.error(err));
}

function logoutUser() {
    window.location.href = "/logout";
}






