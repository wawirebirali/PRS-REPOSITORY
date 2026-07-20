//////////////////////////////////////////
// TOGGLE PREDICT BUDGET PANEL
//////////////////////////////////////////

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





//////////////////////////////////////////
// SELECT ALL ITEMS
//////////////////////////////////////////

function toggleSelectAllItems() {

    const check =
        document.getElementById("selectAllItems");


    const items =
        document.getElementById("predictItems");


    if (!check || !items) return;



    Array.from(items.options).forEach(option => {

        option.selected = check.checked;

    });

}





//////////////////////////////////////////
// PREDICT BUDGET
//////////////////////////////////////////

function predictBudget() {


    const department =
        document.getElementById("predictDepartment").value;



    const items =
        Array.from(
            document.getElementById("predictItems").selectedOptions
        )
        .map(item => item.value);



    if (items.length === 0) {

        alert("Select budget items");
        return;

    }



    const start =
        document.getElementById("predictStart").value;



    const end =
        document.getElementById("predictEnd").value;



    if (!start || !end) {

        alert("Select dates");
        return;

    }



    const days =
        Math.max(

            Math.ceil(

                (new Date(end) - new Date(start))
                /
                (1000 * 60 * 60 * 24)

            ),

            1

        );



    const prediction =
        days * items.length * 50000;



    document.getElementById(
        "predictionContent"
    ).innerHTML = `

        <p>
            <b>Department:</b> ${department}
        </p>


        <p>
            <b>Items:</b> ${items.join(", ")}
        </p>


        <p>
            <b>Duration:</b> ${days} days
        </p>


        <h2>
            Predicted Budget:
            UGX ${prediction.toLocaleString()}
        </h2>

    `;



    document.getElementById(
        "predictionResult"
    ).style.display = "block";


}







//////////////////////////////////////////
// SEARCH BUDGET
//////////////////////////////////////////

function searchBudget() {


    const keyword =
        document.getElementById("budgetSearch")
        .value
        .toLowerCase();



    const filtered =
        budgets.filter(b =>


            (b.budget_no || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.department_name || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.budget_item || "")
            .toLowerCase()
            .includes(keyword)



            ||



            (b.budget_type || "")
            .toLowerCase()
            .includes(keyword)


        );



    renderBudgetTable(filtered);


}








//////////////////////////////////////////
// OPEN CREATE BUDGET
//////////////////////////////////////////

function openCreateBudget() {


    document.getElementById(
        "createBudgetTab"
    ).style.display = "block";



    document.getElementById(
        "predictBudgetTab"
    ).style.display = "none";


}





function closeCreateBudget() {


    document.getElementById(
        "createBudgetTab"
    ).style.display = "none";


}









//////////////////////////////////////////
// CREATE DEPARTMENT BUDGET
//////////////////////////////////////////

async function submitBudget() {


    const data = {


        company_budget_id:
            document.getElementById("companyBudget").value,


        department_id:
            document.getElementById("budgetDepartment").value,


        budget_item:
            document.getElementById("budgetItem").value,


        quantity:
            document.getElementById("budgetQuantity").value || 1,


        unit_cost:
            document.getElementById("budgetUnitCost").value,


        budget_type:
            document.getElementById("budgetType").value,


        start_date:
            document.getElementById("budgetStart").value,


        end_date:
            document.getElementById("budgetEnd").value,


        remarks:
            document.getElementById("budgetRemarks").value


    };




    try {


        const response =
            await fetch(
                "/hod/api/budget/create",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                        "application/json"

                    },


                    body:
                    JSON.stringify(data)

                }
            );




        const result =
            await response.json();





        if (result.success) {


            alert(result.message);



            closeCreateBudget();



            loadBudgets();



        }

        else {


            alert(result.message);


        }



    }

    catch(error) {


        console.error(error);


        alert(
            "Failed to create budget"
        );


    }



}









//////////////////////////////////////////
// LOAD DEPARTMENTS
//////////////////////////////////////////

async function loadDepartments() {


    try {


        const response =
            await fetch(
                "/hod/api/departments"
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









//////////////////////////////////////////
// LOAD COMPANY BUDGETS
//////////////////////////////////////////

async function loadCompanyBudgets() {


    try {


        const response =
            await fetch(
                "/hod/api/company-budgets"
            );



        const result =
            await response.json();




        const select =
            document.getElementById(
                "companyBudget"
            );




        select.innerHTML = `

            <option value="">
                Select Company Budget
            </option>

        `;




        result.data.forEach(item => {


            select.innerHTML += `

                <option value="${item.company_budget_id}">
                    ${item.budget_no}
                </option>

            `;


        });



    }

    catch(error) {


        console.error(error);


    }


}









//////////////////////////////////////////
// LOAD DEPARTMENT BUDGETS
//////////////////////////////////////////

let budgets = [];



async function loadBudgets() {


    try {


        const response =
            await fetch(
                "/hod/api/budgets"
            );



        const result =
            await response.json();




        if (result.success) {


            budgets =
                result.data;



            renderBudgetTable(
                budgets
            );


        }



    }

    catch(error) {


        console.error(error);


    }


}









//////////////////////////////////////////
// PAGE LOAD
//////////////////////////////////////////

document.addEventListener(
    "DOMContentLoaded",
    () => {


        loadBudgets();


        loadDepartments();


        loadCompanyBudgets();


    }
);