/* =====================================================
        FINANCE DASHBOARD JAVASCRIPT
===================================================== */


document.addEventListener("DOMContentLoaded", function(){


/* =====================================================
        LOAD DATE DEFAULTS
===================================================== */


let today = new Date();

let firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);


document.querySelectorAll(
    "#financeDashboard input[type='date']"
)[0].value = firstDay.toISOString().split("T")[0];


document.querySelectorAll(
    "#financeDashboard input[type='date']"
)[1].value = today.toISOString().split("T")[0];






/* =====================================================
        CHART DEFAULT OPTIONS
===================================================== */


Chart.defaults.font.family =
"Segoe UI, Arial";

Chart.defaults.plugins.legend.position =
"bottom";






/* =====================================================
        MONTHLY CASH FLOW CHART
===================================================== */


new Chart(
document.getElementById("financeCashFlow"),
{

type:"line",

data:{


labels:[

"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun",
"Jul",
"Aug",
"Sep",
"Oct",
"Nov",
"Dec"

],


datasets:[

{

label:"Income",

data:[

900,
1200,
1500,
1300,
1800,
2000,
2300,
2100,
2600,
2800,
3000,
3500

],


borderWidth:3,

fill:false


},


{

label:"Expenses",

data:[

700,
900,
1100,
1000,
1400,
1600,
1700,
1800,
2100,
2200,
2500,
2700

],


borderWidth:3,

fill:false

}


]


},


options:{


responsive:true,


plugins:{


legend:{

display:true

}


}



}


});









/* =====================================================
        BUDGET VS ACTUAL
===================================================== */


new Chart(

document.getElementById(
"financeBudgetChart"
),

{


type:"bar",


data:{


labels:[

"ICT",
"Finance",
"Procurement",
"Stores",
"Admin"

],


datasets:[


{


label:"Budget",

data:[

3000,
2500,
4000,
1800,
2000

],


borderWidth:1


},



{


label:"Spent",

data:[

2200,
1700,
3300,
1000,
900

],


borderWidth:1


}


]


},


options:{


responsive:true


}


});









/* =====================================================
        SUPPLIER PAYMENT CHART
===================================================== */


new Chart(

document.getElementById(
"supplierPaymentChart"
),

{


type:"doughnut",


data:{


labels:[

"Paid",
"Pending",
"Overdue"

],


datasets:[


{


data:[

65,
25,
10

],


borderWidth:1


}


]


},


options:{


responsive:true


}


});









/* =====================================================
        DEPARTMENT EXPENSE CHART
===================================================== */


new Chart(

document.getElementById(
"departmentExpenseChart"
),

{


type:"pie",


data:{


labels:[

"ICT",
"Procurement",
"Finance",
"Administration",
"Stores"

],


datasets:[


{


data:[

35,
25,
20,
12,
8

],


borderWidth:1


}


]


},


options:{


responsive:true


}


});








/* =====================================================
        REFRESH BUTTON
===================================================== */


let refreshBtn =
document.querySelector(
"#financeDashboard .quick-btn.green"
);



refreshBtn.addEventListener(
"click",
function(){


loadFinanceData();


}

);









/* =====================================================
        EXPORT BUTTON
===================================================== */


let exportBtn =
document.querySelector(
"#financeDashboard .quick-btn.blue"
);



exportBtn.addEventListener(
"click",
function(){


exportFinanceReport();


}

);









});









/* =====================================================
        LOAD FINANCE DATA
        (API READY)
===================================================== */


function loadFinanceData(){


let department =
document.querySelector(
"#financeDashboard select"
).value;


let dates =
document.querySelectorAll(
"#financeDashboard input[type='date']"
);



let startDate =
dates[0].value;


let endDate =
dates[1].value;




console.log({

department,

startDate,

endDate

});



/*

Later connect Flask API:

fetch(
"/finance/api/dashboard",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

department:department,

start:startDate,

end:endDate

})

}

)

.then(res=>res.json())

.then(data=>{


updateCards(data);


});


*/


alert(
"Finance dashboard refreshed"
);



}








/* =====================================================
        EXPORT REPORT
===================================================== */


function exportFinanceReport(){


let dashboard =
document.getElementById(
"financeDashboard"
);



html2pdf()

.from(dashboard)

.save(
"Finance_Dashboard_Report.pdf"
);



}







/* =====================================================
        UPDATE KPI CARDS FROM API
===================================================== */


function updateFinanceCards(data){



let cards =
document.querySelectorAll(
"#financeDashboard .kpi-card h2"
);



cards[0].innerHTML =
data.cash;



cards[1].innerHTML =
data.budget;



cards[2].innerHTML =
data.used;



cards[3].innerHTML =
data.pending;



cards[4].innerHTML =
data.debt;



cards[5].innerHTML =
data.paid;



}