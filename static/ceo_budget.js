////////////////////////////////////////////////////////////
// CEO BUDGET MANAGEMENT
////////////////////////////////////////////////////////////

let companyBudgets = [];
let selectedBudgetId = null;

////////////////////////////////////////////////////////////
// SEARCH BUDGET
////////////////////////////////////////////////////////////

function searchBudget() {

    const keyword = document
        .getElementById("budgetSearch")
        .value
        .toLowerCase();

    const filtered = companyBudgets.filter(item =>

        (item.budget_no || "")
            .toLowerCase()
            .includes(keyword)

        ||

        (item.department_name || "")
            .toLowerCase()
            .includes(keyword)

        ||

        (item.financial_year || "")
            .toLowerCase()
            .includes(keyword)

        ||

        (item.budget_type || "")
            .toLowerCase()
            .includes(keyword)

    );

    renderBudgetTable(filtered);

}

////////////////////////////////////////////////////////////
// TOGGLE PREDICT PANEL
////////////////////////////////////////////////////////////

function togglePredictBudget() {

    const panel = document.getElementById("predictBudgetTab");

    if (!panel) return;

    const visible = panel.style.display === "block";

    panel.style.display = visible ? "none" : "block";

    if (!visible) {
        panel.scrollIntoView({
            behavior: "smooth"
        });
    }
}

////////////////////////////////////////////////////////////
// TOGGLE CREATE PANEL
////////////////////////////////////////////////////////////

function openCreateBudget() {

    document.getElementById(
        "createBudgetTab"
    ).style.display = "block";

}

function closeCreateBudget() {

    document.getElementById(
        "createBudgetTab"
    ).style.display = "none";

}

////////////////////////////////////////////////////////////
// TOGGLE DEPARTMENT PANEL
////////////////////////////////////////////////////////////

function toggleDepartmentBudget() {

    const panel =
        document.getElementById(
            "departmentBudgetTab"
        );

    panel.style.display =
        panel.style.display === "block"
        ? "none"
        : "block";

}

////////////////////////////////////////////////////////////
// SELECT ALL
////////////////////////////////////////////////////////////

function selectAllBudgets(source) {

    document
        .querySelectorAll(".budget-checkbox")
        .forEach(box => {

            box.checked = source.checked;

        });

}

////////////////////////////////////////////////////////////
// LOAD COMPANY BUDGETS
////////////////////////////////////////////////////////////

async function loadBudgets() {

    try {

        const response =
            await fetch(
                "/ceo/api/company-budgets"
            );

        const result =
            await response.json();

        if (result.success) {

            companyBudgets =
                result.data;

            renderBudgetTable(
                companyBudgets
            );

        }

    }

    catch (error) {

        console.error(error);

    }

}

////////////////////////////////////////////////////////////
// RENDER TABLE
////////////////////////////////////////////////////////////

function renderBudgetTable(data) {

    const body =
        document.getElementById(
            "budgetBody"
        );

    body.innerHTML = "";

    data.forEach(item => {

        body.innerHTML += `

        <tr>

            <td>

                <input
                    type="checkbox"
                    class="budget-checkbox"
                    value="${item.company_budget_id}"
                    onchange="selectBudget(${item.company_budget_id})">

            </td>

            <td>${item.budget_no}</td>

            <td>${item.financial_year}</td>

            <td>${item.department_name}</td>

            <td>${item.budget_item}</td>

            <td>${Number(item.total_budget).toLocaleString()}</td>

            <td>${item.budget_type}</td>

            <td>${item.start_date}</td>

            <td>${item.end_date}</td>

            <td>${Number(item.spent || 0).toLocaleString()}</td>

            <td>${Number(item.balance || 0).toLocaleString()}</td>

            <td>${item.created_by}</td>

            <td>${item.created_at}</td>

            <td>${item.ceo_approval_date || "-"}</td>

            <td>

                <span class="${item.ceo_status.toLowerCase()}">

                    ${item.ceo_status}

                </span>

            </td>

        </tr>

        `;

    });

}

