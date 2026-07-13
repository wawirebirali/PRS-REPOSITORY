
// ================= APPROVAL =================
function submitApproval() {

    if (!selectedDocumentId || !selectedAction) {
        alert("Select document and action first");
        return;
    }

    // Get current status from the slip
    const hodStatus = document.getElementById("hod_status").innerText.trim();

    // Prevent approving twice
    if (hodStatus === "APPROVED") {
        alert("This requisition has already been approved.");
        return;
    }

    // Prevent rejecting after approval
    if (hodStatus === "REJECTED") {
        alert("This requisition has already been rejected.");
        return;
    }

    fetch("/hod/approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            document_id: selectedDocumentId,
            module_name: "PRS",
            action: selectedAction
        })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            alert(data.message);
            return;
        }

        alert("Success");
        location.reload();

    })
    .catch(err => {
        console.error(err);
        alert("Server error");
    });
}

let pendingAction = null;

function confirmApproval(action) {
    pendingAction = action;

    const prsNo = document.getElementById("prs_no").innerText || "-";

    if (action === "APPROVED") {
        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to approve <b>${prsNo}</b>?`;
    } else {
        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to reject <b>${prsNo}</b>?`;
    }

    document.getElementById("confirmModal").style.display = "block";
}

function confirmQuotationApproval(action) {
    if (!selectedQuotationId) {
        alert("Please select a quotation first");
        return;
    }

    quotationPendingAction = action;
    const documentNo = document.getElementById("qrfNumber").innerText || "-";
    const moduleLabel = quotationViewMode === "quotation" ? "quotation" : "quotation request";

    document.getElementById("confirmMessage").innerHTML =
        action === "APPROVED"
            ? `Are you sure you want to approve ${moduleLabel} <b>${documentNo}</b>?`
            : `Are you sure you want to reject ${moduleLabel} <b>${documentNo}</b>?`;

    document.getElementById("confirmModal").style.display = "block";
}

function approveQuotation() {
    confirmQuotationApproval("APPROVED");
}

function rejectQuotation() {
    confirmQuotationApproval("REJECTED");
}

function printQuotation() {
    window.print();
}

function autoLoadFirstRequisition() {

    const firstRow = document.querySelector("#prsTable tbody tr");

    if (firstRow) {
        loadSlipFromRow(firstRow);
    }
}














// GLOBAL VARIABLES
let selectedGRNId = null;
let grnPendingAction = null;


// =======================================================
// APPROVE / REJECT BUTTON CLICK
// =======================================================
function confirmGRNApproval(action) {

    // Ensure a GRN is selected
    if (!selectedGRNId) {
        alert("Please select a goods receipt note first");
        return;
    }

    grnPendingAction = action;

    const grnNumber =
        document.getElementById("grnNumber").innerText || "-";

    if (action === "APPROVED") {

        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to approve <b>${grnNumber}</b>?`;

    } else {

        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to reject <b>${grnNumber}</b>?`;

    }

    document.getElementById("confirmModal").style.display = "block";
}


// =======================================================
// CLOSE MODAL
// =======================================================
function closeModal() {
    document.getElementById("confirmModal").style.display = "none";

    pendingAction = null;
    quotationPendingAction = null;
    invoicePendingAction = null;
    pOpendingAction = null;
    grnPendingAction = null;
    paymentPendingAction = null;
}


// =======================================================
// CONFIRM BUTTON IN MODAL
// =======================================================



// =======================================================
// SEND APPROVAL TO SERVER
// =======================================================
function approveGRN() {

    // Ensure GRN selected
    if (!selectedGRNId) {
        alert("Please select a goods receipt note first");
        return;
    }

    // Ensure action selected
    if (!grnPendingAction) {
        alert("Please choose approve or reject");
        return;
    }

    const hodStatus =
        document.getElementById("grn_hod_Status")
            .innerText
            .trim()
            .toUpperCase();

    // Prevent double approval
    if (hodStatus === "APPROVED") {
        alert("This goods receipt note has already been approved.");
        return;
    }

    // Prevent double rejection
    if (hodStatus === "REJECTED") {
        alert("This goods receipt note has already been rejected.");
        return;
    }

    fetch("/hod/approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            document_id: selectedGRNId,
            module_name: "GRN",
            action: grnPendingAction
        })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            alert(data.message || "Approval failed");
            return;
        }

        alert("Goods Receipt Note updated successfully.");

        // Refresh GRN details
        loadGRNData();

        if (selectedGRNId) {
            const radio = document.querySelector(
                `input[data-grn-id="${selectedGRNId}"]`
            );

            if (radio) {
                selectGRN(radio);
            }
        }
    })
    .catch(error => {
        console.error(error);
        alert("Server error while processing approval.");
    });
}






function confirmInvoice(action) {
    if (!selectedInvoiceId) {
        alert("Please select an invoice first");
        return;
    }

    invoicePendingAction = action;

    const invoiceNumber = document.getElementById("i_invoice_number").innerText || "-";
    document.getElementById("confirmMessage").innerHTML =
        action === "APPROVED"
            ? `Are you sure you want to approve invoice <b>${invoiceNumber}</b>?`
            : `Are you sure you want to reject invoice <b>${invoiceNumber}</b>?`;

    document.getElementById("confirmModal").style.display = "block";
}

function approveInvoice() {
    confirmInvoice("APPROVED");
}

function rejectInvoice() {
    confirmInvoice("REJECTED");
}





