/* =====================================
   PRS LOGIN SIDE PANEL CONTROL
===================================== */


function openLogin(){

    const panel = document.getElementById("loginPanel");
    const overlay = document.getElementById("overlay");


    panel.classList.add("active");

    overlay.classList.add("active");

}





function closeLogin(){

    const panel = document.getElementById("loginPanel");
    const overlay = document.getElementById("overlay");


    panel.classList.remove("active");

    overlay.classList.remove("active");

}






/* =====================================
   CLOSE USING ESC KEY
===================================== */


document.addEventListener(
"keydown",
function(event){

    if(event.key === "Escape"){

        closeLogin();

    }

});






/* =====================================
   AUTO CLOSE AFTER LOGIN CLICK
===================================== */


document.querySelectorAll(".login-btn")
.forEach(button=>{


    button.addEventListener(
    "click",
    function(){

        closeLogin();

    });


});