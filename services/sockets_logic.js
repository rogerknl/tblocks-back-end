const hf = require(__dirname + '/../utils/helperFunctions');
const TeltrisGame = require(__dirname + '/teltrisGame');

const uuid = require('uuid');


const allPlayers = [];
const availablePlayers = [];

let playerCount = 0;
module.exports.playerCount = playerCount;
module.exports.availablePlayers = availablePlayers;
module.exports.allPlayers = allPlayers;

exports.disconnect = (socket) => {
  // If the user which disconnected was in the list of available players,
  // remove it from there
  let indexToDelete = null;
  for (let i = 0; i < availablePlayers.length; i++) {
    const currentPlayer = availablePlayers[i];

    if (currentPlayer.id === socket.id) {

      indexToDelete = String(i);
    }
  }

  if (indexToDelete) {
    availablePlayers.splice(Number(indexToDelete), 1);
  }

  allPlayers.splice(allPlayers.indexOf(socket.id), 1);
  playerCount = allPlayers.length;

  for (const currentPlayer of allPlayers) {
    socket.nsp.to(currentPlayer).emit('players online', playerCount);
  }

};

exports.keyPressed = (data) => {
  const gameID = data.player.gameID;
  const userID = data.player.id;

  const boardIndex = TeltrisGame.games[gameID].players.indexOf(userID);
  const board = TeltrisGame.games[gameID].boards[boardIndex];
  if (data.key === 'left') {
    board.playerMove(-1);
  }
  if (data.key === 'right') {
    board.playerMove(1);
  }
  if (data.key === 'up') {
    board.playerRotate(1);
  }
  if (data.key === 'down') {
    board.playerDrop();
  }
  if (data.key === 'spacebar') {
    board.playerDropToBottom();
  }
}

exports.makePlayerAvailable = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    board: null,
    gameID: null
  };

  if (availablePlayers.length === 0) {
    availablePlayers.push(newPlayer);
    // Now that the user has been made available, update the client
    socket.nsp.to(socket.id).emit('updateClient', {status:'wait', player: null, opponent: null});
  } else {
    let opponent = availablePlayers.splice(0, 1)[0];

    // Create Game in the server:
    const gameID = uuid();

    // Create a match
    const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket);
    const p2Board = new TeltrisGame.TeltrisGame(gameID, opponent.id, socket);

    TeltrisGame.games[gameID] = {
      players: [newPlayer.id, opponent.id],
      boards: [p1Board, p2Board]
    };

    newPlayer.gameID = gameID;
    opponent.gameID = gameID;

    socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponent: opponent});
    socket.nsp.to(opponent.id).emit('updateClient', {status:'pair', player: opponent, opponent: newPlayer});
    p1Board.playerReset();
    p1Board.update();
    p2Board.playerReset();
    p2Board.update();
  }
}




// colors = [
//   null,
//   '#a000f0',    // T
//   '#f0a000',    // L
//   '#0000f0',    // J
//   '#00f000',    // S
//   '#f00000',    // Z
//   '#00f0f0',    // L
//   '#f0f000'     // O
// ];