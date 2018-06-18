const hf = require(__dirname + '/../utils/helperFunctions');
const TeltrisGame = require(__dirname + '/teltrisGame');

const uuid = require('uuid');


const allPlayers = [];
const availablePlayersVS = [];
const availablePlayersFFA = [];

let playerCount = 0;
module.exports.playerCount = playerCount;
module.exports.availablePlayersVS = availablePlayersVS;
module.exports.availablePlayersFFA = availablePlayersFFA;
module.exports.allPlayers = allPlayers;

function searchAndRemoveDiscFromArr(arr, socket) {
  let indexToDelete = null;
  for (let i = 0; i < arr.length; i++) {
    const currentPlayer = arr[i];
    if (currentPlayer.id === socket.id) {
      indexToDelete = String(i);
    }
  }
  if (indexToDelete) {
    arr.splice(Number(indexToDelete), 1);
  }

}

exports.disconnect = (socket) => {
  // If the user which disconnected was in the list of available players,
  // remove it from there
  searchAndRemoveDiscFromArr(availablePlayersVS, socket);
  searchAndRemoveDiscFromArr(availablePlayersFFA, socket);

  allPlayers.splice(allPlayers.indexOf(socket.id), 1);
  playerCount = allPlayers.length;

  for (const currentPlayer of allPlayers) {
    socket.nsp.to(currentPlayer).emit('players online', playerCount);
  }
};

exports.keyPressed = (data) => {
  const gameID = data.player.gameID;
  const userID = data.player.id;

  if(TeltrisGame.games[gameID].finished) return null;

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
exports.makePlayerAvailableFFA = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    board: null,
    gameID: null
  };

  if (availablePlayersFFA.length < 2) {
    availablePlayersFFA.push(newPlayer);
    // Now that the user has been made available, update the client
    socket.nsp.to(socket.id).emit('updateClient', {status:'wait', player: null, opponent: null});
  } else {
    const opponents = availablePlayersFFA.splice(0, 2);
    let opponent1 = opponents[0];
    let opponent2 = opponents[1];

    // Create Game in the server:
    const gameID = uuid();

    // Create a match
    const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket);
    const p2Board = new TeltrisGame.TeltrisGame(gameID, opponent1.id, socket);
    const p3Board = new TeltrisGame.TeltrisGame(gameID, opponent2.id, socket);

    TeltrisGame.games[gameID] = {
      players: [newPlayer.id, opponent1.id, opponent2.id],
      boards: [p1Board, p2Board, p3Board]
    };

    newPlayer.gameID = gameID;
    opponent1.gameID = gameID;
    opponent2.gameID = gameID;

    socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: [opponent1,opponent2]});
    socket.nsp.to(opponent1.id).emit('updateClient', {status:'pair', player: opponent1, opponents: [newPlayer,opponent2], });
    socket.nsp.to(opponent2.id).emit('updateClient', {status:'pair', player: opponent2, opponents: [newPlayer,opponent1], });

    p1Board.playerReset();
    p1Board.update();
    p2Board.playerReset();
    p2Board.update();
    p3Board.playerReset();
    p3Board.update();
  }
}
exports.makePlayerSolo = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    board: null,
    gameID: null
  };

  // Create Game in the server:
  const gameID = uuid();

  // Create a match
  const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket);

  TeltrisGame.games[gameID] = {
    players: [newPlayer.id],
    boards: [p1Board]
  };

  newPlayer.gameID = gameID;

  socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: []});

  p1Board.playerReset();
  p1Board.update();

}
//ORIGINAL 1VS1
exports.makePlayerAvailableVS = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    board: null,
    gameID: null
  };

  if (availablePlayersVS.length === 0) {
    availablePlayersVS.push(newPlayer);
    // Now that the user has been made available, update the client
    socket.nsp.to(socket.id).emit('updateClient', {status:'wait', player: null, opponent: null});
  } else {
    let opponent = availablePlayersVS.splice(0, 1)[0];

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

    socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: [opponent]});
    socket.nsp.to(opponent.id).emit('updateClient', {status:'pair', player: opponent, opponents: [newPlayer]});
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