let quotationViewMode = "request";

// =========================================
// GLOBAL SELECTED INVOICE
// =========================================
let selectedInvoiceId = null;
let invoicePendingAction = null;


let approvalUrl = "/ceo/approve";

let selectedDocumentId = null;
let selectedQuotationId = null;
let quotationPendingAction = null;
let selectedQuotationMode = null;




// =======================================================
// CEO REQUISITION MODULE
// =======================================================

let selectedRequisitionId = null;
let requisitionPendingAction = null;



// GLOBAL VARIABLES
let selectedGRNId = null;
let grnPendingAction = null;




function openModule(id,btn){

    if (id === "quotationRequest") {
        quotationViewMode = "request";
        id = "quotation";
    } else if (id === "quotation") {
        quotationViewMode = "quotation";
    }

    selectedQuotationId = null;
    selectedQuotationMode = null;

    document.querySelectorAll(".module").forEach(m=>m.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".sidebar button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    if(id === "supplier"){
        loadSupplierModule();
    }

    if(id === "quotation"){
        if (quotationViewMode === "request") {
            loadQuotationRequests();
        } else {
            loadQuotations();
        }
    }

    if(id === "purchaseOrder"){
        loadPOModule();
    }
    if(id === "invoice"){
        loadInvoices();
    }

    if(id === "grn"){
        loadGRNData();
    }

    if(id === "insights"){
        requestAnimationFrame(() => {
            loadCEODashboard();
            window.dispatchEvent(new Event("resize"));
        });
    }
}

// ================= REQUISITION MODULE =================

// ================= REQUISITION MODULE =================



// =======================================================
// LOAD CEO REQUISITIONS TABLE
// =======================================================

