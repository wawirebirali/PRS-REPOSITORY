function openModule(id,button){


let modules=document.querySelectorAll(".module");


modules.forEach(function(module){

module.classList.remove("active");

});



document.getElementById(id).classList.add("active");



let buttons=document.querySelectorAll(".menu");


buttons.forEach(function(btn){

btn.classList.remove("active");

});


if(button){

button.classList.add("active");

}


}


