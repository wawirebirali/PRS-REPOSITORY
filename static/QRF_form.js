/*****************************************************************
        QUOTATION REQUEST (QRF) MODULE
*****************************************************************/


// =====================================================
// UOM LIST
// =====================================================

const qrfUOMs = [

    "pcs",
    "kg",
    "g",
    "mg",
    "ltr",
    "ml",
    "box",
    "pack",
    "bag",
    "bottle",
    "roll",
    "ream",
    "sheet",
    "pair",
    "set",
    "dozen",
    "bundle",
    "meter",
    "cm",
    "sqm"

];




// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
"DOMContentLoaded",
()=>{


    let date =
    document.getElementById(
        "quotationRequestDate"
    );


    if(date){

        date.value =
        new Date()
        .toISOString()
        .split("T")[0];

    }



    generateQRF();



});






// =====================================================
// GENERATE QRF NUMBER
// =====================================================

function generateQRF(){


    let year =
    new Date()
    .getFullYear();



    let counter =
    localStorage.getItem(
        "qrf_counter"
    ) || 0;



    counter =
    parseInt(counter)+1;



    localStorage.setItem(
        "qrf_counter",
        counter
    );



    let qrfNo =

    `QRF/${year}/${String(counter).padStart(4,"0")}`;



    let input =
    document.getElementById(
        "quotationRequestNumber"
    );



    if(input){

        input.value=qrfNo;

    }


}







// =====================================================
// ADD QRF ITEM
// =====================================================

function addQRFItem(){



    let tbody =
    document.getElementById(
        "quotationRequestItemsBody"
    );



    if(!tbody){

        console.error(
            "quotationRequestItemsBody missing"
        );

        return;

    }



    let row =
    document.createElement("tr");



    row.innerHTML = `


<td>

<input 
type="text"
class="qrf_material"
placeholder="Material name">

</td>



<td>

<input 
type="text"
class="qrf_description"
placeholder="Description">

</td>



<td>

<input 
type="number"
class="qrf_quantity"
value="1"
min="1">

</td>




<td>


<select class="qrf_uom">


<option value="">

Select UOM

</option>


${qrfUOMs.map(u=>

`
<option value="${u}">
${u}
</option>

`

).join("")}


</select>


</td>





<td>


<button
type="button"
class="btn danger"
onclick="removeQRFItem(this)">


Remove


</button>


</td>



`;



    tbody.appendChild(row);


}







// =====================================================
// REMOVE ITEM
// =====================================================

function removeQRFItem(button){


    let row =
    button.closest("tr");


    if(row){

        row.remove();

    }


}







// =====================================================
// SAVE QRF
// =====================================================

function saveQRF(){



    let qrfNo =
    document.getElementById(
        "quotationRequestNumber"
    ).value;



    let date =
    document.getElementById(
        "quotationRequestDate"
    ).value;



    let requisition =
    document.getElementById(
        "quotationRequestPRS"
    ).value;



    let supplier =
    document.getElementById(
        "quotationRequestSupplier"
    ).value;





    // ==========================
    // VALIDATION
    // ==========================


    if(!requisition){


        alert(
            "Please select Purchase Requisition"
        );


        return;

    }




    if(!supplier){


        alert(
            "Please select Supplier"
        );


        return;

    }







    let items=[];



    document
    .querySelectorAll(
        "#quotationRequestItemsBody tr"
    )

    .forEach(row=>{



        let material =

        row.querySelector(
            ".qrf_material"
        ).value;




        if(material){


            items.push({


                item:
                material,



                description:

                row.querySelector(
                    ".qrf_description"
                ).value,



                qty:

                row.querySelector(
                    ".qrf_quantity"
                ).value,



                uom:

                row.querySelector(
                    ".qrf_uom"
                ).value



            });


        }



    });







    if(items.length===0){


        alert(
            "Please add at least one item"
        );


        return;


    }







    let payload = {


        qrf_no:qrfNo,


        submission_date:date,


        requisition_id:requisition,


        supplier_id:supplier,


        items:items


    };







    console.log(
        "QRF DATA",
        payload
    );








    fetch(
        "/procurement/save_qrf",
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

                "QRF CREATED SUCCESSFULLY\n\n"+
                "QRF Number: "+
                data.qrf_no

            );





            cancelQRFForm();





            if(
            typeof loadQuotationRequests
            === "function"
            ){


                loadQuotationRequests();


            }





        }


        else{


            alert(

                data.message ||
                "Failed creating QRF"

            );


        }





    })






    .catch(error=>{



        console.error(
            "SAVE QRF ERROR:",
            error
        );



        alert(
            "Server error while saving QRF"
        );



    });



}







// =====================================================
// CANCEL FORM
// =====================================================

function cancelQRFForm(){


    let form =
    document.getElementById(
        "quotationRequestCreateForm"
    );



    if(form){

        form.style.display="none";

    }



}







// =====================================================
// SHOW FORM
// =====================================================

function showQRFForm(){


    let form =
    document.getElementById(
        "quotationRequestCreateForm"
    );



    if(form){


        form.style.display="block";


        generateQRF();


    }


}