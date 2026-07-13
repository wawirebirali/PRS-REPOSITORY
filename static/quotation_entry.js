/*****************************************************************
        QUOTATION ENTRY MODULE
*****************************************************************/

/*****************************************************************
    QUOTATION ENTRY MODULE
*****************************************************************/


// =====================================================
// LOAD QRF DETAILS
// =====================================================

function loadQRFDetails(){


    let qrf_id =
    document.getElementById("quotationQrfSelect").value;



    if(!qrf_id){

        return;

    }



    fetch("/procurement/get_qrf_details/" + qrf_id)


    .then(response=>response.json())


    .then(data=>{


        console.log("QRF DATA:",data);



        // ==========================
        // SUPPLIER
        // ==========================


        document.getElementById(
            "quotationSupplierId"
        ).value =
        data.supplier_id || "";



        document.getElementById(
            "quotationSupplierName"
        ).value =
        data.supplier_name || "";





        // ==========================
        // ITEMS TABLE
        // ==========================


        let tbody =
        document.getElementById(
            "quotationItemBody"
        );



        if(!tbody){

            console.error(
                "quotationItemBody missing"
            );

            return;

        }




        tbody.innerHTML="";




        data.items.forEach(item=>{


            let row=document.createElement("tr");



            row.innerHTML=`


<td>

<input class="qitem"
value="${item.material_name || ''}">

</td>



<td>

<input class="qdesc"
value="${item.description || ''}">

</td>



<td>

<input type="number"
class="qqty"
value="${item.quantity || 0}"
oninput="calculateQuotation(this)">

</td>



<td>

<input type="number"
class="qprice"
value="0"
oninput="calculateQuotation(this)">

</td>



<td>

<input class="qamount"
readonly>

</td>



<td>

<button
type="button"
class="btn danger"
onclick="removeQuotationRow(this)">

X

</button>


</td>


`;



            tbody.appendChild(row);



        });



    })



    .catch(error=>{


        console.error(
            "QRF LOAD ERROR:",
            error
        );


        alert(
            "Unable to load QRF details"
        );


    });



}






// =====================================================
// ADD ITEM
// =====================================================


function addQuotationRow(){



    let tbody =
    document.getElementById(
        "quotationItemBody"
    );



    let row =
    document.createElement("tr");



    row.innerHTML=`


<td>
<input class="qitem">
</td>


<td>
<input class="qdesc">
</td>


<td>
<input type="number"
class="qqty"
value="1"
oninput="calculateQuotation(this)">
</td>


<td>
<input type="number"
class="qprice"
value="0"
oninput="calculateQuotation(this)">
</td>


<td>
<input class="qamount" readonly>
</td>


<td>

<button
type="button"
class="btn danger"
onclick="removeQuotationRow(this)">

X

</button>

</td>


`;



tbody.appendChild(row);


}





// =====================================================
// REMOVE ROW
// =====================================================


function removeQuotationRow(btn){

    btn.closest("tr").remove();

}






// =====================================================
// CALCULATE AMOUNT
// =====================================================


function calculateQuotation(input){


    let row =
    input.closest("tr");



    let qty =
    parseFloat(
        row.querySelector(".qqty").value
    ) || 0;



    let price =
    parseFloat(
        row.querySelector(".qprice").value
    ) || 0;



    row.querySelector(".qamount").value =
    (qty * price).toFixed(2);



}







// =====================================================
// SAVE QUOTATION
// =====================================================


