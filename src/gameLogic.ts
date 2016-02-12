interface Cell {
    row: number;
    col: number;
}


interface CellState {
    playerId: number;
    numMolecules: number;
}

interface Explosion {
    cellsExploded: Cell[];
    boardAfterExplosions: Board;
}

type Board = CellState[][]
interface BoardDelta {
  //row: number;
  //col: number;
  currMoveCell: Cell;
  explosions: Explosion[];
}
interface IState {
  board: Board;
  delta: BoardDelta;
}

module gameLogic {
  export const ROWS = 6;
  export const COLS = 4;

  /** Returns the initial TicTacToe board, which is a ROWSxCOLS matrix containing ''. */
  function getInitialBoard(): Board {
    let board: Board = [];
    for (let i = 0; i < ROWS; i++) {
      board[i] = [];
      for (let j = 0; j < COLS; j++) {
        board[i][j].playerId = -1;
        board[i][j].numMolecules = 0
      }
    }
    return board;
  }

  export function getInitialState(): IState {
    return {board: getInitialBoard(), delta: null};
  }

  /**
   * Returns true if the game ended in a tie because there are no empty cells.
   * E.g., isTie returns true for the following board:
   *     [['X', 'O', 'X'],
   *      ['X', 'O', 'O'],
   *      ['O', 'X', 'X']]
   */
  function isTie(board: Board): boolean {
    // for (let i = 0; i < ROWS; i++) {
    //   for (let j = 0; j < COLS; j++) {
    //     if (board[i][j] === '') {
    //       // If there is an empty cell then we do not have a tie.
    //       return false;
    //     }
    //   }
    // }
    // No empty cells, so we have a tie!
    return false;
  }

  /**
   * Return the winner (either 'X' or 'O') or '' if there is no winner.
   * The board is a matrix of size 3x3 containing either 'X', 'O', or ''.
   * E.g., getWinner returns 'X' for the following board:
   *     [['X', 'O', ''],
   *      ['X', 'O', ''],
   *      ['X', '', '']]
   */
  function getWinner(board: Board): string {
      if (playerWon(0, board)) {
          return '0';
      } else if (playerWon(1, board)) {
          return '1';
      } else {
          return '';
      }
  }
  
