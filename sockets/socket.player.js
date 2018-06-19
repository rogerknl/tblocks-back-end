
// add to wins


// add to losses


exports.signup
exports.signin
exports.signout = socket => {
  // If the user which disconnected was in the list of available players,
  // remove it from there
  searchAndRemoveDiscFromArr(availablePlayersVS, socket);
  searchAndRemoveDiscFromArr(availablePlayersFFA, socket);

  allPlayers.splice(allPlayers.indexOf(socket.id), 1);
  playerCount = allPlayers.length;

  for (const currentPlayer of allPlayers) {
    socket.nsp.to(currentPlayer).emit('players online', playerCount);
  }

}
exports.recordWin
exports.recordloss
