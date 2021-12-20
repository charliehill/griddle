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
    socket.on('init game', function(id, game) {
        gameID = id; 
        makeGameboard(rowSize, colSize); 
        initGameboard(game); 
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

// Function to draw the board on the page
function makeGameboard(rows, cols) {
    if (gameType=="Sudoku") {

        // Check it's the supported size before continuing
        if (rows!=9 || cols!=9) {
            console.log("Error building Sudoku gameboard: wrong size"); 
            return; 
        }

        // console.log("Building Sudoku gameboard"); 

        let sudokuboard = document.getElementById("sudokuboard"); // Sudoku-specific outer grid for board

        // Sudoku is constructed as a 3x3 grid of 3x3 gameboards
        const outerSize = 3;
        const innerSize = 3;
        for (let outerRow=0; outerRow<outerSize; outerRow++) {
           for (let outerCol=0; outerCol<outerSize; outerCol++) {

                // Insert a new gameboard
                let gameboard = document.createElement("div");
                gameboard.id = "gameboard." + outerRow + "." + outerCol;
                gameboard.className = "gameboard";
                sudokuboard.appendChild(gameboard); // e.g., <div id="gameboard.0.1">

                // Set the CSS for the required grid layout
                let gridcolstr = "";
                for (let col=0; col<innerSize; col++) {
                    gridcolstr += "auto ";
                }
                gameboard.style.gridTemplateColumns = gridcolstr; 
                
                // Make the 9 cells for the gameboard 
                innerRowStart = outerRow*3;
                innerColStart = outerCol*3;
                for (let innerRow=innerRowStart; innerRow<innerRowStart+3; innerRow++) {
                    for (let innerCol=innerColStart; innerCol<innerColStart+3; innerCol++) {
                        let newDiv = document.createElement("div");
                        newDiv.id = "cell." + innerRow + "." + innerCol;
                        gameboard.appendChild(newDiv); // e.g., <div id="cell.0.1"></div>          
                    }
                }
           } 
        }
    }
    else {
        // console.log("Building gameboard " + rows + "x" + cols); 

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
                gameboard.appendChild(newDiv); // e.g., <div id="cell.0.1"></div> 
            }
        }
    }
}

// Function to set the state of the board to match a game object passed from the server
function initGameboard(game) {
    for (row=0; row<game.rows; row++) {
        for (col=0; col<game.cols; col++) {
            let cell = rowColToID(row, col); 
            setUserColor(cell, game.board[row][col].color);
            setValue(cell, game.board[row][col].value); 
        }
    }    
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
    if (color == "") color = defaultColor;  
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

// Generate cell ID from row and col values
function rowColToID(row, col) {
    return "cell." + row + "." + col;
}