async function loadRequisitionData(){

    try {

        const response = await fetch("/ceo/api/requisitions");

        if(!response.ok){
            throw new Error(
                "Requisition API failed: " + response.status
            );
        }


        const data = await response.json();

        console.log("CEO REQUISITIONS:", data);


        if(!data.success){

            alert(data.message || "Failed loading requisitions");
            return;

        }


        const tbody =
        document.getElementById("prsTableBody");


        if(!tbody){

            console.error(
                "prsTableBody not found"
            );

            return;
        }


        tbody.innerHTML = "";


        if(!data.requisitions || data.requisitions.length === 0){

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No requisitions found
                    </td>
                </tr>
            `;

            return;
        }



        data.requisitions.forEach(req=>{


            const row =
            document.createElement("tr");


            row.dataset.id =
            req.requisition_id;



            row.innerHTML = `

                <td>
                    <input 
                    type="radio"
                    name="selectedPRS"
                    data-prs-id="${req.requisition_id}">
                </td>


                <td>
                    ${req.prs_no || "-"}
                </td>


                <td>
                    ${req.department_name || "-"}
                </td>


                <td>
                    ${req.ceo_status || "PENDING"}
                </td>


                <td>
                    ${formatDate(req.submission_date)}
                </td>


                <td>
                    ${req.due || "-"}
                </td>


                <td>
                    ${req.final_status || "-"}
                </td>

            `;



            row.addEventListener(
                "click",
                ()=>{


                    document
                    .querySelectorAll("#prsTableBody tr")
                    .forEach(r=>
                        r.classList.remove("selected")
                    );


                    row.classList.add("selected");


                    const radio =
                    row.querySelector(
                        "input[type='radio']"
                    );


                    radio.checked = true;


                    loadRequisitionDetails(
                        req.requisition_id
                    );


                }
            );


            tbody.appendChild(row);


        });



    }

    catch(error){

        console.error(
            "LOAD REQUISITION ERROR:",
            error
        );

    }

}


// =======================================================
// PAGE INITIAL LOAD
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("CEO DASHBOARD DOM READY");


    // Load CEO requisitions
    loadRequisitionData();


    // Load other modules only when needed
    // They are loaded by openModule()

});


// =======================================================
// LOAD SINGLE REQUISITION DETAILS
// =======================================================


async function loadRequisitionDetails(id){


    selectedRequisitionId = id;


    try{


        const response =
        await fetch(
            `/ceo/requisition_details/${id}`
        );


        if(!response.ok){

            throw new Error(
                "Details API failed "
                + response.status
            );

        }


        const data =
        await response.json();



        console.log(
            "REQUISITION DETAILS:",
            data
        );



        if(!data.success){

            alert(
                data.message ||
                "Unable to load details"
            );

            return;

        }



        const r =
        data.requisition;



        // HEADER

        setText(
            "prs_no",
            r.prs_no
        );


        setText(
            "department_name",
            r.department_name
        );


        setText(
            "submission",
            formatDate(r.submission_date)
        );


        setText(
            "hod_status",
            r.hod_status || "PENDING"
        );


        setText(
            "ceo_status",
            r.ceo_status || "PENDING"
        );




        // CREATED BY

        setText(
            "created_by_name",
            r.created_by_name
        );


        setText(
            "created_date",
            formatDate(r.submission_date)
        );



        // HOD

        setText(
            "hod_username",
            r.hod_username
        );


        setText(
            "hod_approval_date",
            formatDate(r.hod_approved_at)
        );


        setImage(
            "sig_hod",
            r.hod_signature
        );




        // CEO

        setText(
            "ceo_username",
            r.ceo_username
        );


        setText(
            "ceo_approval_date",
            formatDate(r.ceo_approved_at)
        );


        setImage(
            "sig_ceo",
            r.ceo_signature
        );





        // ITEMS

        const tbody =
        document.getElementById(
            "items_body"
        );


        tbody.innerHTML="";


        if(data.items){


            data.items.forEach(
                (item,index)=>{


                    tbody.innerHTML += `

                    <tr>

                    <td>${index+1}</td>

                    <td>
                    ${item.material_name || "-"}
                    </td>


                    <td>
                    ${item.uom || "-"}
                    </td>


                    <td>
                    ${item.qty_required || 0}
                    </td>


                    </tr>

                    `;


                }
            );

        }



    }

    catch(error){

        console.error(
            "DETAIL ERROR:",
            error
        );

    }

}





// =======================================================
// CEO APPROVAL SEND
// =======================================================

// =======================================================
// SUBMIT REQUISITION APPROVAL
// =======================================================


// =======================================================
// HOD REQUISITION APPROVAL
// =======================================================


async function submitApproval() {

    // Ensure requisition is selected
    if (!selectedRequisitionId) {
        alert("Please select a requisition first.");
        return;
    }

    // Ensure action is selected
    if (!requisitionPendingAction) {
        alert("Please choose approve or reject.");
        return;
    }

    // Read current statuses
    const getStatus = (id) => (
        document.getElementById(id)?.innerText || "PENDING"
    ).trim().toUpperCase();

    const hodStatus = getStatus("hod_status");
    const ceoStatus = getStatus("ceo_status");
    const finalStatus = getStatus("final_status");

    // Prevent action on completed requisition
    if (finalStatus === "COMPLETED") {
        alert("This requisition is completed. No further action is allowed.");
        return;
    }

    // CEO must wait for HOD approval
    if (ceoStatus !== "APPROVED") {

        if (ceoStatus === "REJECTED") {
            alert(
                "You cannot process this requisition because it has been rejected by the CEO."
            );
        } else {
            alert(
                "You cannot approve or reject this requisition before the CEO approves it."
            );
        }

        return;
    }

    // Prevent duplicate CEO decisions
    if (ceoStatus === "APPROVED") {
        alert("This requisition has already been approved by the CEO.");
        return;
    }

    if (ceoStatus === "REJECTED") {
        alert("This requisition has already been rejected by the CEO.");
        return;
    }

    const documentId = selectedRequisitionId;
    const action = requisitionPendingAction;

    try {

        const response = await fetch("/ceo/approve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                document_id: documentId,
                module_name: "PRS",
                action: action
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.message || "CEO approval failed.");
            return;
        }

        alert(
            action === "APPROVED"
                ? "Requisition approved successfully by the CEO."
                : "Requisition rejected successfully by the CEO."
        );

        selectedRequisitionId = null;
        requisitionPendingAction = null;

        closeModal();
        await loadRequisitionData();

    } catch (error) {
        console.error("CEO APPROVAL ERROR:", error);
        alert("Server error while processing CEO approval.");
    }
}


function confirmRequisitionApproval(action) {

    if (!selectedRequisitionId) {

        alert("Select requisition first");
        return;
    }

    requisitionPendingAction = action;

    const prs =
        document.getElementById("prs_no")?.innerText || "-";

    document.getElementById("confirmMessage").innerHTML =
        action === "APPROVED"
            ? `Are you sure you want to approve <b>${prs}</b>?`
            : `Are you sure you want to reject <b>${prs}</b>?`;

    document.getElementById("confirmModal").style.display = "block";
}

// =======================================================
// APPROVE BUTTON
// =======================================================

function approveRequisition() {

    confirmRequisitionApproval(
        "APPROVED"
    );
}


// =======================================================
// REJECT BUTTON
// =======================================================

function rejectRequisition() {

    confirmRequisitionApproval(
        "REJECTED"
    );
}


// =======================================================
// CONFIRM BUTTON INSIDE MODAL
// =======================================================

async function confirmAction() {

    // Do NOT close the modal before approval finishes.
    await submitApproval();

}


// =======================================================
// CLOSE CONFIRMATION MODAL
// =======================================================

function closeModal() {

    const modal =
        document.getElementById("confirmModal");


    if (modal) {

        modal.style.display = "none";
    }
}


// =======================================================
// SET TEXT
// =======================================================

function setText(id, value) {

    const el =
        document.getElementById(id);


    if (el) {

        el.innerText =
            value !== null &&
            value !== undefined &&
            value !== ""
                ? value
                : "-";
    }
}


// =======================================================
// SET IMAGE
// =======================================================

function setImage(id, path) {

    const img =
        document.getElementById(id);


    if (!img) {
        return;
    }


    if (path) {

        img.src =
            path.startsWith("/")
                ? path
                : "/static/" + path;

        img.style.display = "block";

    }
    else {

        img.removeAttribute("src");

        img.style.display = "none";
    }
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
    if (ceoStatus === "APPROVED") {
        alert("This purchase order has already been approved by the CEO.");
        return;
    }

    // Prevent double rejection
    if (ceoStatus === "REJECTED") {
        alert("This purchase order has already been rejected by the CEO.");
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
    if (ceoStatus === "APPROVED") {
        alert("This goods receipt note has already been approved by the CEO.");
        return;
    }

    // Prevent double rejection
    if (ceoStatus === "REJECTED") {
        alert("This goods receipt note has already been rejected by the CEO.");
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

        alert("Goods Receipt Note updated successfully by the CEO.");

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


async function executeApproval() {

    if (paymentPendingAction) {

        await sendPaymentApproval();

    }
    else if (invoicePendingAction) {

        await sendInvoiceApproval();

    }
    else if (quotationPendingAction) {

        await sendQuotationApproval();

    }
    else if (pOpendingAction) {

        await approvePO();

    }
    else if (grnPendingAction) {

        await approveGRN();

    }
    else if (requisitionPendingAction) {

        await submitApproval();

    }

    closeModal();
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

    if (ceoStatus === "APPROVED") {
        alert("This payment has already been approved by the CEO.");
        return;
    }

    if (ceoStatus === "REJECTED") {
        alert("This payment has already been rejected by the CEO.");
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

        alert("Payment updated successfully by the CEO.");
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

    if (ceoStatus === "APPROVED") {
        alert("This invoice has already been approved.");
        return;
    }

    if (ceoStatus === "REJECTED") {
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









function printQuotation() {
    window.print();
}

function autoLoadFirstRequisition() {

    const firstRow = document.querySelector("#prsTable tbody tr");

    if (firstRow) {
        loadSlipFromRow(firstRow);
    }
}



// =======================================================
// PURCHASE ORDER APPROVAL SYSTEM
// =======================================================

// GLOBAL VARIABLES
let selectedPOId = null;
let pOpendingAction = null;



// =======================================================
// LOAD PO DETAILS
// =======================================================
function selectPO(radio) {

    if (!radio || !radio.dataset.poId) {
        alert("Please select a purchase order");
        return;
    }

    const poId = radio.dataset.poId;

    // IMPORTANT
    selectedPOId = poId;

    fetch(`/hod/po_details/${poId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(
                    `PO details request failed: ${res.status}`
                );
            }
            return res.json();
        })
        .then(data => {

            if (data.error) {
                alert(data.error);
                return;
            }

            // ================= BASIC INFO =================
            document.getElementById("poNumber").innerText =
                data.po_number || "-";

            document.getElementById("poDepartment").innerText =
                data.department_name || "-";

            document.getElementById("poPRS").innerText =
                data.prs_no || "-";

            document.getElementById("poSupplier").innerText =
                data.supplier_name || "-";

            document.getElementById("poDate").innerText =
                data.order_date || "-";

            document.getElementById("poTotal").innerText =
                data.total_amount || "0";

            // ================= STATUS =================
            document.getElementById("po_hod_Status").innerText =
                data.hod_status || "PENDING";

            document.getElementById("po_ceo_Status").innerText =
                data.ceo_status || "PENDING";

            // ================= ITEMS =================
            let itemsBody =
                document.getElementById("poItemsBody");

            itemsBody.innerHTML = "";

            if (data.items && data.items.length > 0) {

                data.items.forEach(item => {

                    itemsBody.innerHTML += `
                        <tr>
                            <td>${item.item_name || "-"}</td>
                            <td>${item.quantity || "-"}</td>
                            <td>${item.unit_price || "-"}</td>
                            <td>${item.total_price || "-"}</td>
                        </tr>
                    `;
                });

            } else {

                itemsBody.innerHTML = `
                    <tr>
                        <td colspan="4">
                            No items found
                        </td>
                    </tr>
                `;
            }

            const resolveSignatureSrc = signaturePath => {
                if (!signaturePath) return "";
                if (signaturePath.startsWith("/")) return signaturePath;
                if (signaturePath.startsWith("static/")) return `/${signaturePath}`;
                return `/static/${signaturePath}`;
            };

            // ================= PREPARED BY =================
            document.getElementById("poPreparedBy").innerText =
                data.created_by?.username || "-";
            document.getElementById("poPreparedDate").innerText =
                data.order_date ? formatDate(data.order_date) : "-";

            const preparedBySig = document.getElementById("poPreparedBySig");
            if (data.created_by?.signature) {
                preparedBySig.src = resolveSignatureSrc(data.created_by.signature);
                preparedBySig.style.display = "block";
            } else {
                preparedBySig.src = "";
                preparedBySig.style.display = "none";
            }

            // ================= HOD =================
            document.getElementById("po_hod_Approval").innerText =
                data.hod_name || "-";

            document.getElementById("po_hod_ApprovalDate").innerText =
                data.hod_approved_at || "-";

            const hodSig = document.getElementById("poHodSig");
            if (data.hod_signature) {
                hodSig.src = resolveSignatureSrc(data.hod_signature);
                hodSig.style.display = "block";
            } else {
                hodSig.src = "";
                hodSig.style.display = "none";
            }

            // ================= CEO =================
            document.getElementById("po_ceo_Approval").innerText =
                data.ceo_name || "-";

            document.getElementById("po_ceo_ApprovalDate").innerText =
                data.ceo_approved_at || "-";

            const ceoSig = document.getElementById("poCeoSig");
            if (data.ceo_signature) {
                ceoSig.src = resolveSignatureSrc(data.ceo_signature);
                ceoSig.style.display = "block";
            } else {
                ceoSig.src = "";
                ceoSig.style.display = "none";
            }

        })
        .catch(error => {
            console.error(error);
            alert("Failed to load purchase order details.");
        });
}


