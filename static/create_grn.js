
// =====================================
// PAGE INIT
// =====================================
window.onload = function(){

    generateGRN();

    setDateTime();

};


// =====================================
// DATE TIME
// =====================================
function setDateTime(){

    let now = new Date();

    let formatted =
        now.toISOString().slice(0,16);

    document.getElementById(
        "creation_date"
    ).value = formatted;
}


// =====================================
// AUTO GRN NUMBER
// =====================================
function generateGRN(){

    let now = new Date();

    let year =
        now.getFullYear();

    // RANDOM NUMBER
    let number =
        localStorage.getItem("grn_counter");

    if(!number){

        number = 1;

    }else{

        number = parseInt(number) + 1;
    }

    localStorage.setItem(
        "grn_counter",
        number
    );

    // FORMAT 0001
    let formattedNumber =
        String(number).padStart(4,'0');

    document.getElementById(
        "grn_no"
    ).value =
        `GRN/${year}/${formattedNumber}`;
}


// =====================================
// LOAD PO ITEMS
// =====================================
document.getElementById("po_id")
.addEventListener("change", function(){

    let po_id = this.value;

    if(!po_id){

        return;
    }

    fetch("/procurement/get_po_items/" + po_id)

    .then(res => res.json())

    .then(data => {

        document.getElementById("supplier_id").value = data.supplier_id || "";
        document.getElementById("supplier_name").value = data.supplier_name || "";

        let body =
            document.getElementById(
                "itemsBody"
            );

        body.innerHTML = "";

        data.items.forEach(item => {

            let row = `

            <tr>

                <!-- ITEM -->
                <td>

                    <input
                        type="text"
                        name="material_name[]"
                        value="${item.item_name}"
                        readonly
                    >

                </td>

                <!-- DESCRIPTION -->
                <td>

                    <input
                        type="text"
                        name="description[]"
                        value="${item.description || ''}"
                        readonly
                    >

                </td>

                <!-- ORDERED -->
                <td>

                    <input
                        type="number"
                        class="ordered"
                        name="quantity_ordered[]"
                        value="${item.quantity}"
                        readonly
                    >

                </td>

                <!-- RECEIVED -->
                <td>

                    <input
                        type="number"
                        class="received"
                        name="quantity_received[]"
                        onkeyup="calculateRow(this)"
                        required
                    >

                </td>

                <!-- REJECTED -->
                <td>

                    <input
                        type="number"
                        class="rejected"
                        name="quantity_rejected[]"
                        readonly
                    >

                </td>

                <!-- REMARK -->
                <td>

                    <span class="remark"></span>

                    <input
                        type="hidden"
                        class="remarkInput"
                        name="remarks[]"
                    >

                </td>

            </tr>

            `;

            body.innerHTML += row;

        });

    });

});


// =====================================
// CALCULATE
// =====================================
function calculateRow(input){

    let row =
        input.closest("tr");

    let ordered =
        parseFloat(
            row.querySelector(".ordered").value
        ) || 0;

    let received =
        parseFloat(input.value) || 0;

    let rejectedField =
        row.querySelector(".rejected");

    let remarkText =
        row.querySelector(".remark");

    let remarkInput =
        row.querySelector(".remarkInput");


    // VALIDATION
    if(received > ordered){

        alert(
            "Received quantity cannot exceed ordered quantity"
        );

        input.value = "";

        rejectedField.value = "";

        remarkText.innerText = "";

        remarkInput.value = "";

        return;
    }


    // CALCULATE REJECTED
    let rejected =
        ordered - received;

    rejectedField.value =
        rejected;


    // AUTO REMARK
    if(received == ordered){

        remarkText.innerText =
            "OK";

        remarkText.className =
            "ok";

        remarkInput.value =
            "OK";
    }

    else if(received < ordered){

        remarkText.innerText =
            "PARTIAL";

        remarkText.className =
            "partial";

        remarkInput.value =
            "PARTIAL";
    }

    else{

        remarkText.innerText =
            "REJECTED";

        remarkText.className =
            "rejected";

        remarkInput.value =
            "REJECTED";
    }

}

function goToDashboard() {
    window.location.href = "{{ url_for('procurement_dashboard.procurement_dashboard') }}";
}
