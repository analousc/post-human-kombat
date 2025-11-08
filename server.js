const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static('public'));

let leaderboard = [];
const MAX_PLAYERS = 2; // Tournament mode - only 2 players

// Sort leaderboard by score (kills - deaths)
function sortLeaderboard() {
  leaderboard.sort((a, b) => {
    const scoreA = a.kills - a.deaths;
    const scoreB = b.kills - b.deaths;
    return scoreB - scoreA;
  });
}

// Initial sort
sortLeaderboard();

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);
  
  // Send current leaderboard to newly connected client (top 4 only)
  socket.emit('leaderboard-update', leaderboard.slice(0, 4));
  
  // Handle new player registration
  socket.on('register-player', (playerData) => {
    // Check if tournament is full
    if (leaderboard.length >= MAX_PLAYERS) {
      socket.emit('registration-failed', { 
        reason: 'TOURNAMENT FULL - ONLY 2 FIGHTERS ALLOWED' 
      });
      return;
    }

    // Check if character is already taken
    const characterTaken = leaderboard.find(p => p.name === playerData.name);
    if (characterTaken) {
      socket.emit('registration-failed', { 
        reason: 'CHARACTER ALREADY SELECTED - CHOOSE ANOTHER' 
      });
      return;
    }
    
    const newPlayer = {
      id: socket.id,
      name: playerData.name || `PLAYER-${socket.id.substring(0, 4)}`,
      kills: 0,
      deaths: 0,
      augmentations: playerData.augmentations || 'None'
    };
    
    leaderboard.push(newPlayer);
    sortLeaderboard();
    
    // Broadcast updated leaderboard to all clients (top 4 only)
    io.emit('leaderboard-update', leaderboard.slice(0, 4));
    socket.emit('player-registered', newPlayer);
    
    // If we now have 2 players, signal tournament ready
    if (leaderboard.length === MAX_PLAYERS) {
      io.emit('tournament-ready', {
        player1: leaderboard[0],
        player2: leaderboard[1]
      });
    }
  });
  
  // Handle score updates
  socket.on('update-score', (data) => {
    const player = leaderboard.find(p => p.id === socket.id);
    
    if (player) {
      if (data.kills !== undefined) player.kills += data.kills;
      if (data.deaths !== undefined) player.deaths += data.deaths;
      
      sortLeaderboard();
      
      // Broadcast updated leaderboard to all clients (top 4 only)
      io.emit('leaderboard-update', leaderboard.slice(0, 4));
      
      // Send confirmation back to the player
      socket.emit('score-updated', player);
    }
  });
  
  // Handle manual score set (for admin/testing)
  socket.on('set-score', (data) => {
    const player = leaderboard.find(p => p.id === data.playerId);
    
    if (player) {
      if (data.kills !== undefined) player.kills = data.kills;
      if (data.deaths !== undefined) player.deaths = data.deaths;
      if (data.augmentations !== undefined) player.augmentations = data.augmentations;
      
      sortLeaderboard();
      io.emit('leaderboard-update', leaderboard.slice(0, 4));
    }
  });
  
  // Handle player fatality
  socket.on('fatality', (data) => {
    const winner = leaderboard.find(p => p.id === socket.id);
    const loser = leaderboard.find(p => p.id === data.loserId);
    
    if (winner && loser) {
      winner.kills += 1;
      loser.deaths += 1;
      
      sortLeaderboard();
      
      io.emit('fatality-performed', {
        winner: winner.name,
        loser: loser.name,
        augmentation: winner.augmentations
      });
      
      io.emit('leaderboard-update', leaderboard.slice(0, 4));
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
  
  // Reset leaderboard
  socket.on('reset-leaderboard', () => {
    leaderboard = [];
    io.emit('leaderboard-update', leaderboard.slice(0, 4));
    io.emit('system-message', 'TOURNAMENT RESET - READY FOR NEW FIGHTERS');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`⚡ POST-HUMAN KOMBAT LEADERBOARD SERVER ACTIVE ON PORT ${PORT} ⚡`);
});
