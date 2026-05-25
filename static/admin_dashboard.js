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