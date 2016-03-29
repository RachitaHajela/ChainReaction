describe("aiService", function() {
  function createStateFromBoard(board: Board): IState {
    return {board: board, delta: null};
  }

  let ROWS = 6;
  let COLS = 4;

  function createBoard(boardRepr : number[][]): Board {
    let board: Board = [];
    for (let i = 0; i < ROWS; i++) {
      board[i] = [];
      for (let j = 0; j < COLS; j++) {
        if (boardRepr[i][j] == 0) {
            board[i][j] = {playerId: -1, numMolecules: 0};
        } else if (boardRepr[i][j] > 0) {
            board[i][j] = {playerId: 0, numMolecules: boardRepr[i][j]};
        } else {
            board[i][j] = {playerId: 1, numMolecules: -boardRepr[i][j]};
        }
      }
    }
    return board;
  } 

  function createComputerMove(board: Board, turnIndex: number, maxDepth: number): IMove {
    let move: IMove = {
      turnIndexAfterMove: turnIndex,
      endMatchScores: null,
      stateAfterMove: createStateFromBoard(board),
    };
    return aiService.createComputerMove(move);
  }

  it("only one piece in board", function() {
    let board : Board = createBoard([
          [0, 0, 0, 0], 
          [0, 0, 0, 0], 
          [0, 0, 0, 0], 
          [0, 0, 0, 0], 
          [0, 0, 0, 0], 
          [0, 0, 0, 0]]);
    let stateBeforeMove : IState = {board : board, delta : null};
    let firstMove = gameLogic.createMove(stateBeforeMove, 3, 3, 0);
    let computerMove : IMove = aiService.createComputerMove(firstMove);
    expect(computerMove.stateAfterMove.board[0][0].numMolecules === 1 && computerMove.stateAfterMove.board[0][0].playerId === 1).toBe(true);      
  }); 

  it("only one optimal move", function() {
    let board : Board = createBoard([
          [0, 0, 0, 0], 
          [0, 3, 1, 0], 
          [0, 0, 0, 0], 
          [0, 0, 0, 0], 
          [0, -1, -1, 0], 
          [0, -1, 0, 0]]);
    let stateBeforeMove : IState = {board : board, delta : null};
    let lastMove = gameLogic.createMove(stateBeforeMove, 2, 1, 1);
    let computerMove : IMove = aiService.createComputerMove(lastMove);
    expect(computerMove.stateAfterMove.board[1][1].numMolecules === 0 && computerMove.stateAfterMove.board[1][1].playerId === -1).toBe(true);      
  }); 

  it("only one optimal move", function() {
    let board : Board = createBoard([
          [0, 0, 0, 0], 
          [0, 3, 1, 0], 
          [0, -1, 0, -2], 
          [0, 3, 0, 0], 
          [0, -1, -1, 0], 
          [0, -1, 0, 0]]);
    let stateBeforeMove : IState = {board : board, delta : null};
    let lastMove = gameLogic.createMove(stateBeforeMove, 1, 3, 1);
    let computerMove : IMove = aiService.createComputerMove(lastMove);
    expect(computerMove.stateAfterMove.board[3][1].numMolecules === 0 && computerMove.stateAfterMove.board[3][1].playerId === -1).toBe(true);      
  }); 

  /*
  it("getPossibleMoves returns exactly one cell", function() {
    let board =
        [['O', 'O', 'X'],
         ['X', 'X', 'O'],
         ['O', 'X', '']];
    let possibleMoves = aiService.getPossibleMoves(createStateFromBoard(board), 0);
    expect(possibleMoves.length).toBe(1);
    expect(angular.equals(possibleMoves[0].stateAfterMove.delta, {row: 2, col: 2})).toBe(true);
  });

  it("X finds an immediate winning move", function() {
    let move = createComputerMove(
        [['', '', 'O'],
         ['O', 'X', 'X'],
         ['O', 'X', 'O']], 0, 1);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 1})).toBe(true);
  });

  it("X finds an immediate winning move in less than a second", function() {
    let move = aiService.findComputerMove({
      endMatchScores: null,
      turnIndexAfterMove: 0,
      stateAfterMove: {
        board: [['', '', 'O'],
                ['O', 'X', 'X'],
                ['O', 'X', 'O']],
        delta: null
      }
    });
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 1})).toBe(true);
  });

  it("O finds an immediate winning move", function() {
    let move = createComputerMove(
        [['', '', 'O'],
         ['O', 'X', 'X'],
         ['O', 'X', 'O']], 1, 1);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 0})).toBe(true);
  });

  it("X prevents an immediate win", function() {
    let move = createComputerMove(
        [['X', '', ''],
         ['O', 'O', ''],
         ['X', '', '']], 0, 2);
    expect(angular.equals(move.stateAfterMove.delta, {row: 1, col: 2})).toBe(true);
  });

  it("O prevents an immediate win", function() {
    let move = createComputerMove(
        [['X', 'X', ''],
         ['O', '', ''],
         ['', '', '']], 1, 2);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 2})).toBe(true);
  });

  it("O prevents another immediate win", function() {
    let move = createComputerMove(
        [['X', 'O', ''],
         ['X', 'O', ''],
         ['', 'X', '']], 1, 2);
    expect(angular.equals(move.stateAfterMove.delta, {row: 2, col: 0})).toBe(true);
  });

  it("X finds a winning move that will lead to winning in 2 steps", function() {
    let move = createComputerMove(
        [['X', '', ''],
         ['O', 'X', ''],
         ['', '', 'O']], 0, 3);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 1})).toBe(true);
  });

  it("O finds a winning move that will lead to winning in 2 steps", function() {
    let move = createComputerMove(
        [['', 'X', ''],
         ['X', 'X', 'O'],
         ['', 'O', '']], 1, 3);
    expect(angular.equals(move.stateAfterMove.delta, {row: 2, col: 2})).toBe(true);
  });

  it("O finds a cool winning move that will lead to winning in 2 steps", function() {
    let move = createComputerMove(
        [['X', 'O', 'X'],
         ['X', '', ''],
         ['O', '', '']], 1, 3);
    expect(angular.equals(move.stateAfterMove.delta, {row: 2, col: 1})).toBe(true);
  });

  it("O finds the wrong move due to small depth", function() {
    let move = createComputerMove(
        [['X', '', ''],
         ['', '', ''],
         ['', '', '']], 1, 3);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 1})).toBe(true);
  });

  it("O finds the correct move when depth is big enough", function() {
    let move = createComputerMove(
        [['X', '', ''],
         ['', '', ''],
         ['', '', '']], 1, 6);
    expect(angular.equals(move.stateAfterMove.delta, {row: 1, col: 1})).toBe(true);
  });

  it("X finds a winning move that will lead to winning in 2 steps", function() {
    let move = createComputerMove(
        [['', '', ''],
         ['O', 'X', ''],
         ['', '', '']], 0, 5);
    expect(angular.equals(move.stateAfterMove.delta, {row: 0, col: 0})).toBe(true);
  });
  */
  
});
