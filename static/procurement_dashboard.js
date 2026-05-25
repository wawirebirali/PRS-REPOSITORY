function selectRow(row){
let c=row.getElementsByTagName("td");
document.getElementById("d_prs").innerText=c[1].innerText;
document.getElementById("d_dept").innerText=c[2].innerText;
document.getElementById("d_status").innerText=c[3].innerText;
document.getElementById("d_submit").innerText="2026-05-02";
row.querySelector("input").checked=true;
}

function searchPRS(){
let input=document.querySelector(".search input").value.toUpperCase();
let rows=document.querySelectorAll("table tr");

for(let i=1;i<rows.length;i++){
rows[i].style.display =
rows[i].innerText.toUpperCase().includes(input) ? "" : "none";
}
}