// =======================================================
// LOAD PO LIST
// =======================================================
function loadPOModule() {

    fetch("/ceo/po_data")
        .then(res => {
            if (!res.ok) {
                throw new Error(
                    `PO list request failed: ${res.status}`
                );
            }

            return res.json();
        })
        .then(data => {

            const body =
                document.getElementById("poBody");

            body.innerHTML = "";

            if (!data || data.length === 0) {

                body.innerHTML = `
                    <tr>
                        <td colspan="7"
                            style="text-align:center;">
                            No purchase orders found.
                        </td>
                    </tr>
                `;

                return;
            }

            data.forEach((item, index) => {

                const row =
                    document.createElement("tr");

                row.innerHTML = `
                    <td>
                        <input
                            type="radio"
                            name="poSelect"
                            data-po-id="${item.purchase_order_id}">
                    </td>

                    <td>${item.po_number || "-"}</td>
                    <td>${item.prs_no || "-"}</td>
                    <td>${item.supplier_name || "-"}</td>
                    <td>${item.final_status || "-"}</td>
                    <td>${item.department || "-"}</td>
                    <td>${item.order_date || "-"}</td>
                `;

                row.addEventListener("click", () => {

                    const radio =
                        row.querySelector(
                            "input[name='poSelect']"
                        );

                    radio.checked = true;

                    document
                        .querySelectorAll("#poBody tr")
                        .forEach(r =>
                            r.classList.remove("selected")
                        );

                    row.classList.add("selected");

                    selectPO(radio);
                });

                body.appendChild(row);

                // Auto-load first PO
                if (index === 0) {

                    const radio =
                        row.querySelector(
                            "input[name='poSelect']"
                        );

                    radio.checked = true;

                    row.classList.add("selected");

                    selectPO(radio);
                }

            });
        })
        .catch(error => {
            console.error(error);
            alert("Failed to load purchase orders.");
        });
}
// =======================================================
// SAFE HELPERS
// =======================================================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "-";
}

