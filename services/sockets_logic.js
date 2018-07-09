const hf = require(__dirname + '/../utils/helperFunctions');
const TeltrisGame = require(__dirname + '/teltrisGame');

const uuid = require('uuid');


const allPlayers = [];
const availablePlayersVS = [];
const availablePlayersFFA = [];
let playerCount = 0;


// module.exports.allPlayers = allPlayers;

//We create Socket listener there
module.exports.socketHandler = (io) => {
  io.on('connection', (socket) => {
    allPlayers.push(socket.id);
    console.log("socket establshed", socket.id);

    //When game option is sended, here is the call to correct funct
    socket.on('makePlayerAvailable', (name,option) => {
      switch (option){
        case '1':
          makePlayerSolo(socket, name);
          break;
        case '2':
          makePlayerAvailableVS(socket, name);
          break;
        case '3':
          makePlayerAvailableFFA(socket, name);
          break;
        default:
      }
    });

    //Listener used for all piece movements
    socket.on('keyPressed', (data) => {
      keyPressed(data);
    });

    //on diconnect socket
    socket.on('disconnect', () => {
      console.log("socket removed")
      disconnect(socket)
    });
  });
};

//auxiliar function for Disconnect
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

const disconnect = (socket) => {
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


//Here is managed movement instructions
const keyPressed = (data) => {
  const gameID = data.player.gameID;
  const userID = data.player.id;

  //if the game is finished we avoid the movement (should't be necessary/client hackt)
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

//FFA mode
makePlayerAvailableFFA = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    gameID: null
  };

  //Wait for 3 players in this mode
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
    const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket, 'FFA', 3);
    const p2Board = new TeltrisGame.TeltrisGame(gameID, opponent1.id, socket, 'FFA', 3);
    const p3Board = new TeltrisGame.TeltrisGame(gameID, opponent2.id, socket, 'FFA', 3);

    TeltrisGame.games[gameID] = {
      players: [newPlayer.id, opponent1.id, opponent2.id],
      boards: [p1Board, p2Board, p3Board],
      alive: [newPlayer.id, opponent1.id, opponent2.id],
    };

    newPlayer.gameID = gameID;
    opponent1.gameID = gameID;
    opponent2.gameID = gameID;

    // Information of players to client
    socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: [opponent1,opponent2]});
    socket.nsp.to(opponent1.id).emit('updateClient', {status:'pair', player: opponent1, opponents: [newPlayer,opponent2], });
    socket.nsp.to(opponent2.id).emit('updateClient', {status:'pair', player: opponent2, opponents: [newPlayer,opponent1], });

    //game starts here
    p1Board.playerReset();
    p1Board.update();
    p2Board.playerReset();
    p2Board.update();
    p3Board.playerReset();
    p3Board.update();
  }
}
//Solo mode
const makePlayerSolo = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    gameID: null
  };

  // Create Game in the server:
  const gameID = uuid();

  // Create a match
  const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket, 'solo', 1);

  TeltrisGame.games[gameID] = {
    players: [newPlayer.id],
    boards: [p1Board]
  };

  newPlayer.gameID = gameID;

  //Information of players to client
  socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: []});

  //game starts here
  p1Board.playerReset();
  p1Board.update();

}
//ORIGINAL 1VS1
makePlayerAvailableVS = (socket, name) => {
  const newPlayer = {
    id: socket.id,
    name: name,
    gameID: null
  };

  //Wait for 2 players in this mode
  if (availablePlayersVS.length === 0) {
    availablePlayersVS.push(newPlayer);
    // Now that the user has been made available, update the client
    socket.nsp.to(socket.id).emit('updateClient', {status:'wait', player: null, opponent: null});
  } else {
    let opponent = availablePlayersVS.splice(0, 1)[0];

    // Create Game in the server:
    const gameID = uuid();

    // Create a match
    const p1Board = new TeltrisGame.TeltrisGame(gameID, newPlayer.id, socket, 'VS', 2);
    const p2Board = new TeltrisGame.TeltrisGame(gameID, opponent.id, socket, 'VS', 2);

    TeltrisGame.games[gameID] = {
      players: [newPlayer.id, opponent.id],
      boards: [p1Board, p2Board]
    };

    newPlayer.gameID = gameID;
    opponent.gameID = gameID;

    //Information of players to client
    socket.nsp.to(socket.id).emit('updateClient', {status:'pair', player: newPlayer, opponents: [opponent]});
    socket.nsp.to(opponent.id).emit('updateClient', {status:'pair', player: opponent, opponents: [newPlayer]});

    //game starts here
    p1Board.playerReset();
    p1Board.update();
    p2Board.playerReset();
    p2Board.update();
  }
}