function sendPaymentApproval() {
    if (!selectedPaymentId) {
        alert("Please select a payment first");
        return;
    }

    if (!paymentPendingAction) {
        alert("Please choose approve or reject");
        return;
    }

    const status = document.getElementById("payStatus").innerText.trim().toUpperCase();

    if (status === "APPROVED") {
        alert("This payment has already been approved.");
        return;
    }

    if (status === "REJECTED") {
        alert("This payment has already been rejected.");
        return;
    }

    fetch("/hod/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            document_id: selectedPaymentId,
            module_name: "PAYMENT",
            action: paymentPendingAction
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.message || "Payment approval failed");
            return;
        }

        alert("Payment updated successfully.");
        loadPaymentData();
    })
    .catch(err => {
        console.error(err);
        alert("Server error while processing payment approval.");
    });
}

function sendInvoiceApproval() {
    if (!selectedInvoiceId) {
        alert("Please select an invoice first");
        return;
    }

    if (!invoicePendingAction) {
        alert("Please choose approve or reject");
        return;
    }

    const status = document.getElementById("i_status").innerText.trim().toUpperCase();

    if (status === "APPROVED") {
        alert("This invoice has already been approved.");
        return;
    }

    if (status === "REJECTED") {
        alert("This invoice has already been rejected.");
        return;
    }

    fetch("/hod/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            document_id: selectedInvoiceId,
            module_name: "INVOICE",
            action: invoicePendingAction
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.message || "Invoice approval failed");
            return;
        }

        alert("Invoice updated successfully.");
        invoicePendingAction = null;
        loadInvoices();
        if (selectedInvoiceId) {
            const radio = document.querySelector(`input[data-invoice-id="${selectedInvoiceId}"]`);
            if (radio) selectInvoice(radio);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Server error while processing invoice approval.");
    });
}

function sendQuotationApproval() {
    if (!selectedQuotationId) {
        alert("Please select a quotation first");
        return;
    }

    if (!quotationPendingAction) {
        alert("Please choose approve or reject");
        return;
    }

    const moduleName = quotationViewMode === "quotation" ? "QUOTATION" : "QRF";

    fetch("/hod/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            document_id: selectedQuotationId,
            module_name: moduleName,
            action: quotationPendingAction
        })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.message || "Quotation approval failed");
            return;
        }

        alert("Quotation updated successfully.");
        if (quotationViewMode === "quotation") {
            loadQuotations();
        } else {
            loadQuotationRequests();
        }
    })
    .catch(err => {
        console.error(err);
        alert("Server error while processing quotation approval.");
    });
}




let selectedPaymentId = null;
let paymentPendingAction = null;

function confirmPayment(action) {
    if (!selectedPaymentId) {
        alert("Please select a payment first");
        return;
    }

    paymentPendingAction = action;
    const paymentNo = document.getElementById("payNumber").innerText || "-";

    document.getElementById("confirmMessage").innerHTML =
        action === "APPROVED"
            ? `Are you sure you want to approve payment <b>${paymentNo}</b>?`
            : `Are you sure you want to reject payment <b>${paymentNo}</b>?`;

    document.getElementById("confirmModal").style.display = "block";
}

function approvePayment() {
    confirmPayment("APPROVED");
}

function rejectPayment() {
    confirmPayment("REJECTED");
}

function executeApproval() {
    if (paymentPendingAction) {
        sendPaymentApproval();
    } else if (invoicePendingAction) {
        sendInvoiceApproval();
    } else if (quotationPendingAction) {
        sendQuotationApproval();
    } else if (pOpendingAction) {
        approvePO();
    } else if (grnPendingAction) {
        approveGRN();
    } else if (pendingAction) {
        setAction(pendingAction);
        submitApproval();
    }
    closeModal();
}




// =======================================================
// APPROVE / REJECT BUTTON CLICK
// =======================================================
function confirmPoApproval(action) {

    // Ensure a PO is selected
    if (!selectedPOId) {
        alert("Please select a purchase order first");
        return;
    }

    pOpendingAction = action;

    const poNumber =
        document.getElementById("poNumber").innerText || "-";

    if (action === "APPROVED") {

        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to approve <b>${poNumber}</b>?`;

    } else {

        document.getElementById("confirmMessage").innerHTML =
            `Are you sure you want to reject <b>${poNumber}</b>?`;

    }

    document.getElementById("confirmModal").style.display = "block";
}


// =======================================================
// CLOSE MODAL
// =======================================================
function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
}


// =======================================================
// CONFIRM BUTTON IN MODAL
// =======================================================



// =======================================================
// SEND APPROVAL TO SERVER
// =======================================================
function approvePO() {

    // Ensure PO selected
    if (!selectedPOId) {
        alert("Please select a purchase order first");
        return;
    }

    // Ensure action selected
    if (!pOpendingAction) {
        alert("Please choose approve or reject");
        return;
    }

    const hodStatus =
        document.getElementById("po_hod_Status")
            .innerText
            .trim()
            .toUpperCase();

    // Prevent double approval
    if (hodStatus === "APPROVED") {
        alert("This purchase order has already been approved.");
        return;
    }

    // Prevent double rejection
    if (hodStatus === "REJECTED") {
        alert("This purchase order has already been rejected.");
        return;
    }

    fetch("/hod/approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            document_id: selectedPOId,
            module_name: "PO",
            action: pOpendingAction
        })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            alert(data.message || "Approval failed");
            return;
        }

        alert("Purchase Order updated successfully.");

        // Refresh PO details
        loadPOModule();

        if (selectedPOId) {
            const radio = document.querySelector(
                `input[data-po-id="${selectedPOId}"]`
            );

            if (radio) {
                selectPO(radio);
            }
        }
    })
    .catch(error => {
        console.error(error);
        alert("Server error while processing approval.");
    });
}
