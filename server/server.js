const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
  pingTimeout: 60 * 1000,    // 1 minute
});

const games = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create-game', ({myNewGameid, name}) => {
    socket.join(myNewGameid);
    console.log(`User ${name} created room ${myNewGameid}`);
    games.push({gameid: myNewGameid, playerOne: {name, id: socket.id, score: 0}, playerTwo: null});
  });

  socket.on('join-game', ({gameid, name}) => {
    const room = io.sockets.adapter.rooms.get(gameid);
    if (!room || room.size >= 2) {
      if (!room){
        console.log('Room does not exist');
        socket.emit('game-error', {msg : `Game "${gameid}" does not exist`});
      }
      else {
        console.log('Room is full');
        socket.emit('game-error', {gameid, msg: 'Game is full'});
      }
      return;
    }
    const game = games.find((g) => g.gameid === gameid);
    if(game.playerOne.name === name) {
      socket.emit('game-error', {msg: 'Name already taken'});
      return;
    }
    socket.join(gameid);
    console.log(`User ${name} joined room ${gameid} and room size is ${room.size}`);
    game.playerTwo = {name, id: socket.id, score: 0};
    io.to(gameid).emit('game-started', game);
    io.to(gameid).emit('user-joined');
  });

  socket.on('update-score', ({winner, gameid}) => {
    const game = games.find((g) => g.gameid === gameid);
    if(winner.id === game.playerOne.id) {
      game.playerOne.score++;
    } else {
      game.playerTwo.score++;
    }
    console.log(game);
    io.to(gameid).emit('listen-score-updated', game);
  });

  socket.on('reset-score', ({gameid}) => {
    const game = games.find((g) => g.gameid === gameid);
    if(game.playerOne) game.playerOne.score = 0;
    if(game.playerTwo) game.playerTwo.score = 0;
    io.to(gameid).emit('listen-score-updated', game);
  });

  socket.on('move', ({board, turn, gameid}) => {
    io.to(gameid).emit('updated', {board, turn});
  });

  socket.on('game-over', ({ winner, winningCombo, tie, gameid, gameisLive}) => {
    console.log(winner, tie, gameid, gameisLive, winningCombo)
    io.to(gameid).emit('listen-game-over', {winner, winningCombo, tie, gameisLive});
  });

  socket.on('reset-game', ({gameid, id}) => {
    io.to(gameid).emit('listen-reset-game', id);
  });



  socket.on('disconnect', () => {
    games.find((g) => {
      if (g.playerOne && g.playerOne.id === socket.id) {
        // io.to(g.gameid).emit('game-error', {msg: `${g.playerOne.name} left`});
        io.to(g.gameid).emit('left-game', {msg: `${g.playerOne.name} left`});
        g.playerOne = g.playerTwo;
        g.playerTwo = null;
        io.to(g.gameid).emit('game-started', g);
        if(!g.playerOne && !g.playerTwo) {
          games.splice(games.indexOf(g), 1);
        }   
        return true;
      }
      if (g.playerTwo && g.playerTwo.id === socket.id) {
        // io.to(g.gameid).emit('game-error', {gameid: g.gameid, msg: `${g.playerTwo.name} left`});
        io.to(g.gameid).emit('left-game', {msg: `${g.playerTwo.name} left`});
        g.playerTwo = null;
        io.to(g.gameid).emit('game-started', g);
        if(!g.playerOne && !g.playerTwo) {
          games.splice(games.indexOf(g), 1);
        }
        return true;
      }
      return false;
    });
    console.log(`User disconnected: ${socket.id}`);
  });

});
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server listening on port ${port}!`));
