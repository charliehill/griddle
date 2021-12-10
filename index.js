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
console.log(game); 

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
    socket.on('cell click', (clickinfo) => {
        console.log("Name " + clickinfo.name + ", color " + clickinfo.color + ", clicked cell " + clickinfo.cell);
        updateGame(clickinfo);
        io.emit('cell click', clickinfo);
    });
});

// Listen for events
server.listen(3000, () => {
  console.log('Listening on *:3000');
});

// updateGame() returns true if board should be updated
function updateGame(clickinfo) { 
    // Extract the cell number
    const cellInfo = clickinfo.cell.split("."); // cell ID is in format "cell.XX.YY"
    let cellX = cellInfo[1];
    let cellY = cellInfo[2];
    console.log("X: " + cellX + " Y: " + cellY); 

    // Last click gets the cell
    game[cellX][cellY].name = clickinfo.name; 
    game[cellX][cellY].color = clickinfo.color; 
    console.log(game[cellX][cellY]); 
}
