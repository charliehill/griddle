const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Define client routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/grid', (req, res) => {
    res.sendFile(__dirname + '/mingrid.html');
  });
  
  
// Handle connections/disconnections
io.on('connection', (socket) => {
  console.log('a user connected');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
});

// CHAT APP
// Handle incoming chat messages from any client
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      console.log('message: ' + msg);
      io.emit('chat message', msg);
    });
});

// GRID APP
// Handle incoming cell clicks from any client
io.on('connection', (socket) => {
    socket.on('cell click', (clickinfo) => {
      console.log("user: " + clickinfo.user + " cell: " + clickinfo.cell);
      socket.broadcast.emit('cell click', clickinfo);
    });
});

// Listen for events
server.listen(3000, () => {
  console.log('listening on *:3000');
});