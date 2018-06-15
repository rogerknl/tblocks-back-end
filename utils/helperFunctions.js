
//check if its  used
module.exports.boardToDraw = (arena, player) => {
  const newBoard = arena.slice(0);
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value !== 0) {
        newBoard[y + player.pos.y][x + player.pos.x] = value;
      }
    })
  })
  return newBoard;
}

module.exports.createMatrix = (width, height) => {
  const matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

module.exports.merge = (arena, player) => {
  try {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if(value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
        }
      })
    })
  } catch (error) {
    //
  }
}