function saveQuotation(){



    let payload={



        qrf_id:

        document.getElementById(
            "quotationQrfSelect"
        ).value,



        supplier_id:

        document.getElementById(
            "quotationSupplierId"
        ).value,



        delivery_date:

        document.getElementById(
            "quotationDeliveryDate"
        ).value,



        payment_terms:

        document.getElementById(
            "quotationPaymentTerms"
        ).value,



        warranty:

        document.getElementById(
            "quotationWarranty"
        ).value,



        items:[]


    };







    document
    .querySelectorAll(
        "#quotationItemBody tr"
    )
    .forEach(row=>{


        payload.items.push({


            item_name:

            row.querySelector(".qitem").value,



            description:

            row.querySelector(".qdesc").value,



            quantity:

            row.querySelector(".qqty").value,



            unit_price:

            row.querySelector(".qprice").value



        });



    });






    if(!payload.qrf_id){


        alert(
            "Select QRF first"
        );

        return;

    }




    fetch(
        "/procurement/Quotation_entry",
        {

            method:"POST",

            headers:{

                "Content-Type":
                "application/json"

            },


            body:
            JSON.stringify(payload)

        }

    )


    .then(response=>response.json())


    .then(data=>{


        console.log(data);



        if(data.success){


            alert(
                "Quotation saved successfully"
            );


            loadQuotations();


        }

        else{


            alert(
                data.message
            );


        }


    })


    .catch(error=>{


        console.error(
            "SAVE ERROR",
            error
        );


        alert(
            "Server error"
        );


    });



}

// =====================================================
// REMOVE ITEM
// =====================================================

function removeQuotationRow(btn){


    btn.closest("tr").remove();


}







// =====================================================
// CALCULATE ITEM TOTAL
// =====================================================

function calculateQuotation(input){


    let row =
    input.closest("tr");



    let qty =
    parseFloat(
        row.querySelector(".qqty").value
    ) || 0;



    let price =
    parseFloat(
        row.querySelector(".qprice").value
    ) || 0;



    row.querySelector(
        ".qamount"
    ).value =
    (qty * price).toFixed(2);



}







// =====================================================
// SAVE QUOTATION
// =====================================================

function saveQuotation(){



    let qrf_id =
    document.getElementById(
        "quotationQrfSelect"
    ).value;



    let supplier_id =
    document.getElementById(
        "quotationSupplierId"
    ).value;



    let delivery_date =
    document.getElementById(
        "quotationDeliveryDate"
    ).value;



    let payment_terms =
    document.getElementById(
        "quotationPaymentTerms"
    ).value;



    let warranty =
    document.getElementById(
        "quotationWarranty"
    ).value;





    if(!qrf_id){


        alert(
            "Please select QRF"
        );

        return;

    }



    if(!supplier_id){


        alert(
            "Supplier missing"
        );

        return;

    }





    let items=[];



    document
    .querySelectorAll(
        "#quotationItemTable tbody tr"
    )
    .forEach(row=>{



        let item_name =
        row.querySelector(
            ".qitem"
        ).value;



        let description =
        row.querySelector(
            ".qdesc"
        ).value;



        let quantity =
        row.querySelector(
            ".qqty"
        ).value;



        let unit_price =
        row.querySelector(
            ".qprice"
        ).value;




        items.push({


            item_name:item_name,


            description:description,


            quantity:quantity,


            unit_price:unit_price


        });



    });






    if(items.length===0){


        alert(
            "No quotation items found"
        );


        return;

    }






    let payload = {


        qrf_id:qrf_id,


        supplier_id:supplier_id,


        delivery_date:delivery_date,


        payment_terms:payment_terms,


        warranty:warranty,


        items:items


    };







    fetch(
        "/procurement/Quotation_entry",
        {


            method:"POST",


            headers:{


                "Content-Type":
                "application/json"


            },


            body:
            JSON.stringify(payload)


        }

    )



    .then(response=>response.json())



    .then(data=>{



        if(data.success){


            alert(
                "Quotation Saved Successfully\n"
                + data.quotation_no
            );


            location.reload();



        }

        else{


            alert(
                data.message
            );


        }



    })



    .catch(error=>{


        console.error(
            "SAVE QUOTATION ERROR:",
            error
        );


        alert(
            "Server error saving quotation"
        );


    });



}








// =====================================================
// HIDE FORM
// =====================================================

function hideQuotationEntry(){


    document.getElementById(
        "quotationEntryForm"
    ).style.display="none";


}