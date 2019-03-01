/*
 * File: main.js
 * Creation date: 2019-02-13
 * Author: Marco Chilese & Carlotta Segna
 * Type: ECMAScript 6
 * Author e-mail: marco.chilese@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.1 || Marco Chilese & Carlotta Segna || 2019-02-13 || Sviluppo file
 */

document.querySelector('.readBytesButtons').addEventListener('click', function(evt) {
  if (evt.target.tagName.toLowerCase() == 'button') {
    var startByte = evt.target.getAttribute('data-startbyte');
    var endByte = evt.target.getAttribute('data-endbyte');
    readBlob(startByte, endByte);
  }
}, false);

function readBlob(opt_startByte, opt_stopByte) {
  
  var files = document.getElementById('files').files;
  if (!files.length) {
    alert('Please select a file!');
    return;
  }
  
  var file = files[0];
  var start = parseInt(opt_startByte) || 0;
  var stop = parseInt(opt_stopByte) || file.size - 1;
  
  var reader = new FileReader();
  
  // If we use onloadend, we need to check the readyState.
  reader.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
      //document.getElementById('titolo').textContent = evt.target.result;
      //console.log(evt.target.result);
      const text = evt.target.result;
      
      parserCall(text);
    }
  };
  
  var blob = file.slice(start, stop + 1);
  reader.readAsBinaryString(blob);
}

function parserCall(network) {
  // alert("parserCall");
  const netParser = new NetworkParser(network);
  
  const nodeJSON = JSON.parse(netParser.getJsonFromString());
  
  writeNodes(nodeJSON);
}

function addItem(value){
  // alert("addItem");
  let ul = document.getElementById("nodes-list");
  // alert("addItem-1");
  let li = document.createElement("li");
  
  li.classList.add('modalstyle');
  li.onclick= function() {alert("schifo")};
  // li.setAttribute('id', value);
  li.appendChild(document.createTextNode(value)); //insert id here
  document.getElementById("nodes-list").appendChild(li);
}

function writeNodes(nodes) {
  // alert("writeNodes");
  nodes.forEach(node => {
    alert("schifo");
    addItem(node);
  });
}
