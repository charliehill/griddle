const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Define the client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
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

// Handle incoming chat messages from any client
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      console.log('message: ' + msg);
    });
});

// Broadcast messages to everyone
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });

// Listen for events
server.listen(3000, () => {
  console.log('listening on *:3000');
});