function setImage(id, src) {
    const el = document.getElementById(id);

    if (!el) return;

    if (src) {
        el.src = "/static/" + src;
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}

function sharePOWhatsAppPDF() {

    const element = document.getElementById("poPrintArea");

    if (!element) {
        alert("PO slip not found");
        return;
    }

    // ================= PDF OPTIONS =================
    const opt = {
        margin: 0.5,
        filename: `PO_${document.getElementById("poNumber")?.innerText || "document"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // ================= CREATE PDF =================
    html2pdf().set(opt).from(element).outputPdf('blob').then(function (pdfBlob) {

        // Convert blob → file URL
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // WhatsApp message (with link)
        const message = `
📦 Purchase Order Document

PO Number: ${document.getElementById("poNumber").innerText}
Supplier: ${document.getElementById("poSupplier").innerText}

👉 View/Download PDF:
${pdfUrl}
        `;

        const whatsappUrl =
            "https://wa.me/?text=" + encodeURIComponent(message);

        window.open(whatsappUrl, "_blank");
    });
}




// =======================================================
// LOAD ALL GRN DATA
// =======================================================
async function loadGRNData() {

    try {

        const response = await fetch("/ceo/ceo_grn_data");

        const data = await response.json();

        const tbody = document.getElementById("grnBody");

        tbody.innerHTML = "";

        data.forEach(grn => {

            tbody.innerHTML += `

                <tr onclick="loadGRNDetails(${grn.grn_id})">

                    <td>
                        <input 
                            type="radio"
                            name="selectedGRN"
                            data-grn-id="${grn.grn_id}"
                            value="${grn.grn_id}"
                        >
                    </td>

                    <td>${grn.grn_no || ''}</td>

                    <td>${grn.prs_no || ''}</td>

                    <td>${grn.supplier_name || ''}</td>

                    <td>${grn.final_status || ''}</td>

                    <td>${grn.department || ''}</td>

                    <td>${formatDate(grn.received_date)}</td>

                </tr>

            `;
        });

    }
    catch (error) {

        console.error("Error loading GRN data:", error);
    }
}


// =======================================================
// LOAD SINGLE GRN DETAILS
// =======================================================
async function loadGRNDetails(grnId) {

    selectedGRNId = grnId;

    document.querySelectorAll("#grnBody tr").forEach(r => r.classList.remove("selected"));
    const radio = document.querySelector(`input[data-grn-id="${grnId}"]`);
    if (radio) {
        radio.checked = true;
        radio.closest('tr')?.classList.add('selected');
    }

    try {

        const response = await fetch(`/hod/hod_grn_details/${grnId}`);

        const data = await response.json();

        // ===================================================
        // HEADER
        // ===================================================
        document.getElementById("grnNumber").innerText =
            data.grn_no || "-";

        document.getElementById("grnDate").innerText =
            formatDate(data.received_date);

        document.getElementById("grnPO").innerText =
            data.po_number || "-";

        document.getElementById("grnSupplier").innerText =
            data.supplier_name || "-";

        document.getElementById("grnReceiver").innerText =
            data.received_by || "-";

        document.getElementById("grnStatus").innerText =
    data.final_status || "PENDING";

        document.getElementById("grn_hod_Status").innerText =
            data.hod_status || "PENDING";

        document.getElementById("grn_ceo_Status").innerText =
            data.ceo_status || "PENDING";

        document.getElementById("grnLocation").innerText =
            data.supplier_address || "-";

        document.getElementById("grnReceivingDate").innerText =
            formatDate(data.received_date);

        document.getElementById("grnTotal").innerText =
            data.total_received || 0;

        // ===================================================
        // SIGNATURES
        // ===================================================
        document.getElementById("grnReceiverNameSigText").innerText =
            data.received_by || "-";
        document.getElementById("grnReceiverDateSigText").innerText =
            data.received_date ? formatDate(data.received_date) : "-";

        const receiverImg = document.getElementById("grnReceivedBySig");
        if (data.receiver_signature) {
            receiverImg.src = "/static/" + data.receiver_signature;
            receiverImg.style.display = "block";
        } else {
            receiverImg.src = "";
            receiverImg.style.display = "none";
        }

        document.getElementById("grnHodName").innerText =
            data.hod_name || "-";

        document.getElementById("grnHodDate").innerText =
            data.hod_approved_at ? formatDate(data.hod_approved_at) : "-";

        const hodImg = document.getElementById("grnHodSig");
        if (data.hod_signature) {
            hodImg.src = "/static/" + data.hod_signature;
            hodImg.style.display = "block";
        } else {
            hodImg.src = "";
            hodImg.style.display = "none";
        }

        document.getElementById("grnCeoName").innerText =
            data.ceo_name || "-";

        document.getElementById("grnCeoDate").innerText =
            data.ceo_approved_at ? formatDate(data.ceo_approved_at) : "-";

        const ceoImg = document.getElementById("grnCeoSig");
        if (data.ceo_signature) {
            ceoImg.src = "/static/" + data.ceo_signature;
            ceoImg.style.display = "block";
        } else {
            ceoImg.src = "";
            ceoImg.style.display = "none";
        }

        // ===================================================
        // ITEMS
        // ===================================================
        const tbody = document.getElementById("grnItemsBody");

        tbody.innerHTML = "";

        data.items.forEach(item => {

            tbody.innerHTML += `

                <tr>

                    <td>${item.material_name || ''}</td>

                    <td>${item.description || ''}</td>

                    <td>${item.quantity_ordered || 0}</td>

                    <td>${item.quantity_received || 0}</td>

                    <td>${item.balance || 0}</td>

                </tr>

            `;
        });

    }
    catch (error) {

        console.error("Error loading GRN details:", error);
    }
}

function selectGRN(radio) {
    if (!radio || !radio.dataset.grnId) {
        alert("Please select a goods receipt note first");
        return;
    }

    selectedGRNId = radio.dataset.grnId;

    document.querySelectorAll("#grnBody tr").forEach(r => r.classList.remove("selected"));
    radio.checked = true;
    radio.closest('tr')?.classList.add('selected');

    loadGRNDetails(selectedGRNId);
}








// =======================================================
// GET SELECTED GRN ID
// =======================================================
function getSelectedGRN() {

    const selected = document.querySelector(
        'input[name="selectedGRN"]:checked'
    );

    if (!selected) {

        alert("Please select a GRN");

        return null;
    }

    return selected.value;
}





// =======================================================
// SHARE EMAIL
// =======================================================
function shareGRNEmail() {

    const grnNo =
        document.getElementById("grnNumber").innerText;

    const supplier =
        document.getElementById("grnSupplier").innerText;

    const body = `

GRN Number: ${grnNo}
Supplier: ${supplier}

Goods Received Successfully.

    `;

    window.location.href =
        `mailto:?subject=GRN ${grnNo}&body=${encodeURIComponent(body)}`;
}


// =======================================================
// FORMAT DATE
// =======================================================
function formatDate(dateString) {

    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString();
}


// =======================================================
// LOAD ON PAGE OPEN
// =======================================================
document.addEventListener(
    "DOMContentLoaded",
    loadGRNData
);



function selectQuotation(radio){
    if(!radio || !radio.dataset.qrfId){
        alert("Please select a quotation request");
        return;
    }

    let qrfId = radio.dataset.qrfId;
    selectedQuotationId = qrfId;
    selectedQuotationMode = "request";
    quotationViewMode = "request";

    fetch(`/hod/quotationRequest_details/${qrfId}`)
        .then(res => {
            if (!res.ok) throw new Error(`Quotation details request failed: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if(data.error){
                alert(data.error);
                return;
            }

            const selectedSupplier = (Array.isArray(data.suppliers) ? data.suppliers.find(s => s.selected_supplier == 1) : null) ||
                (Array.isArray(data.suppliers) && data.suppliers[0]) || {};

            const resolveSignatureSrc = signaturePath => {
                if (!signaturePath) return "";
                return signaturePath.startsWith("/") ? signaturePath : `/static/${signaturePath}`;
            };

            document.getElementById("qrfNumber").innerText = data.qrf_no || "-";
            document.getElementById("qrfPrs").innerText = data.prs_no || "-";
            document.getElementById("qrfDate").innerText = data.request_date || "-";
            document.getElementById("qr_requester").innerText = data.requester_name || "-";
            document.getElementById("qr_department").innerText = data.department || "-";
            document.getElementById("qr_contact").innerText = data.requester_email || "-";
            document.getElementById("sp_to").innerText = selectedSupplier.supplier_name || "-";
            document.getElementById("sp_name").innerText = selectedSupplier.supplier_name || "-";
            document.getElementById("sp_location").innerText = selectedSupplier.address || "-";
            document.getElementById("sp_item").innerText = data.items.length > 0 ? data.items[0].material_name : "-";

            let itemsBody = document.getElementById("sharedPRS");
            itemsBody.innerHTML = "";

            data.items.forEach(item => {
                let itemRow = document.createElement("tr");
                itemRow.innerHTML = `
                    <td>${item.material_name || "-"}</td>
                    <td>${item.description || "-"}</td>
                    <td>${item.quantity || "-"}</td>
                `;
                itemsBody.appendChild(itemRow);
            });

            const preparedSig = document.getElementById("qrfPreparedBySig");
            const preparedName = document.getElementById("qrfPreparedByName");
            const preparedDate = document.getElementById("qrfPreparedByDate");

            if (data.requester_signature) {
                preparedSig.src = resolveSignatureSrc(data.requester_signature);
                preparedSig.style.display = "block";
                preparedName.innerText = data.requester_name || "-";
                preparedDate.innerText = data.request_date || "-";
            } else {
                preparedSig.style.display = "none";
                preparedName.innerText = data.requester_name || "-";
                preparedDate.innerText = "-";
            }

            const hodSig = document.getElementById("qrfHodSig");
            const hodName = document.getElementById("qrfHodName");
            const hodDate = document.getElementById("qrfHodDate");

            if (data.hod_signature) {
                hodSig.src = resolveSignatureSrc(data.hod_signature);
                hodSig.style.display = "block";
                hodName.innerText = data.hod_name || "-";
                hodDate.innerText = data.hod_approved_at || "-";
            } else {
                hodSig.style.display = "none";
                hodName.innerText = "-";
                hodDate.innerText = "-";
            }

            const ceoSig = document.getElementById("qrfCeoSig");
            const ceoName = document.getElementById("qrfCeoName");
            const ceoDate = document.getElementById("qrfCeoDate");

            if (data.ceo_signature) {
                ceoSig.src = resolveSignatureSrc(data.ceo_signature);
                ceoSig.style.display = "block";
                ceoName.innerText = data.ceo_name || "-";
                ceoDate.innerText = data.ceo_approved_at || "-";
            } else {
                ceoSig.style.display = "none";
                ceoName.innerText = "-";
                ceoDate.innerText = "-";
            }
        })
        .catch(error => {
            console.error(error);
            alert("Failed to load quotation details.");
        });
}

