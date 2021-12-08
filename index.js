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
  
// Listen for events
io.on('connection', (socket) => {
    // Connect/disconnect
    console.log('User connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    // Chat 
    socket.on('Chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    // Grid
    socket.on('cell click', (clickinfo) => {
        console.log("User " + clickinfo.user + " clicked cell " + clickinfo.cell);
        io.emit('cell click', clickinfo);
    });
});

// Listen for events
server.listen(3000, () => {
  console.log('Listening on *:3000');
});