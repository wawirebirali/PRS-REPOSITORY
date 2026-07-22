/* ==========================================================
        CEO COMPANY BUDGET MANAGEMENT
========================================================== */


/* ==========================================================
        GLOBAL VARIABLE
        Stores the currently selected budget
========================================================== */

let selectedBudgetId = null;


/* ==========================================================
        OPEN CREATE BUDGET PANEL
========================================================== */
/* ==========================================================
        OPEN CREATE BUDGET
========================================================== */

function openCreateBudget() {

    // Show Create Budget panel
    document.getElementById(
        "createBudgetTab"
    ).style.display = "block";


    // Hide Prediction panel
    document.getElementById(
        "predictBudgetTab"
    ).style.display = "none";


    // Hide Department Summary
    document.getElementById(
        "departmentBudgetTab"
    ).style.display = "none";


    // Hide Approval Panel
    document.getElementById(
        "budgetApprovalTab"
    ).style.display = "none";


    // Clear previous message
    document.getElementById(
        "budgetMessage"
    ).innerHTML = "";


    // Load departments
    loadCreateBudgetDepartments();


    // Generate budget number
    generateBudgetNumber();

}

/* ==========================================================
        CLOSE CREATE BUDGET PANEL
========================================================== */

function closeCreateBudget() {

    // Hide Create Budget panel
    document.getElementById("createBudgetTab").style.display = "none";

    // Clear form
    clearBudgetForm();

}


/* ==========================================================
        GENERATE BUDGET NUMBER
========================================================== */
function generateBudgetNumber() {

    const budgetNoInput =
        document.getElementById("budgetNo");

    if (!budgetNoInput) {
        console.error(
            "budgetNo input not found"
        );
        return;
    }

    fetch("/ceo/api/budget/generate-number", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })

    .then(response => {

        console.log(
            "Budget Number HTTP Status:",
            response.status
        );

        if (!response.ok) {

            throw new Error(
                "Failed to generate budget number"
            );

        }

        return response.json();

    })

    .then(data => {

        console.log(
            "Budget Number Response:",
            data
        );

        if (data.success) {

            budgetNoInput.value =
                data.budget_no;

        } else {

            console.error(
                "Budget Number Error:",
                data.message
            );

        }

    })

    .catch(error => {

        console.error(
            "Budget Number Error:",
            error
        );

    });

}




/* ==========================================================
        LOAD DEPARTMENTS FOR CREATE BUDGET
========================================================== */
/* ==========================================================
        LOAD DEPARTMENTS FOR CREATE COMPANY BUDGET
========================================================== */

function loadCreateBudgetDepartments() {

    // Get Create Budget department dropdown
    const departmentSelect =
        document.getElementById(
            "createBudgetDepartment"
        );


    // Check if dropdown exists
    if (!departmentSelect) {

        console.error(
            "createBudgetDepartment select not found"
        );

        return;

    }


    // Show loading
    departmentSelect.innerHTML = `

        <option value="">
            Loading Departments...
        </option>

    `;


    // AJAX GET request
    fetch("/ceo/api/departments", {

        method: "GET",

        headers: {

            "Accept":
                "application/json"

        }

    })


    // Convert response to JSON
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }

        return response.json();

    })


    // Process JSON data
    .then(data => {

        console.log(
            "Departments Response:",
            data
        );


        // Clear dropdown
        departmentSelect.innerHTML = `

            <option value="">
                Select Department
            </option>

        `;


        // Check successful response
        if (
            data.success &&
            Array.isArray(data.data)
        ) {


            // Loop through departments
            data.data.forEach(
                department => {

                    // Create option
                    const option =
                        document.createElement(
                            "option"
                        );


                    // Set department ID
                    option.value =
                        department.department_id;


                    // Set department name
                    option.textContent =
                        department.department_name;


                    // Add option to select
                    departmentSelect.appendChild(
                        option
                    );

                }
            );


        } else {

            // No departments found
            departmentSelect.innerHTML = `

                <option value="">
                    No Departments Found
                </option>

            `;

        }

    })


    // Handle errors
    .catch(error => {

        console.error(
            "Department Loading Error:",
            error
        );


        departmentSelect.innerHTML = `

            <option value="">
                Failed to Load Departments
            </option>

        `;

    });

}