function loadQuotationRequests(){
    selectedQuotationId = null;
    selectedQuotationMode = "request";
    quotationViewMode = "request";

    fetch("/ceo/quotationRequest_data")
        .then(res => {
            if (!res.ok) throw new Error(`Quotation request list request failed: ${res.status}`);
            return res.json();
        })
        .then(data => {
            let body = document.getElementById("quotationBody");
            body.innerHTML = "";

            if (!data || data.length === 0) {
                body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:16px;">No quotation requests found.</td></tr>`;
                return;
            }

            data.forEach(item => {
                let row = document.createElement("tr");
                row.style.cursor = "pointer";
                row.innerHTML = `
                    <td><input type="radio" name="quotationSelect" data-qrf-id="${item.qrf_id}"></td>
                    <td>${item.qrf_no || "-"}</td>
                    <td>${item.prs_no || "-"}</td>
                    <td>${item.supplier_name || "-"}</td>
                    <td>${item.status || "-"}</td>
                    <td>${item.department || "-"}</td>
                    <td>${item.request_date || "-"}</td>
                `;
                row.addEventListener("click", () => {
                    const radio = row.querySelector("input[name='quotationSelect']");
                    if (radio) {
                        radio.checked = true;
                        document.querySelectorAll("#quotationBody tr").forEach(r => r.classList.remove("selected"));
                        row.classList.add("selected");
                        quotationViewMode = "request";
                        selectQuotation(radio);
                    }
                });
                body.appendChild(row);
            });
        })
        .catch(error => {
            console.error(error);
            alert("Failed to load quotation request list.");
        });
}

function showSupplierDetails(supplier){
    document.getElementById("supName").innerText = supplier.supplier_name || "-";
    document.getElementById("supContact").innerText = supplier.contact_person || "-";
    document.getElementById("supPhone").innerText = supplier.phone || "-";
    document.getElementById("supEmail").innerText = supplier.email || "-";
    document.getElementById("supAddress").innerText = supplier.address || "-";
    document.getElementById("supTin").innerText = supplier.tin_number || "-";
    document.getElementById("supReg").innerText = supplier.registration_number || "-";
    document.getElementById("supBank").innerText = supplier.bank_name || "-";
    document.getElementById("supAccount").innerText = supplier.account_number || "-";
}

