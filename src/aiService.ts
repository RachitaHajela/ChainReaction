module aiService {
  /** Returns the move that the computer player should do for the given state in move. */
  export function findComputerMove(move: IMove): IMove {
    return createComputerMove(move);
  }

  /**
   * Returns all the possible moves for the given state and turnIndexBeforeMove.
   * Returns an empty array if the game is over.
   */
  /*
  export function getPossibleMoves(state: IState, turnIndexBeforeMove: number): IMove[] {
    let possibleMoves: IMove[] = [];
    for (let i = 0; i < gameLogic.ROWS; i++) {
      for (let j = 0; j < gameLogic.COLS; j++) {
        try {
          possibleMoves.push(gameLogic.createMove(state, i, j, turnIndexBeforeMove));
        } catch (e) {
          // The cell in that position was full.
        }
      }
    }
    return possibleMoves;
  }
  */
  
  function score(board : Board, row: number, col : number, prevMove : IMove) : number {
      let move : IMove;
      try {
          move = gameLogic.createMove(prevMove.stateAfterMove, row, col, prevMove.turnIndexAfterMove);
      } catch (e) {
          return 25;
      }
      
      let newBoard : Board = move.stateAfterMove.board;
      let opponentCells : number = 0;
      for (let i = 0; i < gameLogic.ROWS; i++) {
          for (let j = 0; j < gameLogic.COLS; j++) {
              if (newBoard[i][j].playerId != -1 && newBoard[i][j].playerId != prevMove.turnIndexAfterMove) {
                  opponentCells++;
              }
          }
      }
      return opponentCells;
  }

  /**
   * Returns the move that the computer player should do for the given state.
   * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
   * and it has either a millisecondsLimit or maxDepth field:
   * millisecondsLimit is a time limit, and maxDepth is a depth limit.
   */
  export function createComputerMove(prevMove: IMove): IMove {
    //TODO : handle empty board
    let currBoard : Board = prevMove.stateAfterMove.board;
    let bestRow : number = -1;
    let bestCol : number = -1;
    let bestScore : number = 25;
    for (let i = 0; i < gameLogic.ROWS; i++) {
        for (let j = 0; j < gameLogic.COLS; j++) {
            let currScore : number = score(currBoard, i, j, prevMove);
            if (currScore < bestScore) {
                bestRow = i;
                bestCol = j;
                bestScore = currScore;
            }
        }
    }
    return gameLogic.createMove(prevMove.stateAfterMove, bestRow, bestCol, prevMove.turnIndexAfterMove);
  }

  /*
  function getStateScoreForIndex0(move: IMove, playerIndex: number): number {
    let endMatchScores = move.endMatchScores;
    if (endMatchScores) {
      return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
          : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
          : 0;
    }
    return 0;
  }

  function getNextStates(move: IMove, playerIndex: number): IMove[] {
    return getPossibleMoves(move.stateAfterMove, playerIndex);
  }
  */
}
