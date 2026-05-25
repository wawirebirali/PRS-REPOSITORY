let selectedRow=null;

/* MODULE SWITCH */
function openModule(id,btn){

document.querySelectorAll(".module").forEach(m=>m.classList.remove("active"));
document.getElementById(id).classList.add("active");

document.querySelectorAll(".sidebar button").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
}

/* SELECT ONLY ONE ROW */
function selectRow(row){

document.querySelectorAll("#prsTable tr").forEach(r=>{
r.classList.remove("selected");
let radio=r.querySelector("input");
if(radio) radio.checked=false;
});

row.classList.add("selected");
row.querySelector("input").checked=true;

let c=row.getElementsByTagName("td");
let id = row.getAttribute("data-id");

document.getElementById("d_prs").innerText=c[1].innerText;
    document.getElementById("d_dept").innerText=c[2].innerText;
    document.getElementById("d_status").innerText=c[3].innerText;
    document.getElementById("d_submit").innerText=c[4].innerText;
    document.getElementById("d_hod_approval").innerText=c[5].innerText;

    document.getElementById("approveForm").action = "/hod/approve/" + id;
}

/* SEARCH */
function searchPRS(){
let input=document.querySelector(".search input").value.toUpperCase();
let rows=document.querySelectorAll("#prsTable tr");

for(let i=1;i<rows.length;i++){
rows[i].style.display =
rows[i].innerText.toUpperCase().includes(input) ? "" : "none";
}
}
