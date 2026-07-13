//////////////////////////////////////////
// TOGGLE PREDICT BUDGET PANEL
//////////////////////////////////////////
function togglePredictBudget() {
    const panel = document.getElementById("predictBudgetTab");

    if (!panel) return;

    const isVisible = panel.style.display === "block";

    panel.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
        panel.scrollIntoView({ behavior: "smooth" });
    }
}


//////////////////////////////////////////
// SELECT ALL / UNSELECT ALL ITEMS
//////////////////////////////////////////
function toggleSelectAllItems() {
    const selectAll = document.getElementById("selectAllItems");
    const items = document.getElementById("predictItems");

    if (!selectAll || !items) return;

    for (let option of items.options) {
        option.selected = selectAll.checked;
    }
}


//////////////////////////////////////////
// KEEP SELECT ALL IN SYNC
//////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    const items = document.getElementById("predictItems");
    const selectAll = document.getElementById("selectAllItems");

    if (!items || !selectAll) return;

    items.addEventListener("change", () => {
        let allSelected = true;

        for (let opt of items.options) {
            if (!opt.selected) {
                allSelected = false;
                break;
            }
        }

        selectAll.checked = allSelected;
    });
});


//////////////////////////////////////////
// PREDICT BUDGET LOGIC
//////////////////////////////////////////
function predictBudget() {

    const department = document.getElementById("predictDepartment").value;

    const items = Array.from(
        document.getElementById("predictItems").selectedOptions
    ).map(opt => opt.value);

    if (items.length === 0) {
        alert("Please select at least one budget item");
        return;
    }

    const start = document.getElementById("predictStart").value;
    const end = document.getElementById("predictEnd").value;

    if (!start || !end) {
        alert("Please select start and end dates");
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate < startDate) {
        alert("End date cannot be earlier than start date");
        return;
    }

    const days = Math.max(
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        1
    );

    const costPerItemPerDay = 50000;
    const totalItems = items.length;
    const predictedTotal = costPerItemPerDay * days * totalItems;

    document.getElementById("predictionContent").innerHTML = `
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Selected Items:</strong> ${items.join(", ")}</p>
        <p><strong>Total Items:</strong> ${totalItems}</p>
        <p><strong>Start Date:</strong> ${start}</p>
        <p><strong>End Date:</strong> ${end}</p>
        <p><strong>Duration:</strong> ${days} days</p>

        <hr>

        <h2 style="color:green;">
            Predicted Budget: UGX ${predictedTotal.toLocaleString()}
        </h2>
    `;

    document.getElementById("predictionResult").style.display = "block";
}


//////////////////////////////////////////
// SEARCH BUDGET TABLE
//////////////////////////////////////////
function searchBudget(){

    const keyword = document
        .getElementById("budgetSearch")
        .value
        .toLowerCase();

    const filtered = budgets.filter(b =>

        b.budget_no.toLowerCase().includes(keyword) ||

        b.department_name.toLowerCase().includes(keyword) ||

        b.budget_item.toLowerCase().includes(keyword) ||

        b.budget_type.toLowerCase().includes(keyword)

    );

    renderBudgetTable(filtered);

}

//////////////////////////////////////////
// CREATE BUDGET NAVIGATION
//////////////////////////////////////////
function openCreateBudget() {
    const createTab = document.getElementById("createBudgetTab");
    const predictTab = document.getElementById("predictBudgetTab");

    if (!createTab || !predictTab) return;

    createTab.style.display = "block";
    predictTab.style.display = "none";
}


function closeCreateBudget() {
    const createTab = document.getElementById("createBudgetTab");

    if (!createTab) return;

    createTab.style.display = "none";
}


//////////////////////////////////////////
// SUBMIT BUDGET TO BACKEND
//////////////////////////////////////////
async function submitBudget() {

    const data = {
        department_id: document.getElementById("budgetDepartment").value,
        budget_item: document.getElementById("budgetItem").value,
        budget_type: document.getElementById("budgetType").value,
        budget_amount: document.getElementById("budgetAmount").value,
        start_date: document.getElementById("budgetStart").value,
        end_date: document.getElementById("budgetEnd").value
    };

    try {

        const response = await fetch("/hod/api/budget/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {

            alert(result.message);

            // Clear form
            document.getElementById("budgetDepartment").selectedIndex = 0;
            document.getElementById("budgetItem").value = "";
            document.getElementById("budgetType").selectedIndex = 0;
            document.getElementById("budgetAmount").value = "";
            document.getElementById("budgetStart").value = "";
            document.getElementById("budgetEnd").value = "";

            // Hide create panel
            document.getElementById("createBudgetTab").style.display = "none";

            // Reload budget list (if you have this function)
            if (typeof loadBudgets === "function") {
                loadBudgets();
            }

        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);
        alert("Failed to create budget.");

    }
}


async function loadDepartments() {

    try {

        const response = await fetch("/hod/api/departments");
        const result = await response.json();

        const select = document.getElementById("budgetDepartment");

        select.innerHTML = '<option value="">Select Department</option>';

        if (result.success) {

            result.data.forEach(dept => {

                select.innerHTML += `
                    <option value="${dept.department_id}">
                        ${dept.department_name}
                    </option>
                `;

            });

        }

    } catch (error) {
        console.error("Error loading departments:", error);
    }

}

document.addEventListener("DOMContentLoaded", function () {

    loadDepartments();

});

//////////////////////////////////////////
// TOGGLE DEPARTMENT BUDGET PANEL
//////////////////////////////////////////
function toggleDepartmentBudget() {

    const panel = document.getElementById("departmentBudgetTab");

    if (panel.style.display === "block") {
        panel.style.display = "none";
    } else {
        panel.style.display = "block";
        panel.scrollIntoView({ behavior: "smooth" });
    }
}


//////////////////////////////////////////
// LOAD DEPARTMENT SUMMARY
//////////////////////////////////////////
function loadDepartmentBudget() {

    const dept = document.getElementById("deptSelect").value;

    const data = {
        Finance: {
            budget: 20000000,
            spent: 8500000,
            status: "Approved"
        },

        ICT: {
            budget: 50000000,
            spent: 18500000,
            status: "Approved"
        },

        Procurement: {
            budget: 15000000,
            spent: 6000000,
            status: "Pending"
        },

        Stores: {
            budget: 10000000,
            spent: 3500000,
            status: "Approved"
        },

        Administration: {
            budget: 12000000,
            spent: 5000000,
            status: "Pending"
        }
    };

    if (!dept || !data[dept]) {
        return;
    }

    const balance = data[dept].budget - data[dept].spent;

    document.getElementById("summaryDepartment").textContent = dept;
    document.getElementById("summaryBudget").textContent =
        data[dept].budget.toLocaleString();

    document.getElementById("summarySpent").textContent =
        data[dept].spent.toLocaleString();

    document.getElementById("summaryBalance").textContent =
        balance.toLocaleString();

    document.getElementById("summaryStatus").textContent =
        data[dept].status;
}



let budgets = [];

async function loadBudgets() {

    try {

        const response = await fetch("/hod/api/budgets");
        const result = await response.json();

        if (!result.success) {
            alert(result.message);
            return;
        }

        budgets = result.data;

        renderBudgetTable(budgets);

    } catch (error) {

        console.error(error);

    }

}


document.addEventListener("DOMContentLoaded", function(){

    loadBudgets();

});