/* ==========================================================
        CREATE / SAVE COMPANY BUDGET
========================================================== */
/* ==========================================================
        SUBMIT COMPANY BUDGET
========================================================== */
function submitBudget() {

    // ==========================================
    // GET MESSAGE ELEMENT
    // ==========================================

    const message =
        document.getElementById("budgetMessage");


    // ==========================================
    // GET FORM VALUES
    // ==========================================

    const budgetNo =
        document.getElementById("budgetNo").value.trim();

    const financialYear =
        document.getElementById("financialYear").value;

    const departmentId =
        document.getElementById("createBudgetDepartment").value;

    const budgetAmount =
        document.getElementById("allocatedAmount").value;

    const budgetType =
        document.getElementById("budgetType").value;

    const startDate =
        document.getElementById("budgetStart").value;

    const endDate =
        document.getElementById("budgetEnd").value;

    const remarks =
        document.getElementById("budgetRemarks").value.trim();


    // ==========================================
    // CLEAR OLD MESSAGE
    // ==========================================

    message.innerHTML = "";


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!financialYear) {

        message.innerHTML =
            "Please select financial year.";

        return;
    }


    if (!departmentId) {

        message.innerHTML =
            "Please select department.";

        return;
    }


    if (
        !budgetAmount ||
        Number(budgetAmount) <= 0
    ) {

        message.innerHTML =
            "Please enter a valid budget amount.";

        return;
    }


    if (!budgetType) {

        message.innerHTML =
            "Please select budget type.";

        return;
    }


    if (!startDate) {

        message.innerHTML =
            "Please select start date.";

        return;
    }


    if (!endDate) {

        message.innerHTML =
            "Please select end date.";

        return;
    }


    if (endDate < startDate) {

        message.innerHTML =
            "End date cannot be before start date.";

        return;
    }


    // ==========================================
    // CREATE JSON DATA
    // ==========================================

    const budgetData = {

        budget_no:
            budgetNo,

        financial_year:
            financialYear,

        department_id:
            departmentId,

        allocated_amount:
            Number(budgetAmount),

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
        "Sending Budget:",
        budgetData
    );


    // ==========================================
    // SHOW SAVING MESSAGE
    // ==========================================

    message.innerHTML =
        "Saving budget...";


    // ==========================================
    // GET SUBMIT BUTTON
    // ==========================================

    const submitButton =
        document.getElementById("submitBudgetBtn");


    // ==========================================
    // DISABLE SUBMIT BUTTON
    // ==========================================

    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
            "Saving...";

    }


    // ==========================================
    // AJAX POST REQUEST
    // ==========================================

    fetch(
        "/ceo/api/budget/create",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json"

            },

            body:
                JSON.stringify(
                    budgetData
                )

        }
    )


    // ==========================================
    // RECEIVE FLASK RESPONSE
    // ==========================================

    .then(response => {

        console.log(
            "Create Budget HTTP Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        return response.json();

    })


    // ==========================================
    // PROCESS FLASK RESPONSE
    // ==========================================

    .then(data => {

        console.log(
            "Create Budget Response:",
            data
        );


        // ==========================================
        // SUCCESSFUL SUBMISSION
        // ==========================================

        if (data.success) {

            console.log(
                "Company budget created successfully."
            );


            // ==========================================
            // SHOW SUCCESS MESSAGE
            // ==========================================

            message.innerHTML =
                data.message ||
                "Company budget created successfully.";


            // ==========================================
            // CLEAR FORM
            // ==========================================

            document.getElementById(
                "budgetNo"
            ).value = "";


            document.getElementById(
                "financialYear"
            ).value = "";


            document.getElementById(
                "createBudgetDepartment"
            ).value = "";


            document.getElementById(
                "allocatedAmount"
            ).value = "";


            document.getElementById(
                "budgetType"
            ).value = "";


            document.getElementById(
                "budgetStart"
            ).value = "";


            document.getElementById(
                "budgetEnd"
            ).value = "";


            document.getElementById(
                "budgetRemarks"
            ).value = "";


            // ==========================================
            // GENERATE NEW BUDGET NUMBER
            // ==========================================

            if (
                typeof generateBudgetNumber ===
                "function"
            ) {

                generateBudgetNumber();

            }


            // ==========================================
            // RELOAD COMPANY BUDGET TABLE
            // ==========================================

            if (
                typeof loadCompanyBudgets ===
                "function"
            ) {

                loadCompanyBudgets();

            }


            // ==========================================
            // HIDE CREATE BUDGET FORM
            // ==========================================

            const createBudgetTab =
                document.getElementById(
                    "createBudgetTab"
                );


            if (createBudgetTab) {

                createBudgetTab.style.display =
                    "none";

            }


            // ==========================================
            // SHOW BUDGET TABLE
            // ==========================================

            const companyBudgetTable =
                document.getElementById(
                    "companyBudgetTable"
                );


            if (companyBudgetTable) {

                companyBudgetTable.style.display =
                    "block";

            }


            // ==========================================
            // RE-ENABLE SUBMIT BUTTON
            // ==========================================

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    "Create Budget";

            }

        }


        // ==========================================
        // FAILED SUBMISSION
        // ==========================================

        else {

            console.error(
                "Budget creation failed:",
                data.message
            );


            message.innerHTML =
                data.message ||
                "Failed to create budget.";


            // Re-enable button

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    "Create Budget";

            }

        }

    })


    // ==========================================
    // HANDLE AJAX / NETWORK ERROR
    // ==========================================

    .catch(error => {

        console.error(
            "Create Budget Error:",
            error
        );


        message.innerHTML =
            "An error occurred while creating the budget. Please try again.";


        // Re-enable button

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                "Create Budget";

        }

    });

}
/* ==========================================================
        SELECT A BUDGET
========================================================== */