function loadSupplierModule(){
    fetch("/hod/supplier_list")
        .then(res => {
            if (!res.ok) throw new Error(`Supplier list request failed: ${res.status}`);
            return res.json();
        })
        .then(data => {
            let body = document.getElementById("supplierBody");
            body.innerHTML = "";

            if (!data || data.length === 0) {
                body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;">No suppliers found.</td></tr>`;
                showSupplierDetails({});
                return;
            }

            data.forEach(supplier => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${supplier.supplier_name || "-"}</td>
                    <td>${supplier.contact_person || "-"}</td>
                    <td>${supplier.phone || "-"}</td>
                    <td>${supplier.address || "-"}</td>
                    <td>${supplier.email || "-"}</td>
                `;
                row.addEventListener("click", () => {
                    document.querySelectorAll("#supplierBody tr").forEach(r => r.classList.remove("selected"));
                    row.classList.add("selected");
                    showSupplierDetails(supplier);
                });
                body.appendChild(row);
            });

            showSupplierDetails(data[0]);
        })
        .catch(error => {
            console.error(error);
            alert("Failed to load suppliers.");
        });
}


/* inoice*/



// =========================================
// LOAD INVOICE TABLE
// =========================================
async function loadInvoices() {

    try {

        const response = await fetch("/ceo/invoice_data");

        console.log("Status:", response.status);

        const text = await response.text();

        if (!text || text.startsWith("<!DOCTYPE")) {
            console.error("Server returned HTML or empty response");
            return;
        }

        const invoices = JSON.parse(text);

        const tbody = document.getElementById("invoiceBody");
        tbody.innerHTML = "";

        invoices.forEach(inv => {

            tbody.innerHTML += `
                <tr onclick="selectInvoice(this.querySelector('input'))">
                    <td>
                        <input type="radio"
                            data-invoice-id="${inv.invoice_id}"
                            name="invoiceSelect"
                            onclick="event.stopPropagation(); selectInvoice(this)">
                    </td>
                    <td>${inv.prs_no || "-"}</td>
                    <td>${inv.invoice_number || "-"}</td>
                    <td>${inv.po_number || "-"}</td>
                    <td>${inv.supplier_name || "-"}</td>
                    <td>${inv.department_name || "-"}</td>
                    <td>${inv.status || "-"}</td>
                    <td>${inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "-"}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Invoice load error:", err);
    }
}

function selectInvoice(radio) {
    if (!radio || !radio.closest('tr')) {
        alert("Please select an invoice first.");
        return;
    }

    const invoiceId = radio.getAttribute('data-invoice-id');
    if (!invoiceId) {
        alert("Invoice missing ID.");
        return;
    }

    selectedInvoiceId = invoiceId;

    document.querySelectorAll("#invoiceBody tr").forEach(r => r.classList.remove("selected"));
    radio.closest('tr').classList.add('selected');

    loadInvoiceDetails(invoiceId);
}


// =========================================
// LOAD SINGLE INVOICE
// =========================================
async function loadInvoiceDetails(invoiceId) {

    try {

        const response = await fetch(`/hod/hod_invoice_details/${invoiceId}`);
        const data = await response.json();

        console.log(data);

        if (!data.success) {
            alert(data.error || "Failed to load invoice.");
            return;
        }

        // ================= HEADER =================
        document.getElementById("i_invoice_number").textContent =
            data.invoice_number || "-";

        document.getElementById("i_po_number").textContent =
            data.po_number || "-";

        document.getElementById("i_prs_number").textContent =
            data.prs_no || "-";

        document.getElementById("i_department").textContent =
            data.department_name || "-";

        document.getElementById("i_supplier").textContent =
            data.supplier_name || "-";

        document.getElementById("i_date").textContent =
            data.invoice_date || "-";

        document.getElementById("i_amount").textContent =
            data.total_amount || "-";

        document.getElementById("i_status").textContent =
            data.status || "-";

        // ================= ITEMS =================
        const itemsBody = document.getElementById("invoiceItemsBody");
        itemsBody.innerHTML = "";

        data.items.forEach(item => {
            itemsBody.innerHTML += `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit_price}</td>
                    <td>${item.total_price}</td>
                </tr>
            `;
        });

        // ================= CREATOR =================
        document.getElementById("invoice_creator_name").textContent =
            data.creator_name || "-";
        document.getElementById("invoice_creator_date").textContent =
            data.creator_date ? formatDate(data.creator_date) : "-";

        function resolveSignatureSrc(signaturePath) {
            if (!signaturePath) {
                return "";
            }

            if (signaturePath.startsWith("/")) {
                return signaturePath;
            }

            return `/static/${signaturePath}`;
        }

        const creatorSig = document.getElementById(
            "invoice_creator_signature"
        );

        if (data.creator_signature) {
            creatorSig.src = resolveSignatureSrc(data.creator_signature);
            creatorSig.style.display = "block";
        } else {
            creatorSig.style.display = "none";
        }

        // ================= HOD =================
        document.getElementById("invoice_hod_name").textContent =
            data.hod_name || "-";

        document.getElementById("invoice_hod_status").textContent =
            data.hod_status || "PENDING";
        document.getElementById("invoice_hod_date").textContent =
            data.hod_approved_at ? formatDate(data.hod_approved_at) : "-";

        const hodSig = document.getElementById(
            "invoice_hod_signature"
        );

        if (data.hod_signature) {
            hodSig.src = resolveSignatureSrc(data.hod_signature);
            hodSig.style.display = "block";
        } else {
            hodSig.style.display = "none";
        }

        // ================= CEO =================
        document.getElementById("invoice_ceo_name").textContent =
            data.ceo_name || "-";

        document.getElementById("invoice_ceo_status").textContent =
            data.ceo_status || "PENDING";
        document.getElementById("invoice_ceo_date").textContent =
            data.ceo_approved_at ? formatDate(data.ceo_approved_at) : "-";

        const ceoSig = document.getElementById(
            "invoice_ceo_signature"
        );

        if (data.ceo_signature) {
            ceoSig.src = resolveSignatureSrc(data.ceo_signature);
            ceoSig.style.display = "block";
        } else {
            ceoSig.style.display = "none";
        }

    } catch (error) {
        console.error("Invoice details error:", error);
    }
}


// =========================================
// DATE FORMAT
// =========================================
function formatDate(dateString){

    if(!dateString)
        return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString(
        "en-GB",
        {
            year:"numeric",
            month:"short",
            day:"numeric"
        }
    );
}


// =========================================
// AUTO LOAD
// =========================================
document.addEventListener(
    "DOMContentLoaded",
    loadInvoices
);


function logoutUser() {
    window.location.href = "/logout";
}



async function loadPaymentData() {

    try {

        const response = await fetch("/ceo/payments_data");
        const result = await response.json();

        const tableBody = document.getElementById("paymentBody");
        tableBody.innerHTML = "";

        if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No payment records found
                    </td>
                </tr>
            `;
            return;
        }

        result.data.forEach(payment => {

            const row = document.createElement("tr");

            const paymentDate = payment.payment_date
                ? new Date(payment.payment_date).toLocaleDateString()
                : "-";

            row.innerHTML = `
                <td>
                    <input type="radio" name="paymentSelect">
                </td>

                <td>${payment.payment_no || "-"}</td>
                <td>${payment.invoice_number || "-"}</td>
                <td>${payment.supplier_name || "-"}</td>
                <td>${payment.requisition_department || "-"}</td>
                <td>${payment.final_status || "PENDING"}</td>
                <td>${paymentDate}</td>
            `;

            row.addEventListener("click", () => {

                document.querySelectorAll("#paymentBody tr")
                    .forEach(r => r.classList.remove("selected"));

                row.classList.add("selected");

                const radio = row.querySelector("input[type='radio']");
                if (radio) radio.checked = true;

                selectedPaymentId = payment.payment_id;
                loadPaymentDetails(payment.payment_id);
            });

            tableBody.appendChild(row);
        });

    }
    catch (error) {
        console.error("Payment load error:", error);
        alert("Failed to load payment records.");
    }
}



function loadPaymentDetails(payment_id) {

    selectedPaymentId = payment_id;

    fetch(`/hod/payment_details/${payment_id}`)
        .then(res => res.json())
        .then(response => {

            if (!response.success) {
                console.error("Payment not found");
                return;
            }

            const p = response.data;
            const items = response.items || [];

            // ================= PAYMENT INFO =================
            document.getElementById("payNumber").textContent = p.payment_no || "-";
            document.getElementById("payInvoice").textContent = p.invoice_number || "-";
            document.getElementById("paySupplier").textContent = p.supplier_name || "-";

            // ✅ REQUISITION DEPARTMENT (FIXED)
            document.getElementById("payDepartment").textContent =
                p.requisition_department || "-";

            document.getElementById("payAmount").textContent = p.amount || "-";
            document.getElementById("payAmountPaid").textContent = p.amount_paid || "-";
            document.getElementById("payBalance").textContent = p.balance || "-";

            document.getElementById("payMethod").textContent = p.payment_method || "-";
            document.getElementById("payStatus").textContent = p.final_status || "PENDING";

            document.getElementById("payDate").textContent =
                p.payment_date
                    ? new Date(p.payment_date).toLocaleDateString()
                    : "-";

            // ================= ITEMS =================
            const itemsBody = document.getElementById("paymentItemsBody");
            itemsBody.innerHTML = "";

            if (items.length === 0) {

                itemsBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;">
                            No items found
                        </td>
                    </tr>
                `;

            } else {

                items.forEach(item => {

                    itemsBody.innerHTML += `
                        <tr>
                            <td>${item.item_name || "-"}</td>
                            <td>${item.quantity || "-"}</td>
                            <td>${item.unit_price || "-"}</td>
                            <td>${item.total_price || "-"}</td>
                        </tr>
                    `;
                });
            }

            // ================= SIGNATURES =================
            document.getElementById("payment_prepared_name").textContent =
                p.prepared_by || "-";

            const preparedImg = document.getElementById("payment_prepared_signature");
            if (p.prepared_signature) {
                preparedImg.src = "/static/" + p.prepared_signature;
                preparedImg.style.display = "block";
            } else {
                preparedImg.src = "";
                preparedImg.style.display = "none";
            }

            document.getElementById("payment_prepared_date").textContent =
                p.payment_date ? formatDate(p.payment_date) : "-";

            document.getElementById("payment_finance_name").textContent =
                p.hod_name || "-";

            document.getElementById("payment_finance_status").textContent =
                p.hod_status || "PENDING";

            document.getElementById("payment_finance_date").textContent =
                p.hod_approved_at ? formatDate(p.hod_approved_at) : "-";

            const financeImg = document.getElementById("payment_finance_signature");
            if (p.hod_signature) {
                financeImg.src = "/static/" + p.hod_signature;
                financeImg.style.display = "block";
            } else {
                financeImg.src = "";
                financeImg.style.display = "none";
            }

            document.getElementById("payment_ceo_name").textContent =
                p.ceo_name || "-";

            document.getElementById("payment_ceo_status").textContent =
                p.ceo_status || "PENDING";

            document.getElementById("payment_ceo_date").textContent =
                p.ceo_approved_at ? formatDate(p.ceo_approved_at) : "-";

            const ceoImg = document.getElementById("payment_ceo_signature");
            if (p.ceo_signature) {
                ceoImg.src = "/static/" + p.ceo_signature;
                ceoImg.style.display = "block";
            } else {
                ceoImg.src = "";
                ceoImg.style.display = "none";
            }

        })
        .catch(error => {
            console.error("Payment details error:", error);
            alert("Failed to load payment details.");
        });
}

