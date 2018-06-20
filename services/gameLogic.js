
// ----------------------- GAME LOGIC ------------------------------------- //
/**
 * Clear any lines that can be cleared in the arena specified. For each line
 * cleared, add 10 points to the score of the player.
 *
 */
arenaSweep = (arena, player) => {
  let rowCount = 0;
  outer: for ( let y = arena.length -1; y > 0; --y ) {
    for ( let x = 0; x < arena[y].length; ++x ) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;
    rowCount++;
  }
  //score values are the same as others tetrs
  switch ( rowCount ){
    case 1:
      player.score += 40 * ( player.level + 1 );
      player.rowDest = true;
      break;
    case 2:
      player.score += 100 * ( player.level + 1 );
      player.rowDest = true;
      break;
    case 3:
      player.score += 300 * ( player.level + 1 );
      player.rowDest = true;
      break;
    case 4:
      player.score += 1200 * ( player.level + 1 );
      player.rowDest = true;

      //4 lines in row destroyed mark for gif event
      player.fRowDest = true;
      break;
    default:
  }
  player.lines += rowCount;

  //increase lvl every 5 rows; lvl 19 is maximum
  let aux = Math.floor( Number( player.lines ) / 5 );
  aux <= 19 ? player.level = aux : player.level = 19;
  return rowCount;
}

rotate = (matrix, direction) => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [
        matrix[x][y],
        matrix[y][x],
      ] = [
        matrix[y][x],
        matrix[x][y],
      ];
    }
  }

  if (direction > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

/**
 * Check if there is a collision between the player's piece and
 */
collide = (arena, player) => {
  const [m, o] = [player.matrix, player.pos];

  for (let y=0; y < m.length; y++) {
    for (let x=0;x< m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y+o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
}

createPiece = (type) => {
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0]
    ];
  }

  if (type === 'L') {
    return [
      [0,2,0],
      [0,2,0],
      [0,2,2]
    ]
  }

  if (type === 'J') {
    return [
      [0,3,0],
      [0,3,0],
      [3,3,0]
    ]
  }

  // z
  if (type === 'Z') {
    return [
      [0,4,4],
      [4,4,0],
      [0,0,0]
    ]
  }

  // s
  if (type === 'S') {
    return [
      [5,5,0],
      [0,5,5],
      [0,0,0]
    ]
  }

  if (type === 'I') {
    return [
      [0, 0, 6, 0],
      [0, 0, 6, 0],
      [0, 0, 6, 0],
      [0, 0, 6, 0],
    ]
  }

  if (type === 'O') {
    return [
      [7,7],
      [7,7]
    ]
  }
}
module.exports = {
  arenaSweep,
  rotate,
  collide,
  createPiece
}