function selectBudget(checkbox) {

    if (checkbox.checked) {

        selectedBudgetId =
            checkbox.value;

        console.log(
            "Selected Budget ID:",
            selectedBudgetId
        );

    } else {

        selectedBudgetId = null;

    }

}


/* ==========================================================
        SELECT ALL BUDGETS
========================================================== */

function selectAllBudgets(
    masterCheckbox
) {

    const checkboxes =
        document.querySelectorAll(
            ".budget-checkbox"
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.checked =
                masterCheckbox.checked;

        }
    );


    if (masterCheckbox.checked &&
        checkboxes.length > 0) {

        selectedBudgetId =
            checkboxes[0].value;

    } else {

        selectedBudgetId = null;

    }

}


/* ==========================================================
        INITIALIZE BUDGET MODULE
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Load company budgets
        loadCompanyBudgets();

    }
);



/* ==========================================================
        LOAD DEPARTMENTS FOR CREATE COMPANY BUDGET
========================================================== */

function loadCreateBudgetDepartments() {

    // Get Create Budget department dropdown
    const departmentSelect =
        document.getElementById(
            "createBudgetDepartment"
        );


    // Check if dropdown exists
    if (!departmentSelect) {

        console.error(
            "createBudgetDepartment select not found"
        );

        return;

    }


    // Show loading
    departmentSelect.innerHTML = `

        <option value="">
            Loading Departments...
        </option>

    `;


    // AJAX GET request
    fetch("/ceo/api/departments", {

        method: "GET",

        headers: {

            "Accept":
                "application/json"

        }

    })


    // Convert response to JSON
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }

        return response.json();

    })


    // Process JSON data
    .then(data => {

        console.log(
            "Departments Response:",
            data
        );


        // Clear dropdown
        departmentSelect.innerHTML = `

            <option value="">
                Select Department
            </option>

        `;


        // Check successful response
        if (
            data.success &&
            Array.isArray(data.data)
        ) {


            // Loop through departments
            data.data.forEach(
                department => {

                    // Create option
                    const option =
                        document.createElement(
                            "option"
                        );


                    // Set department ID
                    option.value =
                        department.department_id;


                    // Set department name
                    option.textContent =
                        department.department_name;


                    // Add option to select
                    departmentSelect.appendChild(
                        option
                    );

                }
            );


        } else {

            // No departments found
            departmentSelect.innerHTML = `

                <option value="">
                    No Departments Found
                </option>

            `;

        }

    })


    // Handle errors
    .catch(error => {

        console.error(
            "Department Loading Error:",
            error
        );


        departmentSelect.innerHTML = `

            <option value="">
                Failed to Load Departments
            </option>

        `;

    });

}