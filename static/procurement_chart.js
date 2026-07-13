/* =====================================================
        PROCUREMENT DASHBOARD JS
===================================================== */


let procurementActivityChart = null;
let documentStatusChart = null;
let departmentChart = null;
let supplierChart = null;
let materialChart = null;



// =====================================================
// LOAD DASHBOARD
// =====================================================


function loadDashboard(){


fetch("/procurement/dashboard_data")


.then(response=>{


    if(!response.ok){

        throw new Error(
            "Dashboard API Error"
        );

    }


    return response.json();


})


.then(data=>{



// ================= KPI CARDS =================


document.getElementById("totalPR").innerText =
data.total_pr || 0;


document.getElementById("pendingPR").innerText =
data.pending_pr || 0;


document.getElementById("totalQRF").innerText =
data.total_qrf || 0;


document.getElementById("totalPO").innerText =
data.total_po || 0;


document.getElementById("totalGRN").innerText =
data.total_grn || 0;





// Destroy old charts

destroyCharts();





// ================= MONTHLY ACTIVITY =================


procurementActivityChart =
new Chart(

document.getElementById(
"procurementActivityChart"
),

{


type:"bar",


data:{


labels:data.months || [],


datasets:[

{

label:"Requisitions",

data:data.pr_monthly || []

},


{

label:"Purchase Orders",

data:data.po_monthly || []

},


{

label:"GRN",

data:data.grn_monthly || []

}


]


},


options:{


responsive:true


}



});








// ================= DOCUMENT STATUS =================


documentStatusChart =
new Chart(

document.getElementById(
"documentStatusChart"
),

{


type:"pie",


data:{


labels:[

"Pending",

"Approved",

"Completed",

"Rejected"

],



datasets:[{


data:data.status || []


}]

}


});


 




// ================= DEPARTMENT REQUESTS =================


departmentChart =
new Chart(

document.getElementById(
"departmentChart"
),

{


type:"bar",


data:{


labels:data.departments || [],



datasets:[{


label:"Requests",


data:data.department_count || []


}]


}



});








// ================= SUPPLIER ACTIVITY =================


supplierChart =
new Chart(

document.getElementById(
"supplierChart"
),

{


type:"bar",


data:{


labels:data.suppliers || [],



datasets:[{


label:"Purchase Orders",


data:data.supplier_orders || []


}]


}



});








// ================= MATERIAL DEMAND =================


materialChart =
new Chart(

document.getElementById(
"materialChart"
),

{


type:"bar",


data:{


labels:data.materials || [],



datasets:[{


label:"Quantity Requested",


data:data.material_qty || []


}]


}



});






// ================= RECENT DOCUMENTS =================


let table =
document.getElementById(
"recentProcurement"
);



if(table){


table.innerHTML="";



(data.recent_documents || [])
.forEach(doc=>{


table.innerHTML += `

<tr>

<td>${doc.document || "-"}</td>

<td>${doc.number || "-"}</td>

<td>${doc.status || "-"}</td>

<td>${doc.date || "-"}</td>

</tr>

`;


});


}




})


.catch(error=>{


console.error(
"Dashboard Error:",
error
);


});

}




// =====================================================
// DESTROY EXISTING CHARTS
// =====================================================


function destroyCharts(){



if(procurementActivityChart){

    procurementActivityChart.destroy();

}



if(documentStatusChart){

    documentStatusChart.destroy();

}



if(departmentChart){

    departmentChart.destroy();

}



if(supplierChart){

    supplierChart.destroy();

}



if(materialChart){

    materialChart.destroy();

}


}




document.addEventListener("DOMContentLoaded",()=>{

let d=new Date();

document.getElementById("dashboardDate").innerHTML =
d.toLocaleDateString();

});