const defaultColor = "#eee";
        
// Connect to the server and get a socket by return
var socket = io();

// Function to catch a click and send it to server
function processClick(event) { 
    event.preventDefault();
    if (event.target.id != "gameboard") { // Make sure it's in a cell and not the spacing around it
        socket.emit('cell click', {cell: event.target.id, name: nickname.value, color: color});
    } 
}

function processValue(event) { 
    event.preventDefault();
    if (event.target.id != "buttonarea") { // Make sure it's in a button and not the spacing around it
        socket.emit('set value', nickname.value, buttonValue(event.target.id));
    }
}

// Listen for incoming clicks 
socket.on('cell update', function(click, oldCell) {
    unSetUserColor(oldCell);
    setUserColor(click.cell, click.color);
});

socket.on('value set', function(name, value) {
    setValue(name, value);
});

// Function to generate highlight color from user's nickname
function stringToColor(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var color = '#';
    for (var i = 0; i < 3; i++) {
        // var value = (hash >> (i * 8)) & 0xFF // Full range of values 0-256
        // var value = ((hash >> (i * 8)) & 0x88) + 0x44; // Mid range values only 64-192
        var value = ((hash >> (i * 8)) & 0x88) + 0x66; // Mid range values only 64-192
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

// Catch a key in nickname field and generate color from it
var color;

function genUserColor() { 
    event.preventDefault();
    color=stringToColor(nickname.value);
    document.getElementById("nickname").style.borderColor = color;
}

function unSetUserColor (cellID) {
    if (cellID != "") {
        document.getElementById(cellID).style.backgroundColor = defaultColor;
    }
}

// Set the color of a cell
function setUserColor(cell, color) { 
    document.getElementById(cell).style.backgroundColor = color; 
}

// Set the value of a cell
function setValue(cell, value) { 
    document.getElementById(cell).innerHTML = value; 
}

// Return the value represented by the button
function buttonValue(cellID) {
    let val = cellID.split(".")[1];
    if (val == 0) val = ""; 
    return val; 
}

