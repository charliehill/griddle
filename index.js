const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Game state
const boardSize = 3;
var game = [boardSize];
for (let i=0; i<boardSize; i++) {
    game[i] = new Array(boardSize); 
    for (let j=0; j<boardSize; j++) {
        game[i][j] = {name:"", color:""}; // Initializing every cell to no user, default color
    }
}

// Define client routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/grid', (req, res) => {
    res.sendFile(__dirname + '/mingrid.html');
});

// Listen for events
io.on('connection', (socket) => {

    // Connect/disconnect
    console.log('User connected');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Chat 
    socket.on('Chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // Grid
    socket.on('cell click', (click) => {
        let oldCell = updateGame(click);
        io.emit('cell update', click, oldCell);
    });
});

// Listen for events
server.listen(3000, () => {
  console.log('Listening on *:3000');
});

// Update the board and return the cell tha should be liberateed in return
function updateGame(click) { 

    // Extract the cell number
    const cellInfo = click.cell.split("."); // cell ID is in format "cell.XX.YY"
    let cellX = cellInfo[1];
    let cellY = cellInfo[2];

    // Find current cell for this user
    let oldCellXY = findCell(click.name);
    let oldCellID = "";
    
    if (oldCellXY != "") { 
        releaseCell(oldCellXY.i, oldCellXY.j); 
        oldCellID = cellID(oldCellXY.i, oldCellXY.j); 
    }

    // Last click gets the cell
    game[cellX][cellY].name = click.name; 
    game[cellX][cellY].color = click.color; 
    console.log(click.name + " moves to cell." + cellX + "." + cellY + " from " + oldCellID); 

    return oldCellID;
}

// Find thee cell that the user currently occupies
function findCell(name) {

    let oldCell = "";

    for (let i=0; i<boardSize; i++) {
        for (let j=0; j<boardSize; j++) {
            if (game[i][j].name == name) { return {i, j}; }
        }
    }
    
    return "";
}

// Remove current user's claim to a cell
function releaseCell(i, j) {
    game[i][j].name = ""; 
    game[i][j].color = "";
}

// Convert cell index into cell ID
function cellID(i, j) {
    return "cell." + i + "." + j;
}