////////////////////////////////////////////////////////////
// SELECT BUDGET
////////////////////////////////////////////////////////////

function selectBudget(id) {

    selectedBudgetId = id;

}







//////////////////////////////////////////
// LOAD DEPARTMENTS
//////////////////////////////////////////

async function loadDepartments() {


    try {


        const response =
            await fetch(
                "/ceo/api/departments"
            );



        const result =
            await response.json();




        const selects = [


            document.getElementById(
                "budgetDepartment"
            ),


            document.getElementById(
                "predictDepartment"
            )


        ];




        selects.forEach(select => {


            if (!select) return;



            select.innerHTML = `

                <option value="">
                    Select Department
                </option>

            `;



            result.data.forEach(dept => {


                select.innerHTML += `

                    <option value="${dept.department_id}">
                        ${dept.department_name}
                    </option>

                `;


            });


        });



    }

    catch(error) {


        console.error(error);


    }


}











async function loadCompanyBudgets(){

    try{


        const response = await fetch(
            "/ceo/api/company-budgets"
        );


        const result = await response.json();



        if(result.success){


            renderCompanyBudgetTable(
                result.data
            );


        }
        else{

            console.error(result.message);

        }



    }
    catch(error){

        console.error(
            "Loading budgets failed:",
            error
        );

    }

}

/* ==========================================
        SAVE COMPANY BUDGET
========================================== */

function submitBudget() {

    // Get all form values
    const budgetNo = document.getElementById("budgetNo").value.trim();

    const financialYear = document.getElementById("financialYear").value;

    const department = document.getElementById("createBudgetDepartment").value;

    const budgetAmount = document.getElementById("budgetAmount").value;

    const budgetType = document.getElementById("budgetType").value;

    const startDate = document.getElementById("budgetStart").value;

    const endDate = document.getElementById("budgetEnd").value;

    const remarks = document.getElementById("budgetRemarks").value.trim();

    const message = document.getElementById("budgetMessage");


    // Clear previous message
    message.innerHTML = "";


    // Validation
    if (financialYear === "") {

        message.innerHTML = "Please select the financial year.";

        return;
    }

    if (department === "") {

        message.innerHTML = "Please select a department.";

        return;
    }

    if (budgetType === "") {

        message.innerHTML = "Please select the budget type.";

        return;
    }

    if (startDate === "") {

        message.innerHTML = "Please select the start date.";

        return;
    }

    if (endDate === "") {

        message.innerHTML = "Please select the end date.";

        return;
    }


    // Create JSON object
    const budgetData = {

        budget_no: budgetNo,

        financial_year: financialYear,

        department_id: department,

        budget_amount: budgetAmount,

        budget_type: budgetType,

        start_date: startDate,

        end_date: endDate,

        remarks: remarks

    };


    // Send data to Flask
    fetch("/ceo/save_budget", {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(budgetData)

    })

    .then(response => {

        if (!response.ok) {

            throw new Error("Server Error");

        }

        return response.json();

    })

    .then(data => {

        message.innerHTML = data.message;

        if (data.success) {

            // Optional: Clear the form
            document.getElementById("financialYear").value = "";

            document.getElementById("createBudgetDepartment").value = "";

            document.getElementById("budgetAmount").value = "";

            document.getElementById("budgetType").value = "";

            document.getElementById("budgetStart").value = "";

            document.getElementById("budgetEnd").value = "";

            document.getElementById("budgetRemarks").value = "";

            // Optional: Reload budget table
            // loadCompanyBudgets();

        }

    })

    .catch(error => {

        console.error(error);

        message.innerHTML = "Failed to save budget.";

    });

}



document.addEventListener(
"DOMContentLoaded",
()=>{


    loadCompanyBudgets();

    loadDepartments();

    selectBudget


});