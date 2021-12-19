const defaultColor = "#eee";

// Globals
var gameType; 
var rowSize; 
var colSize; 
var socket; 
var gameID; 

// Function to set game parameters, connect to the server, tell it about 
// the game, and listen for events from other clients. 
// These steps are contained in a function so different HTML pages can 
// represent different games with a variety of parameter values. 
function gameConnect(type, rows, cols) {

    // Set game parameters
    gameType = type; 
    rowSize = rows; 
    colSize = cols;

    // Connect to the server and get a socket by return
    socket = io();

    // Game ID for passing on user events
    gameID; // To initialize on "init game" event

    // Tell the server about the game
    socket.emit('game connect', gameType, rowSize, colSize);

    // Listen for incoming events from the server 
    socket.on('init game', function(id) {
        makeGameboard(rowSize, colSize); 
        gameID = id; 
    });

    socket.on('cell update', function(id, click, oldCell) {
        if (gameID == id) {
            unSetUserColor(oldCell);
            setUserColor(click.cell, click.color);    
        }
    });

    socket.on('value set', function(id, name, value) {
        if (gameID == id) setValue(name, value);
    });
}

// Function to catch a click and send it to server
function processClick(event) { 
    event.preventDefault();
    if (event.target.id != "gameboard") { // Make sure it's in a cell and not the spacing around it
        socket.emit('cell click', gameID, {cell: event.target.id, name: nickname.value, color: color});
    } 
}

// Function to set the value of a cell
function processValue(event) { 
    event.preventDefault();
    if (event.target.id != "buttonarea") { // Make sure it's in a button and not the spacing around it
        socket.emit('set value', gameID, nickname.value, buttonValue(event.target.id));
    }
}

// Function to load the grid
// Generate grid of divs in format <div id="cell.row.col"></div> 
function makeGameboard(rows, cols) {
    console.log("Building gameboard " + rows + "x" + cols); 

    let gameboard = document.getElementById("gameboard"); 

    // Set the CSS for the required grid layout
    let gridcolstr = "";
    for (let col=0; col<cols; col++) {
        gridcolstr += "auto ";
    }
    gameboard.style.gridTemplateColumns = gridcolstr; 

    // Generate the HTML for the cells
    for (let row=0; row<rows; row++) {
        for (let col=0; col<cols; col++) {
            let newDiv = document.createElement("div");
            newDiv.id = "cell." + row + "." + col;
            gameboard.appendChild(newDiv); 
        }
    }
}
    
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

