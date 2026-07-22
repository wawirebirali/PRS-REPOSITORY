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
// DEPARTMENT BUDGET MODULE
//////////////////////////////////////////


// =====================================================
// GLOBAL BUDGET DATA
// =====================================================

let budgets = [];


// =====================================================
// CREATE DEPARTMENT BUDGET
// =====================================================

async function submitBudget() {

    // ==========================================
    // GET FORM VALUES
    // ==========================================

    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        ).value;

    const departmentId =
        document.getElementById(
            "budgetDepartment"
        ).value;

    const budgetItem =
        document.getElementById(
            "budgetItem"
        ).value.trim();

    const quantity =
        document.getElementById(
            "budgetQuantity"
        ).value || 1;

    const unitCost =
        document.getElementById(
            "budgetUnitCost"
        ).value;

    const budgetType =
        document.getElementById(
            "budgetType"
        ).value;

    const startDate =
        document.getElementById(
            "budgetStart"
        ).value;

    const endDate =
        document.getElementById(
            "budgetEnd"
        ).value;

    const remarks =
        document.getElementById(
            "budgetRemarks"
        ).value.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!departmentId) {

        alert(
            "Please select a department."
        );

        return;

    }


    if (!companyBudgetId) {

        alert(
            "No company budget is available for the selected department."
        );

        return;

    }


    if (!budgetItem) {

        alert(
            "Please enter the budget item."
        );

        return;

    }


    if (!quantity || Number(quantity) <= 0) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    if (!unitCost || Number(unitCost) <= 0) {

        alert(
            "Please enter a valid unit cost."
        );

        return;

    }


    if (!budgetType) {

        alert(
            "Please select budget type."
        );

        return;

    }


    if (!startDate) {

        alert(
            "Please select start date."
        );

        return;

    }


    if (!endDate) {

        alert(
            "Please select end date."
        );

        return;

    }


    if (endDate < startDate) {

        alert(
            "End date cannot be before start date."
        );

        return;

    }


    // ==========================================
    // CREATE JSON DATA
    // ==========================================

    const data = {

        company_budget_id:
            Number(companyBudgetId),

        department_id:
            Number(departmentId),

        budget_item:
            budgetItem,

        quantity:
            Number(quantity),

        unit_cost:
            Number(unitCost),

        budget_type:
            budgetType,

        start_date:
            startDate,

        end_date:
            endDate,

        remarks:
            remarks

    };


    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
        "Sending Department Budget:",
        data
    );


    // ==========================================
    // SUBMIT BUTTON
    // ==========================================

    const submitButton =
        document.getElementById(
            "submitBudgetBtn"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
            "Saving...";

    }


    // ==========================================
    // AJAX REQUEST
    // ==========================================

    try {

        const response =
            await fetch(
                "/hod/api/budget/create",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        // ==========================================
        // CHECK HTTP RESPONSE
        // ==========================================

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // ==========================================
        // GET JSON RESPONSE
        // ==========================================

        const result =
            await response.json();


        console.log(
            "Create Budget Response:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.success) {

            alert(
                result.message ||
                "Department budget created successfully."
            );


            // ==========================================
            // CLEAR FORM
            // ==========================================

            clearDepartmentBudgetForm();


            // ==========================================
            // CLOSE CREATE BUDGET FORM
            // ==========================================

            closeCreateBudget();


            // ==========================================
            // RELOAD BUDGET TABLE
            // ==========================================

            loadBudgets();

        }


        // ==========================================
        // BACKEND ERROR
        // ==========================================

        else {

            alert(
                result.message ||
                "Failed to create department budget."
            );

        }


    }


    // ==========================================
    // AJAX / NETWORK ERROR
    // ==========================================

    catch(error) {

        console.error(
            "Create Department Budget Error:",
            error
        );


        alert(
            "Failed to create department budget. Please try again."
        );

    }


    // ==========================================
    // RE-ENABLE BUTTON
    // ==========================================

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                "Create Budget";

        }

    }

}



// =====================================================
// CLEAR DEPARTMENT BUDGET FORM
// =====================================================

function clearDepartmentBudgetForm() {

    // ==========================================
    // CLEAR COMPANY BUDGET
    // ==========================================

    const companyBudget =
        document.getElementById(
            "companyBudget"
        );

    if (companyBudget) {

        companyBudget.value = "";

        companyBudget.placeholder =
            "Select Department First";

    }


    // ==========================================
    // CLEAR HIDDEN COMPANY BUDGET ID
    // ==========================================

    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        );

    if (companyBudgetId) {

        companyBudgetId.value = "";

    }


    // ==========================================
    // CLEAR DEPARTMENT
    // ==========================================

    const department =
        document.getElementById(
            "budgetDepartment"
        );

    if (department) {

        department.value = "";

    }


    // ==========================================
    // CLEAR BUDGET ITEM
    // ==========================================

    const budgetItem =
        document.getElementById(
            "budgetItem"
        );

    if (budgetItem) {

        budgetItem.value = "";

    }


    // ==========================================
    // CLEAR QUANTITY
    // ==========================================

    const quantity =
        document.getElementById(
            "budgetQuantity"
        );

    if (quantity) {

        quantity.value = "";

    }


    // ==========================================
    // CLEAR UNIT COST
    // ==========================================

    const unitCost =
        document.getElementById(
            "budgetUnitCost"
        );

    if (unitCost) {

        unitCost.value = "";

    }


    // ==========================================
    // CLEAR BUDGET TYPE
    // ==========================================

    const budgetType =
        document.getElementById(
            "budgetType"
        );

    if (budgetType) {

        budgetType.value = "";

    }


    // ==========================================
    // CLEAR START DATE
    // ==========================================

    const startDate =
        document.getElementById(
            "budgetStart"
        );

    if (startDate) {

        startDate.value = "";

    }


    // ==========================================
    // CLEAR END DATE
    // ==========================================

    const endDate =
        document.getElementById(
            "budgetEnd"
        );

    if (endDate) {

        endDate.value = "";

    }


    // ==========================================
    // CLEAR REMARKS
    // ==========================================

    const remarks =
        document.getElementById(
            "budgetRemarks"
        );

    if (remarks) {

        remarks.value = "";

    }

}



