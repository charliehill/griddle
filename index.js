const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Game state
class Game { 
    constructor(type, cols, rows) {
        this.type = type; // E.g., "sudoku"
        this.cols = cols;
        this.rows = rows;
        this.board = [rows]; 

        // Initialize the board
        for (let row=0; row<rows; row++) {
            this.board[row] = new Array(cols); 
            for (let col=0; col<cols; col++) {
                this.board[row][col] = {name:"", color:"", value:""}; // Initializing every cell to no user, default color
            }
        }
    }

    // Update the board and return the cell tha should be liberateed in return
    updateGame(click) { 

        // Extract the cell number
        const cellInfo = click.cell.split("."); // cell ID is in format "cell.XX.YY"
        let cellRow = cellInfo[1];
        let cellCol = cellInfo[2];

        // Find current cell for this user
        let oldCellRowCol = this.occupiedCell(click.name);
        let oldCellID = "";
        
        if (oldCellRowCol != "") { 
            this.releaseCell(oldCellRowCol.row, oldCellRowCol.col); 
            oldCellID = rowColToID(oldCellRowCol.row, oldCellRowCol.col); 
        }

        // Last click gets the cell
        this.claimCell(cellRow, cellCol, click.name, click.color); 

        // Return the previous cell if there was one otherwise ""
        return oldCellID;
    }

    // Find the cell that the user currently occupies
    occupiedCell(str) { 
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
        this.board[row][col].name = ""; 
        this.board[row][col].color = "";
    }

    claimCell(row, col, name, color) {
        this.board[row][col].name = name; 
        this.board[row][col].color = color; 
            // console.log("User " + name + " to cell." + row + "." + col); 
    }

    setValue(row, col, value) {
        this.board[row][col].value = value; 
    }

}

// List of games, initially empty
var games = []; 
//let game = new Game("MiniGrid", boardSize, boardSize); 

// Allow static files in Express
app.use(express.static(__dirname));

// Define client routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/grid', (req, res) => { 
    res.sendFile(__dirname + '/minigrid.html');
});

app.get('/grid3x4', (req, res) => { 
    res.sendFile(__dirname + '/minigrid3x4.html');
});

app.get('/sudoku', (req, res) => { 
    res.sendFile(__dirname + '/sudoku.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

// When a client connects, initialize it and start listening for various events
io.on('connection', (socket) => {

    // Connect/disconnect
    console.log('User connected');

    // Disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Chat 
    socket.on('Chat message', (msg) => {
        // console.log('message: ' + msg);
        io.emit('chat message', msg);
    });

    // Grid
    socket.on('game connect', (gameType, rows, cols) => {
        console.log("Connected for " + gameType);

        // Initialize the game on the client with a game of the required type
        let id = matchGame(gameType, rows, cols);
        socket.emit('init game', id, games[id]); 
    }); 

    socket.on('cell click', (gameID, click) => {
        let oldCell = games[gameID].updateGame(click);
        io.emit('cell update', gameID, click, oldCell);
    });

    socket.on('set value', (gameID, name, value) => {
        let cell = games[gameID].occupiedCell(name);
        if (cell != "") {
            games[gameID].setValue(cell.row, cell.col, value); 
            io.emit('value set', gameID, "cell." + cell.row + "." + cell.col, value);
        }
    });

});

// Listen for events
server.listen(3000, () => {
  console.log('Listening on *:3000');
});

// Function to return a game of the specified type 
function matchGame(gameType, rows, cols) {
    for (let i = 0; i<games.length; i++) {
        if (games[i].type == gameType) {
            console.log("Found matching game: " + gameType);     
            return i; // index of game matching gameType
        }
    }
    console.log("Creating new game: " + gameType);
    games.push(new Game(gameType, rows, cols)); 
    return games.length-1; // index of newly created game
}

// Generate cell ID from row and col values
function rowColToID(row, col) {
    return "cell." + row + "." + col;
}

/*
// Generate row and col values from cell ID
function IDtoRowCol(str) {
    let cellInfo = str.split("."); // cell ID is in format "cell.XX.YY"
    return {row: cellInfo[1], col: cellInfo[2]};   
}
*/