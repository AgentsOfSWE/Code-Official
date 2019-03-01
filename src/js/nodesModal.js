function nodesModal(){


// Get the modal
let modal = document.getElementById('nodesModal');

// Get the button that opens the modal
let btn = document.getElementsByClassName("modalNodes");

// Get the <span> element that closes the modal
let span = document.getElementsByClassName("fa fa-close")[0];

// When the user clicks the button, open the modal
for(let i=0; i<btn.length; i++) {
    btn[i].onclick = function() {
        modal.style.display = "block";
        var ul = document.getElementById("sourcesNames");
        // getDatasources bundle.js InfluxDBConnection.js
        
        const connessione = new InfluxDBConnection('greg', 'greg', '142.93.102.115', '8086', 'telegraf');

        connessione.getDatasources().then(x => {
            for(let i = 0; i<x.length; i++){
                const li = document.createElement('li');
                li.innerHTML = x[i];
                ul.appendChild(li);
                alert(x[i]);
            }
        });
    }
}
// When the user clicks on <span> (x), close the modal
span.onclick  = function() {
    // for(let i=0; i<modal.length; i++)
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        // for(let i=0; i<modal.length; i++)
            modal.style.display = "none";
    }
}
}