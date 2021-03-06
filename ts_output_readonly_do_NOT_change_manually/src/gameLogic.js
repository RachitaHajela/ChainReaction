var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 9;
    gameLogic.COLS = 6;
    /** Returns the initial TicTacToe board, which is a ROWSxCOLS matrix containing ''. */
    function getInitialBoard() {
        var board = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            board[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                board[i][j] = { playerId: -1, numMolecules: 0 };
            }
        }
        return board;
    }
    function getInitialState() {
        return { board: getInitialBoard(), delta: null };
    }
    gameLogic.getInitialState = getInitialState;
    /**
     * Returns true if the game ended in a tie because there are no empty cells.
     * E.g., isTie returns true for the following board:
     *     [['X', 'O', 'X'],
     *      ['X', 'O', 'O'],
     *      ['O', 'X', 'X']]
     */
    function isTie(board) {
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
    function getWinner(board) {
        if (playerWon(0, board)) {
            return '0';
        }
        else if (playerWon(1, board)) {
            return '1';
        }
        else {
            return '';
        }
    }
    /**
     * Returns if the particular player has won or not
     */
    function playerWon(playerId, board) {
        var numMolecules = 0;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                var cell = board[i][j];
                numMolecules += cell.numMolecules;
                if (cell.numMolecules !== 0 && cell.playerId !== playerId) {
                    return false;
                }
            }
        }
        if (numMolecules < 2) {
            return false;
        }
        return true;
    }
    /**
     * Returns the move that should be performed when player
     * with index turnIndexBeforeMove makes a move in cell row X col.
     */
    function createMove(stateBeforeMove, row, col, turnIndexBeforeMove) {
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var board = stateBeforeMove.board;
        if (board[row][col].playerId !== turnIndexBeforeMove && board[row][col].playerId !== -1) {
            throw new Error("One can only make a move in an empty position or its own color!");
        }
        if (getWinner(board) !== '' || isTie(board)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        var boardAfterMove = angular.copy(board);
        //change number of molecules in cell
        boardAfterMove[row][col].playerId = turnIndexBeforeMove;
        boardAfterMove[row][col].numMolecules++;
        var stateAfterMove = updateBoard(row, col, boardAfterMove, turnIndexBeforeMove);
        //log.log(stateAfterMove.delta.currMoveCell);
        //log.log(stateAfterMove.delta.explosions[0]);
        var winner = getWinner(boardAfterMove);
        var endMatchScores;
        var turnIndexAfterMove;
        if (winner !== '' || isTie(boardAfterMove)) {
            // Game over.
            turnIndexAfterMove = -1;
            endMatchScores = winner === '0' ? [1, 0] : winner === '1' ? [0, 1] : [0, 0];
        }
        else {
            // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
            turnIndexAfterMove = 1 - turnIndexBeforeMove;
            endMatchScores = null;
        }
        return { endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    function maxMolecules(row, col) {
        var maxMol = 4;
        if (row == 0 || row == gameLogic.ROWS - 1) {
            maxMol--;
        }
        if (col == 0 || col == gameLogic.COLS - 1) {
            maxMol--;
        }
        return maxMol;
    }
    function updateBoard(row, col, board, playerId) {
        //TODO : handle case when no. of mol > 4
        //TODO : update logic to show 4 molecules when game is over
        var currMoveCell = { row: row, col: col };
        var explosions = [];
        var initialState = { cellsExploded: [], boardAfterExplosions: angular.copy(board) };
        explosions.push(initialState);
        if (board[row][col].numMolecules < maxMolecules(row, col)) {
            //log.log("no explosion -- if");
            var delta_1 = { currMoveCell: currMoveCell, explosions: explosions };
            var stateAfterMove_1 = { delta: delta_1, board: board };
            return stateAfterMove_1;
        }
        var explosionQueueCurr = [currMoveCell];
        var explosionQueueNext = [];
        var explosion = { cellsExploded: [], boardAfterExplosions: board };
        while (explosionQueueCurr.length > 0) {
            //log.log("while");
            //boardchange and add in delta
            var currCell = angular.copy(explosionQueueCurr[0]);
            explosionQueueCurr.splice(0, 1);
            /*
            log.log("Curr cell ")
            log.log(currCell.row)
            log.log(currCell.col)
            
            log.log("Curr cell initial : molecules, playerId")
            log.log(board[currCell.row][currCell.col].numMolecules)
            log.log(board[currCell.row][currCell.col].playerId)
            */
            board[currCell.row][currCell.col].numMolecules = board[currCell.row][currCell.col].numMolecules - maxMolecules(currCell.row, currCell.col);
            if (board[currCell.row][currCell.col].numMolecules === 0) {
                board[currCell.row][currCell.col].playerId = -1;
            }
            /*
            log.log("Curr cell final : molecules, playerId")
            log.log(board[currCell.row][currCell.col].numMolecules)
            log.log(board[currCell.row][currCell.col].playerId)
            */
            try {
                board[currCell.row - 1][currCell.col].playerId = playerId;
                board[currCell.row - 1][currCell.col].numMolecules++;
                if (board[currCell.row - 1][currCell.col].numMolecules === maxMolecules(currCell.row - 1, currCell.col)) {
                    var newCell = { row: currCell.row - 1, col: currCell.col };
                    explosionQueueNext.push(newCell);
                }
            }
            catch (err) {
            }
            try {
                board[currCell.row + 1][currCell.col].playerId = playerId;
                board[currCell.row + 1][currCell.col].numMolecules++;
                if (board[currCell.row + 1][currCell.col].numMolecules === maxMolecules(currCell.row + 1, currCell.col)) {
                    var newCell = { row: currCell.row + 1, col: currCell.col };
                    explosionQueueNext.push(newCell);
                }
            }
            catch (err) {
            }
            try {
                board[currCell.row][currCell.col - 1].playerId = playerId;
                board[currCell.row][currCell.col - 1].numMolecules++;
                if (board[currCell.row][currCell.col - 1].numMolecules === maxMolecules(currCell.row, currCell.col - 1)) {
                    var newCell = { row: currCell.row, col: currCell.col - 1 };
                    explosionQueueNext.push(newCell);
                }
            }
            catch (err) {
            }
            try {
                board[currCell.row][currCell.col + 1].playerId = playerId;
                board[currCell.row][currCell.col + 1].numMolecules++;
                if (board[currCell.row][currCell.col + 1].numMolecules === maxMolecules(currCell.row, currCell.col + 1)) {
                    var newCell = { row: currCell.row, col: currCell.col + 1 };
                    explosionQueueNext.push(newCell);
                }
            }
            catch (err) {
            }
            explosion.cellsExploded.push(currCell);
            //log.log("Cells exploded")
            //log.log(explosion.cellsExploded)
            explosion.boardAfterExplosions = angular.copy(board);
            //check for winner
            if (playerWon(playerId, board)) {
                explosions.push(explosion);
                var delta_2 = { currMoveCell: currMoveCell, explosions: explosions };
                var stateAfterMove_2 = { delta: delta_2, board: board };
                return stateAfterMove_2;
            }
            //check for more explosions
            //board[row]
            if (explosionQueueCurr.length == 0) {
                //log.log("length = 0")
                explosionQueueCurr = angular.copy(explosionQueueNext);
                explosionQueueNext = [];
                explosions.push(angular.copy(explosion));
                //log.log(explosions[0].cellsExploded[0])
                explosion.cellsExploded = [];
                explosion.boardAfterExplosions = angular.copy(board);
            }
        }
        //  explosions.push(explosion);
        //log.log("expl0 cells exploded")
        //log.log(explosions[0].cellsExploded[0])
        var delta = { currMoveCell: currMoveCell, explosions: explosions };
        //log.log("delta")
        //log.log(delta)
        //log.log(delta.explosions[0].cellsExploded[0])
        var stateAfterMove = { delta: delta, board: board };
        return stateAfterMove;
    }
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        var move = stateTransition.move;
        var deltaValue = stateTransition.move.stateAfterMove.delta;
        var row = deltaValue.currMoveCell.row;
        var col = deltaValue.currMoveCell.col;
        var expectedMove = createMove(stateBeforeMove, row, col, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
                ", but got stateTransition=" + angular.toJson(stateTransition, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
    function forSimpleTestHtml() {
        var move = gameLogic.createMove(null, 0, 0, 0);
        //log.log("move=", move);
        var params = {
            turnIndexBeforeMove: 0,
            stateBeforeMove: null,
            move: move,
            numberOfPlayers: 2 };
        gameLogic.checkMoveOk(params);
    }
    gameLogic.forSimpleTestHtml = forSimpleTestHtml;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map