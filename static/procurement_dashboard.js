// ===========================================
// GLOBAL VARIABLES
// ===========================================

let quotationViewMode = "request";
let selectedQuotationId = null;
let selectedQuotationMode = null;


// ===========================================
// OPEN MODULE
// ===========================================

function openModule(id, btn) {

    // Hide all modules
    document.querySelectorAll(".module").forEach(module => {
        module.classList.remove("active");
    });

    // Remove active button
    document.querySelectorAll(".sidebar button").forEach(button => {
        button.classList.remove("active");
    });

    // Determine which quotation view to load
    let moduleId = id;

    if (id === "quotationRequest") {
        quotationViewMode = "request";
        moduleId = "quotationRequest";   // Your module ID
    }

    

    if (id === "quotation") {
        quotationViewMode = "quotation";
        moduleId = "quotation";          // Your module ID
    }

    // Find the module
    const module = document.getElementById(moduleId);

    if (!module) {
        console.error("Module not found:", moduleId);
        return;
    }

    // Show module
    module.classList.add("active");

    // Highlight button
    if (btn) {
        btn.classList.add("active");
    }

    // Reset quotation selection
    selectedQuotationId = null;
    selectedQuotationMode = null;

    // ===============================
    // Load module data
    // ===============================

    switch (id) {

        case "supplier":
            if (typeof loadSupplierModule === "function") {
                loadSupplierModule();
            }
            break;

        case "quotationRequest":
            if (typeof loadQuotationRequests === "function") {
                loadQuotationRequests();
            }
            break;

        case "quotation":
            if (typeof loadQuotations === "function") {
                loadQuotations();
            }
            break;

        case "purchaseOrder":
            if (typeof loadPOModule === "function") {
                loadPOModule();
            }
            break;

        case "dashboard":

            if(typeof loadDashboard === "function"){

                loadDashboard();

            }

            break;

            case "grn":
             if (typeof loadGRNModule === "function") {
                  loadGRNModule();
             }
            break;


        case "invoice":
            if (typeof loadInvoices === "function") {
                loadInvoices();
            }
            break;

        case "requisition":
            if (typeof loadRequisitionModule === "function") {
                loadRequisitionModule();
            }
            break;
    }

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








// =====================================================
// SEARCH PURCHASE REQUISITION
// =====================================================

function searchPRS() {

    const search = document
        .getElementById("prsSearch")
        .value
        .toLowerCase();

    document
        .querySelectorAll("#prsBody tr")
        .forEach(row => {

            row.style.display =
                row.innerText
                .toLowerCase()
                .includes(search)
                    ? ""
                    : "none";

        });

}


// =====================================================
// LOAD REQUISITIONS
// =====================================================

function loadRequisitions() {

    fetch("/procurement/api/procurement_requisition")

    .then(response => {

        if (!response.ok) {
            throw new Error("Unable to load requisitions");
        }

        return response.json();

    })

    .then(data => {

        const body =
            document.getElementById("prsBody");

        if (!body) return;

        body.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {

            body.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center">
                    No requisitions found
                </td>
            </tr>`;

            return;
        }

        data.forEach(req => {

            const row =
                document.createElement("tr");

            row.dataset.id =
                req.requisition_id;

            row.innerHTML = `

                <td>
                    <input type="radio"
                           name="prsSelect">
                </td>

                <td>${req.prs_no}</td>

                <td>${req.department_name}</td>

                <td>${req.due ?? "-"}</td>

                <td>${req.submission_date ?? "-"}</td>

                <td>${req.final_status ?? "-"}</td>

            `;

            row.onclick = function(){

                document
                .querySelectorAll("#prsBody tr")
                .forEach(r=>{

                    r.classList.remove("selected");

                });

                row.classList.add("selected");

                row.querySelector("input").checked=true;

                loadSlipFromRow(row);

            };

            body.appendChild(row);

        });

    })

    .catch(error=>{

        console.error(error);

        alert("Unable to load requisitions.");

    });

}


// =====================================================
// SELECT ROW
// =====================================================

function selectRow(row){

    document
    .querySelectorAll("#prsBody tr")
    .forEach(r=>{

        r.classList.remove("selected");

    });

    row.classList.add("selected");

    const radio =
        row.querySelector("input");

    if(radio){

        radio.checked=true;

    }

    loadSlipFromRow(row);

}


// =====================================================
// LOAD REQUISITION SLIP
// =====================================================

function loadSlipFromRow(row){

    const id=row.dataset.id;

    fetch(`/procurement/api/procurement_requisition/${id}`)

    .then(response=>{

        if(!response.ok){

            throw new Error("Unable to load requisition");

        }

        return response.json();

    })

    .then(data=>{

        const req =
            data.requisition || {};

        const items =
            data.items || [];

        const sig =
            data.signatures || {};

        // Header

        document.getElementById("prs_no").textContent =
            req.prs_no || "-";

        document.getElementById("dept").textContent =
            req.department_name || "-";

        document.getElementById("submission").textContent =
            req.submission_date || "-";

        document.getElementById("hod_status").textContent =
            req.hod_status || "-";

        document.getElementById("ceo_status").textContent =
            req.ceo_status || "-";

        document.getElementById("hod_approval_date").textContent =
            req.hod_approved_at || "-";

        document.getElementById("ceo_approval_date").textContent =
            req.ceo_approved_at || "-";

        // Prepared

        if(document.getElementById("prepared_name")){

            document.getElementById("prepared_name").textContent =
                sig.prepared_name || "-";

        }

        if(document.getElementById("prepared_date")){

            document.getElementById("prepared_date").textContent =
                sig.prepared_date || "-";

        }

        // HOD

        document.getElementById("hod_name").textContent =
            sig.hod_name || "-";

        document.getElementById("hod_date").textContent =
            sig.hod_date || "-";

        const hod=document.getElementById("sig_hod");

        if(hod){

            if(sig.hod_signature){

                hod.src="/static/signatures/"+sig.hod_signature;

                hod.style.display="block";

            }else{

                hod.style.display="none";

            }

        }

        // CEO

        document.getElementById("ceo_name").textContent =
            sig.ceo_name || "-";

        document.getElementById("ceo_date").textContent =
            sig.ceo_date || "-";

        const ceo=document.getElementById("sig_ceo");

        if(ceo){

            if(sig.ceo_signature){

                ceo.src="/static/signatures/"+sig.ceo_signature;

                ceo.style.display="block";

            }else{

                ceo.style.display="none";

            }

        }

        // Items

        const body=document.getElementById("items_body");

        body.innerHTML="";

        if(items.length===0){

            body.innerHTML=`
            <tr>
                <td colspan="4"
                style="text-align:center">
                No items found
                </td>
            </tr>`;

            return;

        }

        items.forEach((item,index)=>{

            body.innerHTML+=`

            <tr>

                <td>${index+1}</td>

                <td>${item.material_name}</td>

                <td>${item.uom}</td>

                <td>${item.qty_required}</td>

            </tr>

            `;

        });

    })

    .catch(error=>{

        console.error(error);

        alert("Unable to load requisition.");

    });

}


// =====================================================
// DOWNLOAD PDF
// =====================================================

function downloadPDF(id,fileName){

    const element=document.getElementById(id);

    if(!element){

        alert("Element not found");

        return;

    }

    html2pdf()

    .set({

        margin:10,

        filename:fileName+".pdf",

        image:{
            type:"jpeg",
            quality:0.98
        },

        html2canvas:{
            scale:2,
            useCORS:true
        },

        jsPDF:{
            unit:"mm",
            format:"a4",
            orientation:"portrait"
        }

    })

    .from(element)

    .save();

}


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener("DOMContentLoaded",()=>{

    loadRequisitions();

});



















/*****************************************************************
 QUOTATION REQUEST MODULE
*****************************************************************/


// =====================================================
// LOAD QUOTATION REQUEST LIST
// =====================================================

// =====================================================
// LOAD QUOTATION REQUEST LIST
// =====================================================

function loadQuotationRequestModule() {


    fetch("/procurement/procurementquotation_request_data")


    .then(response => response.json())


    .then(result => {


        const body = document.getElementById(
            "quotationRequestTableBody"
        );


        if(!body) return;



        body.innerHTML = "";



        let requests = result.data || [];



        if(requests.length === 0){


            body.innerHTML = `

            <tr>

                <td colspan="7" style="text-align:center">

                    No Quotation Requests Found

                </td>

            </tr>

            `;


            return;

        }




        requests.forEach(request => {



            const row =
            document.createElement("tr");



            // STORE QRF ID

            row.dataset.id =
            request.qrf_id;



            row.innerHTML = `


            <td>

                <input type="radio"
                name="quotationRequestSelect">

            </td>


            <td>${request.qrf_no || "-"}</td>


            <td>${request.prs_no || "-"}</td>


            <td>${request.supplier || "-"}</td>


            <td>${request.status || "-"}</td>


            <td>${request.department || "-"}</td>


            <td>${request.request_date || "-"}</td>


            `;



            // CLICK ROW

            row.onclick = function(){


                selectQRFRow(row);


            };



            body.appendChild(row);



        });



    })


    .catch(error=>{


        console.error(
            "QRF LOAD ERROR:",
            error
        );


    });



}


document.addEventListener("DOMContentLoaded",()=>{

    loadQuotationRequestModule();

});




// =====================================================
// SELECT QRF ROW
// LOAD QRF DETAILS
// =====================================================

// =====================================================
// SELECT QRF ROW
// =====================================================

function selectQRFRow(row) {

    // Remove previous selection
    document.querySelectorAll("#quotationRequestTableBody tr")
        .forEach(r => {
            r.classList.remove("selected");

            const radio = r.querySelector("input[type='radio']");
            if (radio) radio.checked = false;
        });

    // Highlight selected row
    row.classList.add("selected");

    // Check radio
    const radio = row.querySelector("input[type='radio']");
    if (radio) radio.checked = true;

    // Get QRF ID
    const qrfId = row.dataset.id;

    console.log("Selected QRF ID:", qrfId);

    if (!qrfId) {
        alert("No QRF ID found.");
        return;
    }

    loadQuotationRequestDetails(qrfId);
}




// =====================================================
// LOAD QUOTATION REQUEST DETAILS
// =====================================================


function loadQuotationRequestDetails(qrfId){



    fetch(
        "/procurement/procurementquotation_request_details/"
        + qrfId
    )



    .then(response=>response.json())



    .then(data=>{


        console.log(
            "QRF DETAILS:",
            data
        );



        if(!data.success){


            alert(
                data.message ||
                "QRF not found"
            );


            return;

        }





        // ============================
        // HEADER
        // ============================


        document.getElementById(
            "quotationRequestSlipNumber"
        ).textContent =
        data.qrf_no || "-";



        document.getElementById(
            "quotationRequestSlipPRS"
        ).textContent =
        data.prs_no || "-";



        document.getElementById(
            "quotationRequestSlipDate"
        ).textContent =
        data.request_date || "-";



        document.getElementById(
            "quotationRequestSlipRequester"
        ).textContent =
        data.requester_name || "-";



        document.getElementById(
            "quotationRequestSlipDepartment"
        ).textContent =
        data.department || "-";







        // ============================
        // ITEMS
        // ============================


        const items =
        document.getElementById(
            "quotationRequestSlipItems"
        );



        items.innerHTML="";



        if(
            data.items &&
            data.items.length > 0
        ){



            data.items.forEach(item=>{


                items.innerHTML += `


                <tr>


                    <td>
                    ${item.material_name || "-"}
                    </td>



                    <td>
                    ${item.description || "-"}
                    </td>



                    <td>
                    ${item.quantity || 0}
                    </td>


                </tr>


                `;



            });



        }

        else{


            items.innerHTML = `

            <tr>

                <td colspan="3"
                style="text-align:center">

                    No Items Found

                </td>

            </tr>

            `;


        }







        // ============================
        // HOD APPROVAL
        // ============================


        document.getElementById(
            "quotationRequestHodName"
        ).textContent =
        data.hod_name || "-";



        document.getElementById(
            "quotationRequestHodStatus"
        ).textContent =
        data.hod_status || "-";



        document.getElementById(
            "quotationRequestHodDate"
        ).textContent =
        data.hod_approval_date || "-";



        const hodSignature =
        document.getElementById(
            "quotationRequestHodSignature"
        );



        if(data.hod_signature){


            hodSignature.src =
            "/static/signatures/"
            +
            data.hod_signature;


            hodSignature.style.display =
            "block";


        }

        else{


            hodSignature.style.display =
            "none";


        }








        // ============================
        // CEO APPROVAL
        // ============================


        document.getElementById(
            "quotationRequestCeoName"
        ).textContent =
        data.ceo_name || "-";



        document.getElementById(
            "quotationRequestCeoStatus"
        ).textContent =
        data.ceo_status || "-";



        document.getElementById(
            "quotationRequestCeoDate"
        ).textContent =
        data.ceo_approval_date || "-";



        const ceoSignature =
        document.getElementById(
            "quotationRequestCeoSignature"
        );



        if(data.ceo_signature){


            ceoSignature.src =
            "/static/signatures/"
            +
            data.ceo_signature;



            ceoSignature.style.display =
            "block";


        }

        else{


            ceoSignature.style.display =
            "none";


        }



    })



    .catch(error=>{


        console.error(
            "QRF DETAILS ERROR:",
            error
        );


        alert(
            "Failed loading quotation request details"
        );


    });



}


// =====================================================
// SEARCH QRF
// =====================================================


function searchQuotationRequest(){


const search =
document.getElementById(
"quotationRequestSearchInput"
)
.value
.toLowerCase();



document
.querySelectorAll(
"#quotationRequestTableBody tr"
)
.forEach(row=>{


row.style.display =
row.innerText
.toLowerCase()
.includes(search)

? ""

: "none";


});


}





// =====================================================
// SHOW CREATE FORM
// =====================================================


function showCreateQRF(){



document.getElementById(
"quotationRequestTableList"
)
.style.display="none";



document.getElementById(
"quotationRequestCreateForm"
)
.style.display="block";



if(typeof generateQRF==="function"){

    generateQRF();

}




const date =
document.getElementById(
"quotationRequestDate"
);



if(date){

date.value =
new Date()
.toISOString()
.split("T")[0];

}



if(typeof addQRFItem==="function"){

    addQRFItem();

}



}





// =====================================================
// CANCEL CREATE FORM
// =====================================================


function cancelQRFForm(){


document.getElementById(
"quotationRequestCreateForm"
)
.style.display="none";



document.getElementById(
"quotationRequestTableList"
)
.style.display="table";


}






/*****************************************************************
    QUOTATION MODULE
******************************************************************/

// =====================================================
// LOAD QUOTATION LIST
// =====================================================

function loadQuotationModule() {

    fetch("/procurement/quotation_data")

    .then(response => response.json())

    .then(result => {

        if (!result.success) {
            alert(result.message);
            return;
        }

        const body = document.getElementById("quotationTableBody");

        body.innerHTML = "";

        result.data.forEach(q => {

            const row = document.createElement("tr");

            row.dataset.id = q.quotation_id;

            row.innerHTML = `

                <td>
                    <input type="radio" name="quotationSelect">
                </td>

                <td>${q.quotation_no || "-"}</td>

                <td>${q.qrf_no || "-"}</td>

                <td>${q.supplier_name || "-"}</td>

                <td>${q.status || "-"}</td>

                <td>${q.department || "-"}</td>

                <td>${q.created_at || "-"}</td>

            `;

            row.onclick = function () {

                selectQuotationRow(row);

            };

            body.appendChild(row);

        });

    })

    .catch(error => {

        console.error(error);

        alert("Unable to load quotations.");

    });

}


document.addEventListener("DOMContentLoaded",()=>{

    loadQuotationModule();

});


// =====================================================
// SELECT QUOTATION
// =====================================================

function selectQuotationRow(row) {

    document
        .querySelectorAll("#quotationTableBody tr")
        .forEach(r => {

            r.classList.remove("selected");

            const radio = r.querySelector("input");

            if (radio) radio.checked = false;

        });

    row.classList.add("selected");

    const radio = row.querySelector("input");

    if (radio) radio.checked = true;

    const quotationId = row.dataset.id;

    loadQuotationDetails(quotationId);

}



// =====================================================
// LOAD QUOTATION DETAILS
// =====================================================

function loadQuotationDetails(quotationId) {

    fetch("/procurement/quotations/api/" + quotationId)

    .then(response => response.json())

    .then(data => {

        if (!data.success) {

            alert(data.message);

            return;

        }

        const q = data.quotation;


        // ======================================
        // HEADER
        // ======================================

        document.getElementById("quotationSlipNo").textContent =
            q.quotation_no || "-";

        document.getElementById("quotationSlipQRFNo").textContent =
            q.qrf_no || "-";

        document.getElementById("quotationSlipDate").textContent =
            q.quotation_date || "-";

        document.getElementById("quotationSlipSupplier").textContent =
            q.supplier_name || "-";

        document.getElementById("quotationSlipDepartment").textContent =
            q.department_name || "-";

        document.getElementById("quotationSlipStatus").textContent =
            q.status || "-";


        // ======================================
        // TERMS
        // ======================================

        document.getElementById("quotationSlipDeliveryDate").textContent =
            q.delivery_date || "-";

        document.getElementById("quotationSlipPaymentTerms").textContent =
            q.payment_terms || "-";

        document.getElementById("quotationSlipWarranty").textContent =
            q.warranty || "-";


        // ======================================
        // ITEMS
        // ======================================

        const tbody =
            document.getElementById("quotationSlipItemsBody");

        tbody.innerHTML = "";

        if (data.items.length > 0) {

            data.items.forEach(item => {

                tbody.innerHTML += `

                    <tr>

                        <td>${item.item_name}</td>

                        <td>${item.description}</td>

                        <td>${item.quantity}</td>

                        <td>${item.unit_price}</td>

                        <td>${item.amount}</td>

                    </tr>

                `;

            });

        }

        else {

            tbody.innerHTML = `

                <tr>

                    <td colspan="5" style="text-align:center">

                        No Items Found

                    </td>

                </tr>

            `;

        }


        // ======================================
        // HOD
        // ======================================

        if (data.hod_signature) {

            document.getElementById("quotationSlipHodName").textContent =
                data.hod_signature.username || "-";

            document.getElementById("quotationSlipHodDate").textContent =
                data.hod_signature.hod_approved_at || "-";

            document.getElementById("quotationSlipHodStatus").textContent =
                data.hod_signature.hod_status || "-";

            const hod =
                document.getElementById("quotationSlipHodSignature");

            if (data.hod_signature.signature) {

                hod.src =
                    "/static/signatures/" +
                    data.hod_signature.signature;

                hod.style.display = "block";

            } else {

                hod.style.display = "none";

            }

        }


        // ======================================
        // CEO
        // ======================================

        if (data.ceo_signature) {

            document.getElementById("quotationSlipCeoName").textContent =
                data.ceo_signature.username || "-";

            document.getElementById("quotationSlipCeoDate").textContent =
                data.ceo_signature.ceo_approved_at || "-";

            document.getElementById("quotationSlipCeoStatus").textContent =
                data.ceo_signature.ceo_status || "-";

            const ceo =
                document.getElementById("quotationSlipCeoSignature");

            if (data.ceo_signature.signature) {

                ceo.src =
                    "/static/signatures/" +
                    data.ceo_signature.signature;

                ceo.style.display = "block";

            } else {

                ceo.style.display = "none";

            }

        }

    })

    .catch(error => {

        console.error(error);

        alert("Unable to load quotation details.");

    });

}



// =====================================================
// SEARCH
// =====================================================

function searchQuotation() {

    const search =
        document.getElementById("quotationSearchInput")
        .value
        .toLowerCase();

    document
        .querySelectorAll("#quotationTableBody tr")
        .forEach(row => {

            row.style.display =
                row.innerText.toLowerCase().includes(search)
                    ? ""
                    : "none";

        });

}


/* ==========================================
   SHOW QUOTATION ENTRY FORM
========================================== */

function showQuotationEntry() {

    const form = document.getElementById("quotationEntryForm");

    if (!form) {
        console.error("quotationEntryForm not found");
        return;
    }

    form.style.display = "block";

    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* ==========================================
   HIDE QUOTATION ENTRY FORM
========================================== */

function hideQuotationEntry() {

    const form = document.getElementById("quotationEntryForm");

    if (!form) {
        console.error("quotationEntryForm not found");
        return;
    }

    form.style.display = "none";
}


/* ==========================================
   TOGGLE QUOTATION ENTRY FORM (Optional)
========================================== */

function toggleQuotationEntry() {

    const form = document.getElementById("quotationEntryForm");

    if (!form) return;

    if (form.style.display === "none" || form.style.display === "") {

        showQuotationEntry();

    } else {

        hideQuotationEntry();

    }

}








/*****************************************************************
    PURCHASE ORDER MODULE
*****************************************************************/


// =====================================================
// LOAD PURCHASE ORDER LIST
// =====================================================

function loadPOModule() {


    fetch("/procurement/procurementpo_data")


    .then(response => response.json())


    .then(result => {


        const body = document.getElementById("poBody");


        if (!body) {

            console.error("poBody not found");

            return;

        }



        body.innerHTML = "";



        if (!Array.isArray(result) || result.length === 0) {


            body.innerHTML = `

                <tr>

                    <td colspan="7"
                        style="text-align:center">

                        No Purchase Orders Found

                    </td>

                </tr>

            `;


            return;

        }





        result.forEach(po => {



            const row = document.createElement("tr");


            row.dataset.id = po.purchase_order_id;



            row.innerHTML = `

                <td>
                    <input type="radio"
                           name="poSelect">
                </td>


                <td>
                    ${po.po_number || "-"}
                </td>


                <td>
                    ${po.prs_no || "-"}
                </td>


                <td>
                    ${po.supplier_name || "-"}
                </td>


                <td>
                    ${po.status || "-"}
                </td>


                <td>
                    ${po.department || "-"}
                </td>


                <td>
                    ${po.creation_date || "-"}
                </td>

            `;



            row.onclick = function () {

                selectPORow(row);

            };



            body.appendChild(row);



        });



    })


    .catch(error => {


        console.error(
            "PO Loading Error:",
            error
        );


        alert(
            "Unable to load Purchase Orders"
        );


    });


}







// =====================================================
// AUTO LOAD MODULE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {


        if(document.getElementById("purchaseOrder")) {


            loadPOModule();


        }


    }
);








// =====================================================
// SELECT PURCHASE ORDER ROW
// =====================================================


function selectPORow(row) {


    document
    .querySelectorAll("#poBody tr")
    .forEach(r => {


        r.classList.remove("selected");


        const radio =
        r.querySelector("input");


        if(radio)

            radio.checked = false;


    });





    row.classList.add("selected");



    const radio =
    row.querySelector("input");



    if(radio)

        radio.checked = true;



    const poId =
    row.dataset.id;



    loadPODetails(poId);



}









// =====================================================
// LOAD PURCHASE ORDER DETAILS
// =====================================================


function loadPODetails(poId) {


    fetch(
        "/procurement/procurement_po_details/" + poId
    )


    .then(response => response.json())


    .then(data => {




        // ================= HEADER =================


        document.getElementById("poNumber").textContent =
            data.po_number || "-";


        document.getElementById("poDate").textContent =
            data.order_date || "-";


        document.getElementById("poPRS").textContent =
            data.prs_no || "-";


        document.getElementById("poStatus").textContent =
            data.final_status || "PENDING";






        // ================= SUPPLIER =================


        document.getElementById("poSupplier").textContent =
            data.supplier_name || "-";


        document.getElementById("poAddress").textContent =
            data.supplier_address || "-";


        document.getElementById("poPhone").textContent =
            data.supplier_phone || "-";






        // ================= DELIVERY =================


        document.getElementById("poDelivery").textContent =
            data.supplier_address || "-";


        document.getElementById("poDeliveryDate").textContent =
            data.order_date || "-";







        // ================= TOTAL =================


        document.getElementById("poTotal").textContent =
            data.total_amount || "0.00";








        // ================= ITEMS =================


        const tbody =
        document.getElementById("poItemsBody");



        tbody.innerHTML = "";



        if(data.items && data.items.length > 0) {



            data.items.forEach(item => {



                tbody.innerHTML += `

                    <tr>

                        <td>
                            ${item.item_name || "-"}
                        </td>


                        <td>
                            ${item.description || "-"}
                        </td>


                        <td>
                            ${item.quantity || 0}
                        </td>


                        <td>
                            ${item.unit_price || 0}
                        </td>


                        <td>
                            ${item.total_price || 0}
                        </td>


                    </tr>

                `;



            });



        }

        else {


            tbody.innerHTML = `

                <tr>

                    <td colspan="5"
                        style="text-align:center">

                        No Items Found

                    </td>

                </tr>

            `;


        }









        // ================= PREPARED BY =================


        document.getElementById("poPreparedBy").textContent =
            data.created_by_name || "-";


        document.getElementById("poPreparedDate").textContent =
            data.order_date || "-";



        loadSignature(
            "poPreparedBySig",
            data.created_by_signature
        );









        // ================= HOD APPROVAL =================


        document.getElementById("po_hod_Approval").textContent =
            data.hod_name || "-";


        document.getElementById("po_hod_ApprovalDate").textContent =
            data.hod_approved_at || "-";


        document.getElementById("po_hod_Status").textContent =
            data.hod_status || "PENDING";



        loadSignature(
            "poHodSig",
            data.hod_signature
        );









        // ================= CEO APPROVAL =================


        document.getElementById("po_ceo_Approval").textContent =
            data.ceo_name || "-";


        document.getElementById("po_ceo_ApprovalDate").textContent =
            data.ceo_approved_at || "-";


        document.getElementById("po_ceo_Status").textContent =
            data.ceo_status || "PENDING";



        loadSignature(
            "poCeoSig",
            data.ceo_signature
        );




    })


    .catch(error => {


        console.error(
            "PO Details Error:",
            error
        );


        alert(
            "Unable to load PO details"
        );


    });



}









// =====================================================
// SIGNATURE LOADER
// =====================================================


function loadSignature(id,file) {


    const img =
    document.getElementById(id);



    if(!img)

        return;




    if(file) {


        img.src =
        "/static/signatures/" + file;


        img.style.display =
        "block";


    }

    else {


        img.style.display =
        "none";


    }



}









// =====================================================
// SEARCH PURCHASE ORDER
// =====================================================


function searchPO() {


    const search =
    document.getElementById("poSearch")
    .value
    .toLowerCase();




    document
    .querySelectorAll("#poBody tr")
    .forEach(row => {



        row.style.display =


        row.innerText
        .toLowerCase()
        .includes(search)


        ?

        ""


        :

        "none";



    });


}









// =====================================================
// SHOW CREATE PO BOX
// =====================================================


function showPOQuotationBox() {


    const box =
    document.getElementById("poQuotationBox");


    if(box)

        box.style.display = "block";


}







// =====================================================
// HIDE CREATE PO BOX
// =====================================================


function hidePOQuotationBox() {


    const box =
    document.getElementById("poQuotationBox");


    if(box)

        box.style.display = "none";


}









// =====================================================
// PRINT PURCHASE ORDER
// =====================================================


function printPO() {


    window.print();


}




/*****************************************************************
                GOODS RECEIVED NOTE MODULE
******************************************************************/

// =====================================================
// LOAD GRN LIST
// =====================================================

function loadGRNModule(){

    fetch("/procurement/Grnprocurementdata")

    .then(res => res.json())

    .then(data => {

        const body = document.getElementById("grnBody");

        if(!body){
            console.error("grnBody not found");
            return;
        }


        body.innerHTML = "";


        if(!data || data.length === 0){

            body.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center">
                        No GRN Found
                    </td>
                </tr>
            `;

            return;

        }



        data.forEach(grn => {


            let row = document.createElement("tr");


            row.dataset.id = grn.grn_id;


            row.innerHTML = `


                <td>
                    <input type="radio" name="grnSelect">
                </td>


                <td>
                    ${grn.grn_no || "-"}
                </td>


                <td>
                    ${grn.prs_no || "-"}
                </td>


                <td>
                    ${grn.supplier_name || "-"}
                </td>


                <td>
                    ${grn.status || "-"}
                </td>


                <td>
                    ${grn.department || "-"}
                </td>


                <td>
                    ${grn.creation_date || "-"}
                </td>


            `;



            row.onclick = function(){

                selectGRNRow(row);

            };



            body.appendChild(row);



        });



    })

    .catch(error=>{

        console.error("GRN Load Error:",error);

    });


}





document.addEventListener("DOMContentLoaded",()=>{

    loadGRNModule();

});


// =====================================================
// SELECT GRN ROW
// =====================================================

function selectGRNRow(row){



    document
    .querySelectorAll("#grnBody tr")

    .forEach(r=>{


        r.classList.remove("selected");


        let radio =
            r.querySelector("input");


        if(radio)
            radio.checked=false;


    });



    row.classList.add("selected");



    let radio =
        row.querySelector("input");



    if(radio)
        radio.checked=true;



    loadGRNDetails(row.dataset.id);



}






// =====================================================
// LOAD GRN DETAILS
// =====================================================

function loadGRNDetails(grnId){



fetch("/procurement/procurementgrn_details/" + grnId)


.then(res=>res.json())


.then(data=>{


console.log(data);



// ==========================
// HEADER
// ==========================


document.getElementById("grnNumber").textContent =
    data.grn_no || "-";


document.getElementById("grnDate").textContent =
    data.received_date || "-";


document.getElementById("grnPO").textContent =
    data.po_number || "-";


document.getElementById("grnSupplier").textContent =
    data.supplier_name || "-";


document.getElementById("grnReceiver").textContent =
    data.received_by || "-";


document.getElementById("grnStatus").textContent =
    data.final_status || "PENDING";





// ==========================
// DELIVERY
// ==========================


document.getElementById("grnLocation").textContent =
    data.supplier_address || "-";


document.getElementById("grnReceivingDate").textContent =
    data.received_date || "-";






// ==========================
// ITEMS
// ==========================


const tbody =
    document.getElementById("grnItemsBody");


tbody.innerHTML="";



if(data.items && data.items.length>0){



data.items.forEach(item=>{



tbody.innerHTML += `


<tr>


<td>
${item.material_name || "-"}
</td>


<td>
${item.description || "-"}
</td>


<td>
${item.quantity_ordered || 0}
</td>


<td>
${item.quantity_received || 0}
</td>


<td>
${item.balance || 0}
</td>


</tr>


`;



});



}

else{


tbody.innerHTML=`


<tr>

<td colspan="5" style="text-align:center">

No Items Found

</td>

</tr>


`;


}




document.getElementById("grnTotal").textContent =
    data.total_received || 0;






// ==========================
// RECEIVED BY
// ==========================


document.getElementById("grnPreparedName").textContent =
    data.received_by || "-";


document.getElementById("grnPreparedDate").textContent =
    data.received_date || "-";


loadGRNSignature(
    "grnPreparedSignature",
    data.prepared_signature
);






// ==========================
// HOD
// ==========================


document.getElementById("grnHodName").textContent =
    data.hod_name || "-";


document.getElementById("grnHodDate").textContent =
    data.hod_approved_at || "-";


document.getElementById("grnHodStatus").textContent =
    data.hod_status || "PENDING";


loadGRNSignature(
    "grnHodSignature",
    data.hod_signature
);






// ==========================
// CEO
// ==========================


document.getElementById("grnCeoName").textContent =
    data.ceo_name || "-";


document.getElementById("grnCeoDate").textContent =
    data.ceo_approved_at || "-";


document.getElementById("grnCeoStatus").textContent =
    data.ceo_status || "PENDING";


loadGRNSignature(
    "grnCeoSignature",
    data.ceo_signature
);





// ==========================
// REMARKS
// ==========================


if(document.getElementById("grnRemarks")){


document.getElementById("grnRemarks").value =
    data.remarks || "";


}



})


.catch(err=>{


console.error(err);


alert("Unable to load GRN details.");


});


}






// =====================================================
// LOAD SIGNATURE
// =====================================================

function loadGRNSignature(id,signature){


const img =
    document.getElementById(id);



if(!img) return;



if(signature){


img.src =
"/static/signatures/" + signature;


img.style.display="block";


}

else{


img.style.display="none";


}



}






// =====================================================
// SEARCH GRN
// =====================================================

function searchGRN(){



const search =
document.getElementById("grnSearch")
.value
.toLowerCase();



document.querySelectorAll("#grnBody tr")

.forEach(row=>{


row.style.display =


row.innerText
.toLowerCase()
.includes(search)


?""

:"none";


});


}







// =====================================================
// PRINT GRN
// =====================================================

function printGRN(){


window.print();


}