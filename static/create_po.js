

let quotations = [];
let prs_id = "";

window.onload = function(){
    initPO();
    loadPrsList();
    loadQuotations();
};

// =========================
// LOAD PRS LIST
// =========================
function loadPrsList(){

    fetch(`/procurement/get_prs_list`)
    .then(res => res.json())
    .then(data => {

        let select = document.getElementById("prs_number");
        select.innerHTML = '<option value="">-- Select PRS --</option>';

        data.forEach(prs => {
            let option = document.createElement("option");
            option.value = prs.requisition_id;
            option.textContent = prs.prs_no;
            select.appendChild(option);
        });
    })
    .catch(err => {
        console.log(err);
        alert("Failed to load PRS list");
    });
}

// =========================
// PRS CHANGE
// =========================
function onPrsChange(){

    prs_id = document.getElementById("prs_number").value;
    quotations = [];

    document.getElementById("qt_number").innerHTML = '<option value="">-- Select Quotation --</option>';

    if(prs_id){
        loadQuotations();
    }
}

// =========================
// INIT PO NUMBER
// =========================
function initPO(){

    let now = new Date();

    document.getElementById("po_number").value =
        "PO/" + now.getFullYear() + "/" + Math.floor(Math.random()*100000);

    document.getElementById("po_date").value =
        now.toISOString().slice(0,16);
}

// =========================
// LOAD QUOTATIONS (FIXED)
// =========================
function loadcreateQuotations(){

    if(!prs_id){
        return;
    }

    fetch(`/procurement/get_po_prs_quotations/${prs_id}`)

    .then(res => res.json())

    .then(data => {

        if(!data.success){
            alert(data.message);
            return;
        }

        quotations = data.data;

        let select = document.getElementById("qt_number");

        select.innerHTML = '<option value="">-- Select Quotation --</option>';

        quotations.forEach(q => {

            let option = document.createElement("option");
            option.value = q.quotation_id;
            option.textContent = q.quotation_no + " - " + q.supplier_name;

            select.appendChild(option);

        });

    })

    .catch(err => {
        console.log(err);
        alert("Failed to load quotations");
    });
}

// =========================
// ON SELECT QUOTATION
// =========================
function loadcreateQuotationItems(){

    let id = document.getElementById("qt_number").value;

    if(!id) return;

    let q = quotations.find(x => x.quotation_id == id);

    if(!q) return;

    document.getElementById("supplier_id").value = q.supplier_id || "";
    document.getElementById("supplier_name").value = q.supplier_name;
    document.getElementById("total").innerText = Number(q.total_amount).toFixed(2);

    let table = document.getElementById("poTable");

    table.querySelectorAll("tr.data-row").forEach(row => row.remove());

    fetch(`/procurement/get_quotation_items/${id}`)
    .then(res => res.json())
    .then(items => {

        items.forEach(item => {

            let row = document.createElement("tr");
            row.className = "data-row";

            row.innerHTML = `
                <td><input type="text" value="${item.item_name || ""}" readonly></td>
                <td><input type="text" value="${item.description || ""}" readonly></td>
                <td><input type="number" class="qty" value="${item.quantity || 0}" oninput="calc(this)"></td>
                <td><input type="number" class="price" value="${item.unit_price || 0}" oninput="calc(this)"></td>
                <td><input type="number" class="amount" value="${(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}" readonly></td>
                <td><button type="button" class="remove-btn" onclick="removeRow(this)">Remove</button></td>
            `;

            table.appendChild(row);
        });

        calculateTotal();
    })
    .catch(err => {
        console.log(err);
        alert("Failed to load quotation items");
    });
}

// =========================
// CALC ROW
// =========================
function calc(el){

    let row = el.closest("tr");

    let qty = parseFloat(row.querySelector(".qty").value) || 0;
    let price = parseFloat(row.querySelector(".price").value) || 0;

    row.querySelector(".amount").value =
        (qty * price).toFixed(2);

    calculateTotal();
}

// =========================
// TOTAL
// =========================
function calculateTotal(){

    let total = 0;

    document.querySelectorAll(".amount").forEach(el => {
        total += parseFloat(el.value) || 0;
    });

    document.getElementById("total").innerText =
        total.toFixed(2);
}

// =========================
// REMOVE ROW
// =========================
function removeRow(btn){
    btn.closest("tr").remove();
    calculateTotal();
}

// =========================
// SUBMIT PO
// =========================
function submitPO(){

    let quotation_id = document.getElementById("qt_number").value;

    if(!quotation_id){
        alert("Please select quotation");
        return;
    }

    fetch("/procurement/create_po_from_selected",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({ quotation_id })
    })

    .then(res => res.json())

    .then(data => {

        if(data.success){
            alert(
                "PO Created Successfully\n\n" +
                "PO Number: " + data.po_number +
                "\nSupplier: " + data.supplier_name
            );

            location.reload();
        }
        else{
            alert(data.message);
        }
    })

    .catch(err => {
        console.log(err);
        alert("Error creating PO");
    });
}


function goToDashboard() {
    window.location.href = "{{ url_for('procurement_dashboard.procurement_dashboard') }}";
}


