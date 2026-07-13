/* =====================================================
   CEO EXECUTIVE DASHBOARD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    initializeDashboard();

});


/* =====================================================
   INITIALIZE
===================================================== */

function initializeDashboard() {

    loadDashboard();

    createBudgetChart();

    createCashChart();

    createDepartmentChart();

    createSupplierChart();

    createPOChart();

    createProcurementChart();

}


/* =====================================================
   REFRESH DASHBOARD
===================================================== */

function loadDashboard() {

    console.log("Dashboard Loaded");

}


/* =====================================================
   EXPORT PDF
===================================================== */

function exportDashboard() {

    window.print();

}


/* =====================================================
   FILTERS
===================================================== */

function applyFilters() {

    const start =
        document.getElementById("startDate").value;

    const end =
        document.getElementById("endDate").value;

    const department =
        document.getElementById("departmentFilter").value;

    const year =
        document.getElementById("yearFilter").value;

    console.log(start);
    console.log(end);
    console.log(department);
    console.log(year);

}


/* =====================================================
   AI ASSISTANT
===================================================== */

function askAI() {

    const question =
        document.querySelector("textarea").value;

    if(question=="")
    {
        alert("Enter a question.");
        return;
    }

    alert("AI Question:\n\n"+question);

}


/* =====================================================
   MONTHLY BUDGET VS SPENDING
===================================================== */

function createBudgetChart(){

    new Chart(
        document.getElementById("budgetChart"),
    {
        type:"line",

        data:{

            labels:[
                "Jan","Feb","Mar",
                "Apr","May","Jun",
                "Jul","Aug","Sep",
                "Oct","Nov","Dec"
            ],

            datasets:[
            {

                label:"Budget",

                data:[
                    120,
                    135,
                    150,
                    170,
                    160,
                    180,
                    175,
                    190,
                    205,
                    210,
                    225,
                    240
                ]

            },

            {

                label:"Spent",

                data:[
                    110,
                    120,
                    140,
                    150,
                    155,
                    170,
                    160,
                    185,
                    190,
                    198,
                    215,
                    220
                ]

            }

            ]

        },

        options:{
            responsive:true
        }

    });

}


/* =====================================================
   CASH FLOW
===================================================== */

function createCashChart(){

    new Chart(
        document.getElementById("cashChart"),
    {

        type:"line",

        data:{

            labels:[
                "Jan","Feb","Mar",
                "Apr","May","Jun",
                "Jul","Aug","Sep",
                "Oct","Nov","Dec"
            ],

            datasets:[{

                label:"Cash Flow",

                data:[
                    200,
                    180,
                    220,
                    250,
                    260,
                    280,
                    300,
                    310,
                    295,
                    330,
                    350,
                    380
                ]

            }]

        }

    });

}


/* =====================================================
   BUDGET DISTRIBUTION
===================================================== */

function createDepartmentChart(){

    new Chart(
        document.getElementById("departmentChart"),
    {

        type:"pie",

        data:{

            labels:[
                "ICT",
                "Finance",
                "Procurement",
                "Administration",
                "Stores",
                "HR"
            ],

            datasets:[{

                data:[
                    30,
                    18,
                    20,
                    12,
                    10,
                    10
                ]

            }]

        }

    });

}


/* =====================================================
   SUPPLIER PAYMENTS
===================================================== */

function createSupplierChart(){

    new Chart(
        document.getElementById("supplierChart"),
    {

        type:"doughnut",

        data:{

            labels:[
                "Paid",
                "Outstanding"
            ],

            datasets:[{

                data:[
                    2900,
                    900
                ]

            }]

        }

    });

}


/* =====================================================
   PURCHASE ORDERS
===================================================== */

function createPOChart(){

    new Chart(
        document.getElementById("poChart"),
    {

        type:"bar",

        data:{

            labels:[
                "Jan","Feb","Mar",
                "Apr","May","Jun"
            ],

            datasets:[{

                label:"Purchase Orders",

                data:[
                    15,
                    18,
                    12,
                    25,
                    20,
                    28
                ]

            }]

        }

    });

}


/* =====================================================
   PROCUREMENT COST
===================================================== */

function createProcurementChart(){

    new Chart(
        document.getElementById("procurementChart"),
    {

        type:"bar",

        data:{

            labels:[
                "Jan","Feb","Mar",
                "Apr","May","Jun"
            ],

            datasets:[{

                label:"Procurement Cost (Million UGX)",

                data:[
                    320,
                    280,
                    350,
                    420,
                    390,
                    470
                ]

            }]

        }

    });

}


/* =====================================================
   REFRESH BUTTON
===================================================== */

const refreshButton =
document.querySelector(".refresh-btn");

if(refreshButton){

    refreshButton.onclick=function(){

        location.reload();

    };

}


/* =====================================================
   EXPORT BUTTON
===================================================== */

const exportButton =
document.querySelector(".export-btn");

if(exportButton){

    exportButton.onclick=function(){

        exportDashboard();

    };

}


/* =====================================================
   ASK AI BUTTON
===================================================== */

const aiButton =
document.querySelector(".predict-btn");

if(aiButton){

    aiButton.onclick=function(){

        askAI();

    };

}