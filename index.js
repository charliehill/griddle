const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Game state
class Game { 
    constructor(type, cols, rows) {
        console.log("new game " + type + " " + cols + " " + rows); 
        this.type = type; // E.g., "sudoku"
        this.cols = cols;
        this.rows = rows;
        this.board = [rows]; 

        for (let row=0; row<rows; row++) {
            this.board[row] = new Array(cols); 
            for (let col=0; col<cols; col++) {
                this.board[row][col] = {name:"", color:""}; // Initializing every cell to no user, default color
            }
        }
        console.log (this.board); 
    }

    // Find the cell that the user currently occupies
    occupiedCell(str) { 
        console.log("check occupied " + str); 
        for (let row=0; row<this.rows; row++) {
            for (let col=0; col<this.cols; col++) {
                if (this.board[row][col].name == str) { 
                    return {row, col}; 
                }
            }
        }        
        return "";
    }

    // Remove current user's claim to a cell
    releaseCell(row, col) {
        console.log("release cell " + row + " " + col); 
        this.board[row][col].name = ""; 
        this.board[row][col].color = "";
    }

    claimCell(row, col, name, color) {
        console.log("claim cell " + row  + " " +  col  + " " +  name  + " " +  color); 
        this.board[row][col].name = name; 
        this.board[row][col].color = color; 
        console.log(name + " moves to cell." + row + "." + col); 
    }

}

let boardSize = 3;
let game = new Game("MiniGrid", boardSize, boardSize); 

// Allow static files in Express
app.use(express.static(__dirname));

// Define client routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/grid', (req, res) => { 
    res.sendFile(__dirname + '/minigrid.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

// When a client connects, initialize it and start listening for various events
io.on('connection', (socket) => {

    // Connect/disconnect
    console.log('User connected');

    // Initialize the game on the client
    socket.emit('init game', boardSize); 

    // Disconnects
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

    socket.on('set value', (name, value) => {
        let cell = game.occupiedCell(name);
        if (cell != "") io.emit('value set', "cell." + cell.row + "." + cell.col, value);
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
    let oldCellXY = game.occupiedCell(click.name);
    let oldCellID = "";
    console.log("old cell " + oldCellXY.row + ", " + oldCellXY.col + ", " + oldCellID); 
    
    if (oldCellXY != "") { 
        game.releaseCell(oldCellXY.row, oldCellXY.col); 
        oldCellID = cellID(oldCellXY.row, oldCellXY.col); 
    }

    // Last click gets the cell
    game.claimCell(cellX, cellY, click.name, click.color); 

    // Return the previous cell if there was one otherwise ""
    return oldCellID;
}

// Convert cell index into cell ID
function cellID(i, j) {
    return "cell." + i + "." + j;
}