// =====================================================
// LOAD DEPARTMENTS
// =====================================================

async function loadDepartments() {

    try {

        const response =
            await fetch(
                "/hod/api/departments"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load departments"
            );

        }


        const result =
            await response.json();


        console.log(
            "Departments:",
            result
        );


        // ==========================================
        // DEPARTMENT SELECTS
        // ==========================================

        const selects = [

            document.getElementById(
                "budgetDepartment"
            ),

            document.getElementById(
                "predictDepartment"
            )

        ];


        // ==========================================
        // POPULATE SELECTS
        // ==========================================

        selects.forEach(select => {

            if (!select) {

                return;

            }


            select.innerHTML = `

                <option value="">
                    Select Department
                </option>

            `;


            if (
                result.success &&
                result.data
            ) {

                result.data.forEach(
                    dept => {

                        select.innerHTML += `

                            <option
                                value="${dept.department_id}">
                                ${dept.department_name}
                            </option>

                        `;

                    }
                );

            }

        });


    }


    catch(error) {

        console.error(
            "Load Departments Error:",
            error
        );

    }

}



// =====================================================
// LOAD COMPANY BUDGET FOR SELECTED DEPARTMENT
// =====================================================

async function loadCompanyBudgetForDepartment(
    departmentId
) {

    const companyBudget =
        document.getElementById(
            "companyBudget"
        );


    const companyBudgetId =
        document.getElementById(
            "companyBudgetId"
        );


    // ==========================================
    // NO DEPARTMENT SELECTED
    // ==========================================

    if (!departmentId) {

        if (companyBudget) {

            companyBudget.value = "";

            companyBudget.placeholder =
                "Select Department First";

        }


        if (companyBudgetId) {

            companyBudgetId.value = "";

        }


        return;

    }


    // ==========================================
    // SHOW LOADING
    // ==========================================

    if (companyBudget) {

        companyBudget.value =
            "Loading...";

    }


    if (companyBudgetId) {

        companyBudgetId.value =
            "";

    }


    // ==========================================
    // FETCH COMPANY BUDGET
    // ==========================================

    try {

        const response =
            await fetch(
                "/hod/api/company-budget/" +
                departmentId
            );


        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "Company Budget Response:",
            result
        );


        // ==========================================
        // COMPANY BUDGET FOUND
        // ==========================================

        if (
            result.success &&
            result.data
        ) {

            if (companyBudget) {

                companyBudget.value =
                    result.data.budget_no;

            }


            if (companyBudgetId) {

                companyBudgetId.value =
                    result.data.company_budget_id;

            }

        }


        // ==========================================
        // COMPANY BUDGET NOT FOUND
        // ==========================================

        else {

            if (companyBudget) {

                companyBudget.value = "";

                companyBudget.placeholder =
                    result.message ||
                    "No Company Budget Found";

            }


            if (companyBudgetId) {

                companyBudgetId.value =
                    "";

            }

        }

    }


    catch(error) {

        console.error(
            "Load Company Budget Error:",
            error
        );


        if (companyBudget) {

            companyBudget.value = "";

            companyBudget.placeholder =
                "Failed to load Company Budget";

        }


        if (companyBudgetId) {

            companyBudgetId.value =
                "";

        }

    }

}



// =====================================================
// LOAD DEPARTMENT BUDGETS
// =====================================================

async function loadBudgets() {

    try {

        const response =
            await fetch(
                "/hod/api/budgets"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load budgets"
            );

        }


        const result =
            await response.json();


        console.log(
            "Department Budgets:",
            result
        );


        if (
            result.success &&
            result.data
        ) {

            budgets =
                result.data;


            renderBudgetTable(
                budgets
            );

        }

    }


    catch(error) {

        console.error(
            "Load Budgets Error:",
            error
        );

    }

}



// =====================================================
// DEPARTMENT CHANGE EVENT
// =====================================================

function setupDepartmentChangeEvent() {

    const departmentSelect =
        document.getElementById(
            "budgetDepartment"
        );


    if (!departmentSelect) {

        return;

    }


    departmentSelect.addEventListener(
        "change",
        function() {

            const departmentId =
                this.value;


            loadCompanyBudgetForDepartment(
                departmentId
            );

        }
    );

}



// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // Load departments

        loadDepartments();


        // Load existing department budgets

        loadBudgets();


        // Setup department selection

        setupDepartmentChangeEvent();

    }
);