const defaultColor = "#eee";

// Globals
var gameType; 
var rowSize; 
var colSize; 
var socket; 
var gameID; 
var userColor;

// Function to set game parameters, connect to the server, tell it 
// about the game, and listen for events from other clients. 
// HTML pages can call it to represent different games. 
function gameConnect(type, rows, cols) {

    // Set game parameters
    gameType = type; 
    rowSize = rows; 
    colSize = cols;

    // Connect to the server and get a socket by return
    socket = io();

    // Tell the server about the game
    socket.emit('game connect', gameType, rowSize, colSize);

    // Listen for incoming events from the server 
    socket.on('init game', function(id, game) {
        gameID = id; 
        makeGameboard(rowSize, colSize); 
        initGameboard(game); 
    });

    socket.on('cell update', function(id, cellID, color, oldCellID) {
        if (gameID == id) {
            resetCellColor(oldCellID);
            setCellColor(cellID, color); 
        }
    });

    socket.on('value set', function(id, name, value) {
        if (gameID == id) setCellValue(name, value);
    });
}

// Function to draw the board on the page
function makeGameboard(rows, cols) {
    if (gameType=="Sudoku") 
        makeSudokuBoard(rows, cols); 

    else 
        makeSimpleBoard(rows, cols);

}

// Function to make a basic gameboard
function makeSimpleBoard(rows, cols) {

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


// Function to make a Sudoku-specific board 
function makeSudokuBoard(rows, cols) {

    // Check it's the supported size before continuing
    if (rows!=9 || cols!=9) {
        error("Error building Sudoku gameboard: wrong size"); 
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


// Function to set the state of the board to match a game object passed from the server
function initGameboard(game) {
    for (row=0; row<game.rows; row++) {
        for (col=0; col<game.cols; col++) {
            let cell = rowColToID(row, col); 
            setCellColor(cell, game.board[row][col].color);
            setCellValue(cell, game.board[row][col].value); 
        }
    }    
}
    
// Function to catch a click and send it to server
function processClick(event) { 
    event.preventDefault();
    if (event.target.id.substr(0,4) == "cell") { // Make sure it's in a cell and not the spacing around it
        // log(gameID + ", " + event.target.id + ", " + nickname.value + ", " + userColor); 
        socket.emit('cell click', gameID, event.target.id, nickname.value, userColor);
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

// Better function to generate highlight color from user's nickname
function stringToColor2(str) {

    if (str.length >= 3) { // skip for strings less than three chars
        let mod = str.length%3; // modulus
        let sLen, lLen;
        sLen = lLen = (str.length/3); // quotient
 
        // Divide the string into 3 parts, favoring Hue then Saturation if there is a remainder
        let lStr = str.slice(0, lLen);
        let sStr = str.slice(lLen,lLen+sLen); 
        let hStr = str.slice(lLen+sLen); // to end
        // log("String: " + str + ", L: " + lStr + ", S: " + sStr + ", H: " + hStr); 

        color = "hsl(" + hVal(hStr) + ", " + sVal(sStr) + "%, " +  lVal(lStr) + "%)";
        return color; 
    }

    return "#eee"; // Couldn't compute a color
}

// Better function to generate highlight color from user's nickname
function stringToColor3(str) {

    if (str.length >= 3) { // skip for strings less than three chars
        // let mod = str.length%3; // modulus
        let sLen, lLen;
        sLen = lLen = (str.length/3); // quotient
 
        // Divide the string into 3 parts
        let hStr = str.slice(0, lLen);
        let sStr = str.slice(lLen,lLen+sLen); 
        let lStr = str.slice(lLen+sLen); // to end

        color = "hsl(" + hVal(hStr) + ", " + sVal(sStr) + "%, " +  lVal(lStr) + "%)";
        return color; 
    }

    return "#eee"; // Couldn't compute a color
}

function hVal(str) {
    return stringToVal(str, 0, 360); // Hue in range 0-360 
}

function sVal(str) {
    return stringToVal(str, 30, 70); // Saturation percent
}

function lVal(str) {
    return stringToVal(str, 60, 80); // Intensity percent
}

// Alphabet for indexing a character to get a number
const alphabetStr = "abcdefghijklmnopqrstuvwxyz"; 
// Balanced alphabet for even distribution - see https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html
// Frequency order in English: EARIOTNSLCUDPMHGBFYWKVXZJQ, eariotnslcudpmhgbfywkvxzjq
// Manually scrambled (in attempt to encourage more diverse values): qepklhbtiydaxwscofnjuvgmrz
const balancedAlphabetStr = "qepklhbtiydaxwscofnjuvgmrz"; 
const tweakedAlphabetStr = "cqpkltheiydaxwofnjuvgsmrzb"; 

// Return an integer between 0 and 100 based on average char value of the string, where a = 0 and z = range;
function stringToVal(str, floor, ceiling) {
    let strLower = str.toLowerCase(); 
/*
    if (strLower.length > 4) { // cut off the first letter to reduce bias
        strLower = strLower.slice(1); 
    }
*/
    if (strLower.length > 4) { // cut off the last letter to reduce consistency
        strLower = strLower.slice(-1); 
    }
    let len = strLower.length; 
    let val = 0;
    for (let i=0; i<len; i++) 
        val += (tweakedAlphabetStr.indexOf(strLower.slice(i,i+1))); // val is in range (0-25) * i
    
    val = val/len; // average over the characters in the string in range 0-25
    val = floor + (val * (ceiling-floor) / 25); 
    return val.toFixed();
}

// Catch a key in nickname field and generate color from it
function genUserColor(event) { 
    event.preventDefault();
    userColor=stringToColor3(nickname.value);
    document.getElementById("nickname").style.borderColor = userColor;
}

function resetCellColor (cellID) {
    if (cellID != "") {
        document.getElementById(cellID).style.backgroundColor = defaultColor;
    }
}

// Set the color of a cell
function setCellColor(cellID, color) { 
    // log(cellID); 
    if (color == "") color = defaultColor; 
    document.getElementById(cellID).style.backgroundColor = color; 
}

// Set the value of a cell
function setCellValue(cellID, cellValue) { 
    document.getElementById(cellID).innerHTML = cellValue; 
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

// Print to log
function log(str) {
    console.log(str); 
}

// Print to log
function error(str) {
    console.error(str); 
}

