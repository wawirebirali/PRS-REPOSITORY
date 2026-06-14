let selectedRow = null;

// SWITCH SECTIONS
function showSection(id){

    document.querySelectorAll(".section").forEach(sec=>{
        sec.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
}

// SELECT ROW
function selectRow(row){

    document.querySelectorAll("#prsTable tbody tr").forEach(r=>{
        r.classList.remove("selected");
    });

    row.classList.add("selected");
    selectedRow = row;
}

// VIEW REQUISITION
function viewSelected(){

    if(!selectedRow){
        alert("Select a requisition first");
        return;
    }

    let id = selectedRow.getAttribute('data-id');
    window.location.href = `/admin/view/${id}`;
}

// PRINT REQUISITION
function printSelected(){

    if(!selectedRow){
        alert("Select a requisition first");
        return;
    }

    let id = selectedRow.getAttribute('data-id');

    let printWindow = window.open(
        `/admin/view/${id}`,
        '_blank',
        'width=800,height=600'
    );

    printWindow.onload = function() {
        printWindow.print();
    };
}



// audit trial

function showSection(sectionId){

    // hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // show selected section
    document.getElementById(sectionId).classList.add('active');
}




// generating report

// static/js/report.js

let currentReport = null;

const reports = {

    users: {

        title: "Users Activity Report",

        columns: [
            "User ID",
            "Username",
            "Role",
            "Department",
            "Login Time",
            "Logout Time",
            "Duration",
            "Action Performed",
            "Features Accessed",
            "IP Address",
            "Status"
        ],

        data: [

            [
                1,
                "john_admin",
                "Admin",
                "ICT",
                "08:00 AM",
                "05:00 PM",
                "9 Hours",
                "Created User Accounts",
                "Dashboard, Reports, Users",
                "192.168.1.1",
                "Active"
            ],

            [
                2,
                "sarah_fin",
                "Finance",
                "Accounts",
                "08:15 AM",
                "04:30 PM",
                "8 Hours 15 Min",
                "Approved Invoice",
                "Finance, Invoice",
                "192.168.1.2",
                "Logged Out"
            ],

            [
                3,
                "michael_proc",
                "Procurement",
                "Procurement",
                "09:00 AM",
                "03:45 PM",
                "6 Hours 45 Min",
                "Generated Purchase Order",
                "PO, GRN, Suppliers",
                "192.168.1.3",
                "Accessed"
            ],

            [
                4,
                "grace_hod",
                "HOD",
                "Stores",
                "07:50 AM",
                "04:20 PM",
                "8 Hours 30 Min",
                "Approved Requisition",
                "Requisition, Dashboard",
                "192.168.1.4",
                "Active"
            ],

            [
                5,
                "ceo_mark",
                "CEO",
                "Management",
                "10:00 AM",
                "01:30 PM",
                "3 Hours 30 Min",
                "Reviewed Reports",
                "Reports, Finance",
                "192.168.1.5",
                "Logged Out"
            ]

        ]
    },

    finance: {

        title: "Finance Report",

        columns: [
            "Payment ID",
            "Supplier",
            "Invoice No",
            "Amount",
            "Processed By",
            "Payment Date",
            "Status"
        ],

        data: [

            [
                101,
                "ABC Limited",
                "INV001",
                "$4,500",
                "Sarah",
                "2026-05-20",
                "Paid"
            ],

            [
                102,
                "Mega Traders",
                "INV002",
                "$2,200",
                "James",
                "2026-05-21",
                "Pending"
            ],

            [
                103,
                "Tech Solutions",
                "INV003",
                "$8,900",
                "Sarah",
                "2026-05-22",
                "Paid"
            ],

            [
                104,
                "Global Supplies",
                "INV004",
                "$6,000",
                "Kevin",
                "2026-05-23",
                "Approved"
            ],

            [
                105,
                "Prime Stationers",
                "INV005",
                "$1,750",
                "Sarah",
                "2026-05-24",
                "Pending"
            ]

        ]
    },

    audit: {

        title: "Audit Trail Report",

        columns: [
            "Audit ID",
            "Username",
            "Action",
            "Module",
            "Date",
            "Time",
            "IP Address"
        ],

        data: [

            [
                1,
                "john_admin",
                "Created Requisition",
                "Requisition",
                "2026-05-20",
                "08:20 AM",
                "192.168.1.1"
            ],

            [
                2,
                "michael_proc",
                "Approved PO",
                "Procurement",
                "2026-05-20",
                "10:45 AM",
                "192.168.1.2"
            ],

            [
                3,
                "sarah_fin",
                "Processed Invoice",
                "Finance",
                "2026-05-21",
                "01:20 PM",
                "192.168.1.3"
            ],

            [
                4,
                "grace_hod",
                "Approved PRS",
                "Approval",
                "2026-05-21",
                "09:30 AM",
                "192.168.1.4"
            ],

            [
                5,
                "ceo_mark",
                "Viewed Reports",
                "Reports",
                "2026-05-22",
                "11:15 AM",
                "192.168.1.5"
            ]

        ]
    },

    requisition: {

        title: "Requisition Report",

        columns: [
            "PRS No",
            "Department",
            "Requested By",
            "Submission Date",
            "Status",
            "Approved By"
        ],

        data: [

            [
                "PRS001",
                "ICT",
                "John",
                "2026-05-01",
                "Approved",
                "Grace"
            ],

            [
                "PRS002",
                "Finance",
                "Sarah",
                "2026-05-02",
                "Pending",
                "N/A"
            ],

            [
                "PRS003",
                "Stores",
                "Michael",
                "2026-05-03",
                "Completed",
                "CEO"
            ],

            [
                "PRS004",
                "HR",
                "Kevin",
                "2026-05-04",
                "Rejected",
                "Grace"
            ],

            [
                "PRS005",
                "ICT",
                "Peter",
                "2026-05-05",
                "Approved",
                "CEO"
            ]

        ]
    },

    grn: {

        title: "GRN Report",

        columns: [
            "GRN No",
            "PO No",
            "Supplier",
            "Received By",
            "Inspection Status",
            "Received Date"
        ],

        data: [

            [
                "GRN001",
                "PO001",
                "ABC Limited",
                "Michael",
                "Accepted",
                "2026-05-04"
            ],

            [
                "GRN002",
                "PO002",
                "Mega Traders",
                "James",
                "Pending",
                "2026-05-05"
            ],

            [
                "GRN003",
                "PO003",
                "Tech Solutions",
                "Peter",
                "Accepted",
                "2026-05-06"
            ],

            [
                "GRN004",
                "PO004",
                "Prime Stationers",
                "Kevin",
                "Rejected",
                "2026-05-07"
            ],

            [
                "GRN005",
                "PO005",
                "Global Supplies",
                "Michael",
                "Accepted",
                "2026-05-08"
            ]

        ]
    },

    quotation: {

        title: "Quotation Report",

        columns: [
            "Quotation No",
            "Supplier",
            "Amount",
            "Prepared By",
            "Date",
            "Status"
        ],

        data: [

            [
                "QT001",
                "ABC Limited",
                "$2,500",
                "John",
                "2026-05-10",
                "Approved"
            ],

            [
                "QT002",
                "Mega Traders",
                "$1,800",
                "Sarah",
                "2026-05-11",
                "Pending"
            ],

            [
                "QT003",
                "Tech Solutions",
                "$5,000",
                "Michael",
                "2026-05-12",
                "Rejected"
            ],

            [
                "QT004",
                "Prime Stationers",
                "$3,700",
                "Kevin",
                "2026-05-13",
                "Approved"
            ],

            [
                "QT005",
                "Global Supplies",
                "$6,200",
                "Peter",
                "2026-05-14",
                "Approved"
            ]

        ]
    },

    invoice: {

        title: "Invoice Report",

        columns: [
            "Invoice No",
            "Supplier",
            "Amount",
            "Processed By",
            "Invoice Date",
            "Status"
        ],

        data: [

            [
                "INV001",
                "ABC Limited",
                "$7,500",
                "Sarah",
                "2026-05-15",
                "Paid"
            ],

            [
                "INV002",
                "Mega Traders",
                "$4,100",
                "James",
                "2026-05-16",
                "Pending"
            ],

            [
                "INV003",
                "Tech Solutions",
                "$9,000",
                "Sarah",
                "2026-05-17",
                "Paid"
            ],

            [
                "INV004",
                "Prime Stationers",
                "$2,300",
                "Kevin",
                "2026-05-18",
                "Approved"
            ],

            [
                "INV005",
                "Global Supplies",
                "$6,800",
                "Sarah",
                "2026-05-19",
                "Pending"
            ]

        ]
    },

    po: {

        title: "Purchase Order Report",

        columns: [
            "PO No",
            "Supplier",
            "Amount",
            "Prepared By",
            "Date",
            "Status"
        ],

        data: [

            [
                "PO001",
                "ABC Limited",
                "$10,000",
                "Michael",
                "2026-05-01",
                "Approved"
            ],

            [
                "PO002",
                "Mega Traders",
                "$4,500",
                "John",
                "2026-05-02",
                "Pending"
            ],

            [
                "PO003",
                "Tech Solutions",
                "$6,800",
                "Sarah",
                "2026-05-03",
                "Completed"
            ],

            [
                "PO004",
                "Prime Stationers",
                "$3,000",
                "Kevin",
                "2026-05-04",
                "Approved"
            ],

            [
                "PO005",
                "Global Supplies",
                "$12,000",
                "Michael",
                "2026-05-05",
                "Completed"
            ]

        ]
    }

};

function generateReport(){

    const reportType = document.getElementById("reportType").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if(reportType === ""){
        alert("Please select report");
        return;
    }

    if(startDate === "" || endDate === ""){
        alert("Please select dates");
        return;
    }

    currentReport = reports[reportType];

    let html = `

    <h2>${currentReport.title}</h2>

    <p style="margin-top:10px;">
    <strong>From:</strong> ${startDate}
    &nbsp;&nbsp;
    <strong>To:</strong> ${endDate}
    </p>

    <table>

    <thead>
    <tr>
    `;

    currentReport.columns.forEach(col => {
        html += `<th>${col}</th>`;
    });

    html += `</tr></thead><tbody>`;

    currentReport.data.forEach(row => {

        html += `<tr>`;

        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });

        html += `</tr>`;
    });

    html += `
    </tbody>
    </table>

    <div class="summary">
    Total Records:
    ${currentReport.data.length}
    </div>
    `;

    document.getElementById("reportContainer").innerHTML = html;
}

function downloadCSV(){

    if(currentReport === null){
        alert("Generate report first");
        return;
    }

    let csv = [];

    csv.push(currentReport.columns.join(","));

    currentReport.data.forEach(row => {
        csv.push(row.join(","));
    });

    const csvContent = csv.join("\n");

    const blob = new Blob([csvContent], {
        type:"text/csv"
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = currentReport.title.replace(/\s/g, "_") + ".csv";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
}




/*NOTIFICATION*/

function markRead(btn){
    const notif = btn.parentElement;
    notif.classList.remove("unread");
    btn.remove();
}

function markAllRead(){
    document.querySelectorAll(".notif").forEach(n => {
        n.classList.remove("unread");
        const btn = n.querySelector("button");
        if(btn) btn.remove();
    });
}

function clearNotifications(){
    document.getElementById("notifContainer").innerHTML = "";
}

function filterNotifications(){
    const input = document.getElementById("notifSearch").value.toLowerCase();
    const items = document.querySelectorAll(".notif");

    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(input) ? "block" : "none";
    });
}


function logoutUser() {
    window.location.href = "/logout";
}