let selectedPaymentId = null;
let paymentPendingAction = null;



document.addEventListener("DOMContentLoaded", () => {
    loadPaymentData();
});



// ================================
// GLOBAL STATE
// ================================
let quotations = [];

// ================================
// LOAD QUOTATION LIST
// ================================
async function loadQuotations() {
    try {
        const res = await fetch("/ceo/quotation_data");
        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        quotations = data.data || [];
        renderQuotationTable(quotations);

    } catch (err) {
        console.error("Error loading quotations:", err);
    }
}

// ================================
// RENDER TABLE
// ================================
function renderQuotationTable(list) {
    const body = document.getElementById("quotationBody");
    body.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:16px;">No quotations found.</td></tr>`;
        return;
    }

    list.forEach(q => {
        const row = document.createElement("tr");
        const radioId = `quotation-${q.quotation_id}`;

        row.innerHTML = `
            <td>
                <input type="radio" id="${radioId}" name="quotationSelect">
            </td>
            <td>${q.quotation_no || "-"}</td>
            <td>${q.qrf_no || "-"}</td>
            <td>${q.supplier_name || "-"}</td>
            <td>${q.final_status || "-"}</td>
            <td>${q.department || "-"}</td>
            <td>${q.created_at || "-"}</td>
        `;

        row.addEventListener("click", () => {
            const radio = row.querySelector(`input[name='quotationSelect']`);
            if (radio) {
                radio.checked = true;
            }
            document.querySelectorAll("#quotationBody tr").forEach(r => r.classList.remove("selected"));
            row.classList.add("selected");
            quotationViewMode = "quotation";
            selectedQuotationId = q.quotation_id;
            loadQuotationDetails(q.quotation_id);
        });

        body.appendChild(row);
    });
}

// ================================
// LOAD QUOTATION DETAILS
// ================================
async function loadQuotationDetails(id) {
    try {
        selectedQuotationId = id;
        selectedQuotationMode = "quotation";

        const res = await fetch(`/hod/quotations/api/${id}`);
        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        const q = data.quotation;

        function resolveSignatureSrc(signaturePath) {
            if (!signaturePath) {
                return "";
            }
            return signaturePath.startsWith("/") ? signaturePath : `/static/${signaturePath}`;
        }

        // =========================
        // HEADER (QRF SLIP)
        // =========================
        document.getElementById("qrfNumber").innerText = q.qrf_no || "-";
        document.getElementById("qrfPrs").innerText = q.prs_no || "-";
        document.getElementById("qrfDate").innerText = q.quotation_date || "-";

        document.getElementById("qr_requester").innerText = q.requester_name || "-";
        document.getElementById("qr_department").innerText = q.department_name || "-";
        document.getElementById("qr_contact").innerText = q.requester_email || "-";

        document.getElementById("sp_to").innerText = q.supplier_name || "-";
        document.getElementById("sp_name").innerText = q.contact_person || "-";
        document.getElementById("sp_location").innerText = q.address || "-";

        const preparedSig = document.getElementById("qrfPreparedBySig");
        const preparedName = document.getElementById("qrfPreparedByName");
        const preparedDate = document.getElementById("qrfPreparedByDate");

        if (q.requester_signature) {
            preparedSig.src = resolveSignatureSrc(q.requester_signature);
            preparedSig.style.display = "block";
            preparedName.innerText = q.requester_name || "-";
            preparedDate.innerText = q.quotation_date || "-";
        } else {
            preparedSig.style.display = "none";
            preparedName.innerText = q.requester_name || "-";
            preparedDate.innerText = "-";
        }

        const hodSig = document.getElementById("qrfHodSig");
        const hodName = document.getElementById("qrfHodName");
        const hodDate = document.getElementById("qrfHodDate");

        if (data.hod_signature?.signature) {
            hodSig.src = resolveSignatureSrc(data.hod_signature.signature);
            hodSig.style.display = "block";
            hodName.innerText = data.hod_signature.username || "-";
            hodDate.innerText = data.hod_signature.hod_approved_at || "-";
        } else {
            hodSig.style.display = "none";
            hodName.innerText = "-";
            hodDate.innerText = "-";
        }

        const ceoSig = document.getElementById("qrfCeoSig");
        const ceoName = document.getElementById("qrfCeoName");
        const ceoDate = document.getElementById("qrfCeoDate");

        if (data.ceo_signature?.signature) {
            ceoSig.src = resolveSignatureSrc(data.ceo_signature.signature);
            ceoSig.style.display = "block";
            ceoName.innerText = data.ceo_signature.username || "-";
            ceoDate.innerText = data.ceo_signature.ceo_approved_at || "-";
        } else {
            ceoSig.style.display = "none";
            ceoName.innerText = "-";
            ceoDate.innerText = "-";
        }

        // =========================
        // ITEMS TABLE
        // =========================
        const body = document.getElementById("sharedPRS");
        body.innerHTML = "";

        (data.items || []).forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.item_name || "-"}</td>
                <td>${item.description || "-"}</td>
                <td>${item.quantity || "-"}</td>
            `;

            body.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading quotation details:", err);
    }
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", loadQuotations);



//////////////////////////////////////////////////////////
// LOAD PRS TABLE
//////////////////////////////////////////////////////////
function loadPRSTable() {

    fetch("/ceo/requisition_data")
        .then(response => response.json())
        .then(data => {

            const tbody = document.getElementById("prsTableBody");
            tbody.innerHTML = "";

            if (!data.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center;">
                            No requisitions found.
                        </td>
                    </tr>
                `;
                return;
            }

            data.forEach(req => {

                tbody.innerHTML += `
                    <tr data-id="${req.requisition_id}"
                        onclick="loadSlipFromRow(this)">

                        <td>
                            <input
                                type="radio"
                                name="selectedPRS"
                                onchange="loadSlipFromRow(this.closest('tr'))">
                        </td>

                        <td>${req.prs_no}</td>
                        <td>${req.department_name}</td>
                        <td>${req.ceo_status || "PENDING"}</td>
                        <td>${formatDate(req.submission_date)}</td>
                        <td>${req.ceo_approved_at ? formatDate(req.ceo_approved_at) : "-"}</td>

                    </tr>
                `;
            });

        })
        .catch(error => {
            console.error("Error loading PRS:", error);
        });
}

