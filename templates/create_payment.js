
// =========================
// SAVE PAYMENT
// =========================
function savePayment() {

    const data = {
        invoice_id: document.getElementById("cp_invoice").value,
        payment_method: document.getElementById("cp_method").value,
        amount: document.getElementById("cp_amount").value,
        amount_paid: document.getElementById("cp_amountpaid").value,
        balance: document.getElementById("cp_balance").value,
        payment_date: document.getElementById("cp_date").value,
        remarks: document.getElementById("cp_remarks").value
    };

    fetch("/finance/create_payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {

        if (res.success) {
            alert("Payment Created Successfully: " + res.payment_no);

            // optional reset (not really needed since you're leaving page)
            loadPaymentNo();

            document.getElementById("cp_amountpaid").value = "";
            document.getElementById("cp_balance").value = "";
            document.getElementById("cp_invoice").value = "";
            document.getElementById("cp_supplier").value = "";
            document.getElementById("cp_amount").value = "";

            // ✅ redirect to finance dashboard
            window.location.href = "/finance/dashboard";
        } else {
            alert(res.message || "Failed to create payment");
        }

    })
    .catch(err => console.error(err));
}
// =========================
// PAYMENT TABLE SEARCH
// =========================
function searchPayments() {
    let input = document.getElementById("paymentSearch").value.toLowerCase();
    let rows = document.querySelectorAll("#paymentTable tbody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}


// =========================
// UI CONTROLS
// =========================
function showCreatePaymentForm() {
    document.getElementById("createPaymentForm").style.display = "block";
}

function hideCreatePaymentForm() {
    document.getElementById("createPaymentForm").style.display = "none";
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadPaymentNo();
    loadInvoices();
});




// =========================
// BALANCE CALCULATION
// =========================
function calculateBalance() {
    const amount = parseFloat(document.getElementById("cp_amount").value || 0);
    const paid = parseFloat(document.getElementById("cp_amountpaid").value || 0);

    document.getElementById("cp_balance").value = (amount - paid).toFixed(2);
}




// =========================
// WHEN INVOICE CHANGES
// =========================
function onInvoiceChange() {

    const invoiceId = document.getElementById("cp_invoice").value;

    if (!invoiceId) {

        document.getElementById("cp_supplier").value = "";
        document.getElementById("cp_amount").value = "";
        document.getElementById("cp_prs").value = "";
        document.getElementById("cp_po").value = "";

        calculateBalance();
        return;
    }

    fetch(`/finance/api/invoice/${invoiceId}`)
        .then(res => res.json())
        .then(data => {

            console.log(data);

            // =========================
            // AUTO FILL ALL FIELDS
            // =========================
            document.getElementById("cp_supplier").value = data.supplier_name || "-";
            document.getElementById("cp_amount").value = data.total_amount || 0;

            document.getElementById("cp_prs").value = data.prs_no || "-";
            document.getElementById("cp_po").value = data.po_number || "-";

            calculateBalance();
        })
        .catch(err => console.error("Invoice load error:", err));
}
