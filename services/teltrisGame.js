const hf = require(__dirname+'/../utils/helperFunctions');
const gl = require(__dirname+'/gameLogic');

const games = {};

class TeltrisGame {
  constructor(gameID, playerID, socket, gameOption, numPlayers) {
    this.socket = socket;
    this.gameID = gameID;
    this.playerID = playerID;
    this.gameOption = gameOption;
    this.numPlayers = numPlayers;
    // ------ Game Data ------
    // Board
    this.arena = hf.createMatrix(12, 20);

    // Piece
    this.player = {
      pos: {
        x: 4,
        y: 0
      },
      matrix: null,
      score: 0,
      level: 0,
      lines: 0,
      collision: false,
      rowDest: false,
      fRowDest: false,
      dead: false,
    }
    this.finished = false;
    this.dropCounter = 0;
    this.dropInterval = 1000-(50*this.player.level);
    this.updateInterval = null;
    this.lastTime = 0;
  }


  // ------ Functions ------
  clear() {
    gl.arenaSweep(this.arena, this.player);
    this.dropInterval = 1000-(50*this.player.level);
  }

  emitBoardStatus() {
    for (const currentClient of games[this.gameID].players) {
      this.socket.nsp.to(currentClient).emit('updateBoard', {board: this.arena, player:this.player, playerID: this.playerID});
    }
    this.player.rowDest = false;
    this.player.collision = false;
    this.player.fRowDest = false;
  }

  //If player destroys more than 1 line adds them on his enemy
  createPain(board, rows){
    for (let i=0; i < rows; i++ ){
      const arrAux = [];
      let pos = Math.floor(this.arena[0].length * Math.random());
      for (let j = 0; j < this.arena[0].length; j++ ){
        j===pos ? arrAux.push(0) : arrAux.push(5);
      }
      board.arena.push( arrAux );
      board.arena.shift();
    }
  }

  playerDrop() {
    if (this.player.dead || this.finished) {
      clearInterval(this.updateInterval);
      return null;
    }

    this.player.pos.y++;
    if (gl.collide(this.arena, this.player)) {
      this.player.pos.y--;
      hf.merge(this.arena, this.player);
      if (!this.player.dead) this.playerReset();

      let howmany = gl.arenaSweep(this.arena, this.player);


      for(const board of games[this.gameID].boards) {
        if (howmany > 1 && board.playerID !== this.playerID){
          this.createPain( board, howmany );
        }
      }

      clearInterval(this.updateInterval);
      this.dropInterval = 1000-(50*this.player.level);
      this.update();
      this.player.collision = true;
    }
    this.dropCounter = 0;
    this.emitBoardStatus();
  }

  playerDropToBottom() {
    while (!gl.collide(this.arena, this.player)) {
      this.player.pos.y++;
    }

    this.player.pos.y--;
    hf.merge(this.arena, this.player);
    if (!this.player.dead) this.playerReset();
    let howmany = gl.arenaSweep(this.arena, this.player);

    for(const board of games[this.gameID].boards) {
      if (howmany > 1 && board.playerID !== this.playerID){
        this.createPain( board, howmany );
      }
    }

    clearInterval(this.updateInterval);
    this.dropInterval = 1000-(50*this.player.level);
    this.update();

    this.dropCounter = 0;
    this.player.collision = true;
    this.emitBoardStatus();
  }

  playerReset() {
    const pieces = 'ILJOTSZ';
    this.player.matrix = gl.createPiece(pieces[Math.floor(pieces.length * Math.random())]);
    this.player.pos.y = 0;
    this.player.pos.x = (this.arena[0].length / 2 | 0) - (Math.floor(this.player.matrix[0].length / 2));

    if (gl.collide(this.arena, this.player)) {
      this.player.dead = true;


      this.socket.nsp.to(this.playerID).emit('updateBoard', {board: this.arena, player:this.player, playerID: this.playerID});

      if (this.gameOption === 'solo'){
        const message = {};
        message[this.playerID] = 'GAME OVER';
        this.socket.nsp.to(this.playerID).emit('finishGame', message);

      } else if (this.gameOption === 'VS'){
        const message = {};
        for (const currentPlayer of games[this.gameID].players){
          if (currentPlayer === this.playerID) {
            message[currentPlayer] = 'LOST';
          } else message[currentPlayer] = 'WON'
        }
        for (const currentPlayer of games[this.gameID].players){
          this.socket.nsp.to(currentPlayer).emit('finishGame', message );
        }

      } else {
        let index = games[this.gameID].alive.indexOf(this.playerID);
        games[this.gameID].alive.splice(index,1);

        const message = {};
        if (games[this.gameID].alive.length === 1) {
          this.finished = true;

          for ( const currentPlayer of games[this.gameID].players) {
            if ( currentPlayer === games[this.gameID].alive[0] ) {
              message[currentPlayer]=' WON';
            } else message[currentPlayer]=' LOST';
          }
          for ( const currentPlayer of games[this.gameID].players) {
            this.socket.nsp.to(currentPlayer).emit('finishGame', message );
          }
          for(const board of games[this.gameID].boards){
            clearInterval(board.updateInterval);
            this.finished = true;
          }
        }
      }
      //if finish clear all updates
      if (this.gameOption === 'solo' || this.gameOption === 'VS') {
        for(const board of games[this.gameID].boards){
          clearInterval(board.updateInterval);
          this.finished = true;
        }
      }

    }
  }

  update() {
    this.updateInterval = setInterval(() => {
      this.playerDrop();
      for (const currentClient of games[this.gameID].players) {
        this.socket.nsp.to(currentClient).emit('updateBoard', {board: this.arena, player:this.player, playerID: this.playerID});
      }
    }, this.dropInterval)
  }

  playerMove (direction) {
    this.player.pos.x += direction;

    if(gl.collide(this.arena, this.player)) {
      this.player.pos.x -= direction;
    }
    this.emitBoardStatus();
  }

  playerRotate (dir) {
    gl.rotate(this.player.matrix, dir);
    const pos = this.player.pos.x;
    let offset = 1;

    while (gl.collide(this.arena, this.player)) {
      this.player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1: -1));

      if (offset > this.player.matrix[0].length) {
        gl.rotate(this.player.matrix, -dir);
        this.player.pos.x = pos;
        return;
      }
    }
    this.emitBoardStatus();
  }

}
module.exports = {
  TeltrisGame,
  games
};