//////////////////////////////////////////////////////////
// FORMAT DATE
//////////////////////////////////////////////////////////
function formatDate(dateString) {

    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB");
}

//////////////////////////////////////////////////////////
// LOAD SLIP
//////////////////////////////////////////////////////////
function loadSlipFromRow(row) {

    row.querySelector("input[type='radio']").checked = true;

    const requisitionId = row.dataset.id;

    fetch(`/ceo/requisition_details/${requisitionId}`)
        .then(res => res.json())
        .then(data => {

            if (!data.success) return;

            const r = data.requisition;

            // =====================
            // HEADER
            // =====================

            document.getElementById("prs_no").textContent =
                r.prs_no || "-";

            document.getElementById("department_name").textContent =
                r.department_name || "-";

            document.getElementById("submission").textContent =
                formatDate(r.submission_date);

            document.getElementById("hod_status").textContent =
                r.hod_status || "PENDING";

            document.getElementById("ceo_status").textContent =
                r.ceo_status || "PENDING";


            // =====================
            // CREATED BY
            // =====================

            document.getElementById("created_by_name").textContent =
                r.created_by_name || "-";

            document.getElementById("created_date").textContent =
                formatDate(r.submission_date);

            loadSignature(
                "sig_created_by",
                r.created_signature
            );


            // =====================
            // HOD
            // =====================

            document.getElementById("hod_username").textContent =
                r.hod_username || "-";

            document.getElementById("hod_approval_date").textContent =
                formatDate(r.hod_approved_at);

            loadSignature(
                "sig_hod",
                r.hod_signature
            );


            // =====================
            // CEO
            // =====================

            document.getElementById("ceo_username").textContent =
                r.ceo_username || "-";

            document.getElementById("ceo_approval_date").textContent =
                formatDate(r.ceo_approved_at);

            loadSignature(
                "sig_ceo",
                r.ceo_signature
            );


            // =====================
            // ITEMS
            // =====================

            const tbody = document.getElementById("items_body");
            tbody.innerHTML = "";

            data.items.forEach((item, index) => {

                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.material_name}</td>
                        <td>${item.uom}</td>
                        <td>${item.qty_required}</td>
                    </tr>
                `;
            });

        })
        .catch(error => console.error(error));
}


function formatDate(date) {

    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB");
}

function loadSignature(imageId, signature) {

    const img = document.getElementById(imageId);

    if (signature) {
        img.src = "/static/uploads/signatures/" + signature;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }
}


/////////////////////////////////////////h//////////////
// LOAD TABLE WHEN PAGE OPENS
//////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
    loadPRSTable();
});






// =========================================
// SEARCH TABLE
// =========================================
function searchInvoice() {

    const input =
        document.getElementById("invoiceSearch")
            .value
            .toLowerCase();

    const rows =
        document.querySelectorAll("#invoiceBody tr");

    rows.forEach(row => {

        const text =
            row.textContent.toLowerCase();

        row.style.display =
            text.includes(input)
                ? ""
                : "none";
    });
}




function searchPayment() {

    const input =
        document.getElementById("paymentSearch")
        .value
        .toLowerCase();

    const rows =
        document.querySelectorAll("#paymentBody tr");

    rows.forEach(row => {

        const match =
            row.innerText.toLowerCase().includes(input);

        row.style.display = match ? "" : "none";
    });
}



// =======================================================
// SEARCH GRN
// =======================================================
function searchGRN() {

    const input = document
        .getElementById("grnSearch")
        .value
        .toLowerCase();

    const rows = document.querySelectorAll("#grnTable tbody tr");

    rows.forEach(row => {

        const text = row.innerText.toLowerCase();

        row.style.display =
            text.includes(input)
            ? ""
            : "none";
    });
}






function searchQuotation(){
    let input = document.getElementById("quotationSearch");
    let filter = input.value.toLowerCase();
    let rows = document.querySelectorAll("#quotationTable tbody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

function searchSupplier(){
    let input = document.getElementById("supplierSearch");
    let filter = input.value.toLowerCase();
    let rows = document.querySelectorAll("#supplierBody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}





function searchPO(){
    let input = document.getElementById("poSearch");
    let filter = input.value.toLowerCase();
    let rows = document.querySelectorAll("#poBody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

function printPO(){
    window.print();
}




// =========================================
// PRINT
// =========================================
function printInvoice(){

    if(!selectedInvoiceId){
        alert("Select an invoice first.");
        return;
    }

    const content =
        document.getElementById(
            "invoicePrintArea"
        ).innerHTML;

    const printWindow =
        window.open("", "", "width=1000,height=700");

    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice Print</title>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}




// =======================================================
// PRINT GRN
// =======================================================
function printGRN() {

    const content = document.getElementById(
        "grnPrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print GRN</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}




// =======================================================
// PRINT GRN
// =======================================================
function printRequisition() {

    const content = document.getElementById(
        "requisitionPrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print Requisition</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}





// =======================================================
// PRINT GRN
// =======================================================
function printQuotation() {

    const content = document.getElementById(
        "quotationPrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print Quotation</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}





// =======================================================
// PRINT GRN
// =======================================================
function printInvoince() {

    const content = document.getElementById(
        "invoicePrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print Requisition</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}



// =======================================================
// PRINT GRN
// =======================================================
function printPayment() {

    const content = document.getElementById(
        "paymentPrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print Payment</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}




// =======================================================
// PRINT GRN
// =======================================================
function printPurshaseorder() {

    const content = document.getElementById(
        "poPrintArea"
    ).innerHTML;

    const win = window.open("", "", "width=1000,height=700");

    win.document.write(`

        <html>

        <head>

            <title>Print Purshase order</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                table,th,td{
                    border:1px solid #000;
                }

                th,td{
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    win.document.close();

    win.print();
}



