function openModule(id, button) {


let modules=document.querySelectorAll(".module");


modules.forEach(function(module){

module.classList.remove("active");

});



const targetModule = document.getElementById(id);

if (targetModule) {
    targetModule.classList.add('active');
}



document.querySelectorAll('.sidebar button, .menu').forEach(function (btn) {
    btn.classList.remove('active');
});

if (button) {
    button.classList.add('active');
}


}


