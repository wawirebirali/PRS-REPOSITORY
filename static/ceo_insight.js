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

    loadDepartments();

    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");

    startDateInput?.addEventListener("change", () => {
        if (endDateInput) {
            endDateInput.min = startDateInput.value;
            if (endDateInput.value && endDateInput.value < startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
        }
        loadCEODashboard();
    });

    endDateInput?.addEventListener("change", loadCEODashboard);
    document.getElementById("departmentFilter")?.addEventListener("change", loadCEODashboard);
    document.getElementById("yearFilter")?.addEventListener("change", event => {
        const year = event.target.value;
        if (year) {
            if (startDateInput) startDateInput.value = `${year}-01-01`;
            if (endDateInput) {
                endDateInput.value = `${year}-12-31`;
                endDateInput.min = `${year}-01-01`;
            }
        }
        loadCEODashboard();
    });


}


function loadDepartments(){
    const departmentFilter = document.getElementById("departmentFilter");

    if (!departmentFilter) return;

    fetch("/ceo/api/departments")
        .then(response => response.json())
        .then(data => {
            if (!data.success) return;

            data.data.forEach(department => {
                const option = document.createElement("option");
                option.value = department.department_id;
                option.textContent = department.department_name;
                departmentFilter.appendChild(option);
            });
        })
        .catch(error => console.error("Department filter loading error:", error));
}






/* =====================================================
   LOAD DASHBOARD DATA
===================================================== */


function loadCEODashboard(){


    console.log(
        "Refreshing CEO Dashboard..."
    );


    loadKPI();

    loadPlotlyCharts();


}





/* =====================================================
   LOAD KPI DATA
===================================================== */


function loadKPI(){
    const params = new URLSearchParams();
    const startDate = document.getElementById("startDate")?.value;
    const endDate = document.getElementById("endDate")?.value;
    const departmentId = document.getElementById("departmentFilter")?.value;
    const year = document.getElementById("yearFilter")?.value;

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (departmentId) params.set("departmentId", departmentId);
    if (year) params.set("year", year);

    fetch(`/ceo/api/kpi?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) throw new Error(data.message || "KPI API failed");

            document.getElementById("totalDepartments").innerHTML = data.total_departments;
            document.getElementById("totalEmployees").innerHTML = data.total_employees;
            document.getElementById("totalSuppliers").innerHTML = data.total_suppliers;
            document.getElementById("totalPRS").innerHTML = data.total_prs;
            document.getElementById("pendingPRS").innerHTML = data.pending_prs;
            document.getElementById("totalPO").innerHTML = data.total_po;
            document.getElementById("totalGRN").innerHTML = data.total_grn;
            document.getElementById("companyBudget").innerHTML = "UGX " + Number(data.company_budget).toLocaleString();
            document.getElementById("budgetUsed").innerHTML = "UGX " + Number(data.budget_used).toLocaleString();
            document.getElementById("budgetBalance").innerHTML = "UGX " + Number(data.balance).toLocaleString();
        })
        .catch(error => console.error("KPI Loading Error:", error));
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
    const params = new URLSearchParams();
    const startDate = document.getElementById("startDate")?.value;
    const endDate = document.getElementById("endDate")?.value;
    const departmentId = document.getElementById("departmentFilter")?.value;
    const year = document.getElementById("yearFilter")?.value;

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (departmentId) params.set("departmentId", departmentId);
    if (year) params.set("year", year);

    fetch(`/ceo/api/charts?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error(`Charts API failed: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error(data.message || "Charts API failed");

            [
                ["budgetChart", data.budget],
                ["cashChart", data.cash],
                ["departmentChart", data.department],
                ["supplierChart", data.supplier],
                ["poChart", data.po],
                ["procurementChart", data.procurement],
            ].forEach(([elementId, chart]) => {
                chart.layout = {
                    ...chart.layout,
                    paper_bgcolor: "#ffffff",
                    plot_bgcolor: "#ffffff",
                    font: { color: "#334155", ...(chart.layout?.font || {}) },
                    margin: { l: 56, r: 24, t: 58, b: 54, ...(chart.layout?.margin || {}) },
                };

                Plotly.react(elementId, chart.data, chart.layout, {
                    responsive: true,
                    displayModeBar: false,
                });
            });
        })
        .catch(error => console.error("Filtered charts loading error:", error));
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



    loadCEODashboard();


}








/* =====================================================
   EXPORT PDF
===================================================== */


async function exportDashboard(){
    const dashboard = document.getElementById("insights");

    if (!dashboard) {
        console.error("CEO dashboard report area was not found.");
        return;
    }

    if (typeof html2pdf === "undefined") {
        alert("The PDF export library is not available. Please reload the page and try again.");
        return;
    }

    const exportButton = document.querySelector(".export-btn");
    if (exportButton) exportButton.disabled = true;

    const date = new Date().toISOString().slice(0, 10);

    try {
        await html2pdf()
            .set({
                margin: 8,
                filename: `ceo-dashboard-${date}.pdf`,
                image: { type: "png" },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    onclone: clonedDocument => {
                        const clonedDashboard = clonedDocument.getElementById("insights");
                        if (!clonedDashboard) return;

                        clonedDashboard.style.color = "#111827";
                        clonedDashboard.style.backgroundColor = "#ffffff";
                        clonedDashboard.querySelectorAll("*").forEach(element => {
                            element.style.opacity = "1";
                            element.style.textShadow = "none";
                        });
                    },
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
                pagebreak: { mode: ["css", "legacy"] },
            })
            .from(dashboard)
            .save();
    } catch (error) {
        console.error("CEO report export failed:", error);
        alert("The report could not be downloaded. Please try again.");
    } finally {
        if (exportButton) exportButton.disabled = false;
    }
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