  /**
   * Returns if the particular player has won or not
   */
function playerWon(playerId: number, board: Board): boolean {
     for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        let cell = board[i][j];
        if (cell.playerId !== playerId) {
            return false;
        }     
      }
    }
    return true;
} 
  /**
   * Returns the move that should be performed when player
   * with index turnIndexBeforeMove makes a move in cell row X col.
   */
  export function createMove(
      stateBeforeMove: IState, row: number, col: number, turnIndexBeforeMove: number): IMove {
    if (!stateBeforeMove) { // stateBeforeMove is null in a new match.
      stateBeforeMove = getInitialState();
    }
    let board: Board = stateBeforeMove.board;
    if (board[row][col].playerId !== turnIndexBeforeMove && board[row][col].playerId !== -1) {
      throw new Error("One can only make a move in an empty position or its own color!");
    }
    if (getWinner(board) !== '' || isTie(board)) {
        throw new Error("Can only make a move if the game is not over!");
    }
    let boardAfterMove = angular.copy(board);
    //change number of molecules in cell
    boardAfterMove[row][col].playerId = turnIndexBeforeMove;
    boardAfterMove[row][col].numMolecules++;
    let stateAfterMove: IState = updateBoard(row,col,boardAfterMove,turnIndexBeforeMove);
    let winner = getWinner(boardAfterMove);
    let endMatchScores: number[];
    let turnIndexAfterMove: number;
    if (winner !== '' || isTie(boardAfterMove)) {
      // Game over.
      turnIndexAfterMove = -1;
      endMatchScores = winner === 'X' ? [1, 0] : winner === 'O' ? [0, 1] : [0, 0];
    } else {
      // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
      turnIndexAfterMove = 1 - turnIndexBeforeMove;
      endMatchScores = null;
    }
  //  let delta: BoardDelta = {row: row, col: col};
   // let stateAfterMove: IState = {delta: delta, board: boardAfterMove};
    return {endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove};
  }
  
  function maxMolecules(row: number, col: number): number {
      let maxMol: number = 4;
      if (row == 0 || row == ROWS-1) {
          maxMol--;
      }
      if (col == 0 || col == COLS-1) {
          maxMol--;
      }
      return maxMol;
  }
  
  function updateBoard(row: number,col: number, board: Board, playerId: number): IState {
      let currMoveCell: Cell = {row: row, col: col};
      let explosions: Explosion[] = [];
      if(board[row][col].numMolecules !== maxMolecules(row, col)) {
          
          let delta: BoardDelta = {currMoveCell: currMoveCell,explosions: explosions};
          let stateAfterMove: IState = {delta: delta, board: board};
          return stateAfterMove;
      } 
      let explosionQueueCurr: Cell[] = [currMoveCell];
      let explosionQueueNext: Cell[] = [];
      let explosion: Explosion = {cellsExploded : [], boardAfterExplosions : board};
      //let explosion: Explosion;
      //explosion.boardAfterExplosions = board
      while (explosionQueueCurr.length > 0) {
          //boardchange and add in delta
          let currCell: Cell = angular.copy(explosionQueueCurr[0]);
          explosionQueueCurr.splice(0, 1);
          
          board[currCell.row][currCell.col].playerId = -1;
          board[currCell.row][currCell.col].numMolecules = 0;
          
          try {
            board[currCell.row-1][currCell.col].playerId = playerId;
            board[currCell.row-1][currCell.col].numMolecules++;
            if (board[currCell.row-1][currCell.col].numMolecules === maxMolecules(row-1, col)) {
                let newCell : Cell = {row: row-1, col : col};
                explosionQueueNext.push(newCell);
            }
          } catch (err) {
              
          }
          try {
            board[currCell.row+1][currCell.col].playerId = playerId;
            board[currCell.row+1][currCell.col].numMolecules++;
            if (board[currCell.row+1][currCell.col].numMolecules === maxMolecules(row+1, col)) {
                let newCell : Cell = {row: row+1, col : col};
                explosionQueueNext.push(newCell);
            }
          } catch (err) {
              
          }
          try {
            board[currCell.row][currCell.col-1].playerId = playerId;
            board[currCell.row][currCell.col-1].numMolecules++;
            if (board[currCell.row][currCell.col-1].numMolecules === maxMolecules(row, col-1)) {
                let newCell : Cell = {row: row, col : col-1};
                explosionQueueNext.push(newCell);
            }
          } catch (err) {
              
          }
          try {
            board[currCell.row][currCell.col+1].playerId = playerId;
            board[currCell.row][currCell.col+1].numMolecules++;
            if (board[currCell.row][currCell.col+1].numMolecules === maxMolecules(row, col+1)) {
                let newCell : Cell = {row: row, col : col+1};
                explosionQueueNext.push(newCell);
            }
          } catch (err) {
              
          }
          
          explosion.cellsExploded.push(currCell);
          explosion.boardAfterExplosions = angular.copy(board);

          //check for winner
          if (playerWon(playerId, board)) {
            explosions.push(explosion);
            let delta: BoardDelta = {currMoveCell: currMoveCell, explosions: explosions};
            let stateAfterMove: IState = {delta: delta, board: board};
            return stateAfterMove;
          }
          
          //check for more explosions
          //board[row]
          
          if (explosionQueueCurr.length == 0) {
              explosionQueueCurr = angular.copy(explosionQueueNext);
              explosionQueueNext = [];
              explosions.push(explosion);
              explosion.cellsExploded = [];
              explosion.boardAfterExplosions = angular.copy(board);
          }
      } 
    //  explosions.push(explosion);
      let delta: BoardDelta = {currMoveCell: currMoveCell, explosions: explosions};
      let stateAfterMove: IState = {delta: delta, board: board};
      return stateAfterMove;
      
  }
  export function checkMoveOk(stateTransition: IStateTransition): void {
    // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
    // to verify that the move is OK.
    let turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
    let stateBeforeMove: IState = stateTransition.stateBeforeMove;
    let move: IMove = stateTransition.move;
    let deltaValue: BoardDelta = stateTransition.move.stateAfterMove.delta;
    let row = deltaValue.currMoveCell.row;
    let col = deltaValue.currMoveCell.col;
    let expectedMove = createMove(stateBeforeMove, row, col, turnIndexBeforeMove);
    if (!angular.equals(move, expectedMove)) {
      throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
          ", but got stateTransition=" + angular.toJson(stateTransition, true))
    }
  }

  export function forSimpleTestHtml() {
    var move = gameLogic.createMove(null, 0, 0, 0);
    log.log("move=", move);
    var params: IStateTransition = {
      turnIndexBeforeMove: 0,
      stateBeforeMove: null,
      move: move,
      numberOfPlayers: 2};
    gameLogic.checkMoveOk(params);
  }
}