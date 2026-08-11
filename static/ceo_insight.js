/* =====================================================
   CEO EXECUTIVE DASHBOARD
   Plotly JSON Version
===================================================== */


document.addEventListener(
    "DOMContentLoaded",
    function(){

        initializeDashboard();

    }
);



/* =====================================================
   INITIALIZE DASHBOARD
===================================================== */


function initializeDashboard(){


    console.log(
        "CEO Dashboard Loading..."
    );


    loadCEODashboard();


    loadPlotlyCharts();


}






/* =====================================================
   LOAD DASHBOARD DATA
===================================================== */


function loadCEODashboard(){


    console.log(
        "Refreshing CEO Dashboard..."
    );


    loadKPI();


}





/* =====================================================
   LOAD KPI DATA
===================================================== */


function loadKPI(){


    fetch("/ceo/api/kpi")


    .then(response=>response.json())


    .then(data=>{


        if(data.success){


            document.getElementById(
                "totalDepartments"
            ).innerHTML =
            data.total_departments;



            document.getElementById(
                "totalEmployees"
            ).innerHTML =
            data.total_employees;



            document.getElementById(
                "totalSuppliers"
            ).innerHTML =
            data.total_suppliers;



            document.getElementById(
                "totalPRS"
            ).innerHTML =
            data.total_prs;



            document.getElementById(
                "totalPO"
            ).innerHTML =
            data.total_po;



            document.getElementById(
                "totalGRN"
            ).innerHTML =
            data.total_grn;



            document.getElementById(
                "companyBudget"
            ).innerHTML =
            "UGX " +
            Number(
                data.company_budget
            ).toLocaleString();



            document.getElementById(
                "budgetUsed"
            ).innerHTML =
            "UGX " +
            Number(
                data.budget_used
            ).toLocaleString();



            document.getElementById(
                "budgetBalance"
            ).innerHTML =
            "UGX " +
            Number(
                data.balance
            ).toLocaleString();



        }


    })


    .catch(error=>{


        console.error(
            "KPI Loading Error:",
            error
        );


    });


}







/* =====================================================
   PLOTLY CHART LOADER
===================================================== */


function loadPlotlyChart(
    elementID,
    jsonFile
){


    fetch(
        "/static/" + jsonFile
    )


    .then(response=>{


        if(!response.ok){

            throw new Error(
                "Cannot load " + jsonFile
            );

        }


        return response.json();


    })


    .then(chart=>{


        Plotly.newPlot(

            elementID,

            chart.data,

            chart.layout,

            {

                responsive:true,

                displayModeBar:false

            }

        );


    })


    .catch(error=>{


        console.error(
            "Plotly Error:",
            error
        );


    });


}







/* =====================================================
   LOAD ALL PLOTLY VISUALS
===================================================== */


function loadPlotlyCharts(){



    loadPlotlyChart(

        "budgetChart",

        "budget_vs_spending.json"

    );





    loadPlotlyChart(

        "cashChart",

        "cash_flow.json"

    );





    loadPlotlyChart(

        "departmentChart",

        "department_budget_allocation.json"

    );





    loadPlotlyChart(

        "supplierChart",

        "supplier_spending.json"

    );





    loadPlotlyChart(

        "poChart",

        "po_status.json"

    );





    loadPlotlyChart(

        "procurementChart",

        "procurement_cost.json"

    );


}







/* =====================================================
   FILTERS
===================================================== */


function applyFilters(){


    let startDate =
    document.getElementById(
        "startDate"
    ).value;



    let endDate =
    document.getElementById(
        "endDate"
    ).value;



    let department =
    document.getElementById(
        "departmentFilter"
    ).value;



    let year =
    document.getElementById(
        "yearFilter"
    ).value;



    console.log({

        startDate,

        endDate,

        department,

        year

    });


    loadCEODashboard();


}








/* =====================================================
   EXPORT PDF
===================================================== */


function exportDashboard(){


    window.print();


}







/* =====================================================
   AI ASSISTANT
===================================================== */


function askAI(){


    let question =
    document.querySelector(
        "textarea"
    ).value;



    if(question.trim()===""){


        alert(
            "Enter a question"
        );


        return;


    }



    alert(

        "AI Question:\n\n" +
        question

    );


}







/* =====================================================
   REFRESH BUTTON
===================================================== */


document.addEventListener(
"click",
function(e){


    if(
        e.target.classList.contains(
            "refresh-btn"
        )
    ){


        loadCEODashboard();

        loadPlotlyCharts();


    }



});







/* =====================================================
   EXPORT BUTTON
===================================================== */


document.addEventListener(
"click",
function(e){


    if(
        e.target.classList.contains(
            "export-btn"
        )
    ){


        exportDashboard();


    }



});