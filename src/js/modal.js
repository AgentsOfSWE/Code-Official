/*
File: modal.js
Creation date: 2019-02-08
Author: Carlotta Segna
Type: JavaScript
Author e-mail: carlotta.segna@studenti.unipd.it
Version: 0.0.1

Changelog:
0.0.1 || Carlotta Segna || 2019-02-06 || Funzione modal
*/

// Get the modal
let modal = document.getElementById('myModal');

// Get the button that opens the modal
let btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
let span = document.getElementsByClassName("fa fa-close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}