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
;
;
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null;
    game.state = null;
    game.isHelpModalShown = false;
    game.ROWS = 9;
    game.COLS = 6;
    function init() {
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        log.log("Translation of 'RULES_OF_CHAINREACTION' is " + translate('RULES_OF_CHAINREACTION'));
        resizeGameAreaService.setWidthToHeight(0.67);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI
        });
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        document.addEventListener("animationend", animationEndedCallback, false); // standard
        document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
    }
    game.init = init;
    function getTranslations() {
        return {
            RULES_OF_CHAINREACTION: {
                en: "Rules of Chain Reaction",
                fr: "Règles de Chain Reaction",
            },
            RULES_CHAIN_REACTION_SLIDE1: {
                en: "The objective of Chain Reaction is to take control of the board by eliminating your opponent's atoms.",
                fr: "L'objectif de Chain Reaction est de prendre le contrôle de tout le plateau en éliminant les orbes de tes adversaires.",
            },
            RULES_CHAIN_REACTION_SLIDE2: {
                en: "Players take turns to place their atoms in a cell. Tap to place an atom in an empty cell or in a cell with same colored atoms.",
                fr: "Les joueurs jouent tour à tour pour placer leurs orbes dans une case. Appuie pour placer un atome dans une case vide ou avec des atomes de même couleur.",
            },
            RULES_CHAIN_REACTION_SLIDE3: {
                en: "Once a cell has reached its threshold, the atoms explode into the surrounding cells adding an extra atom and claiming the cell for the player.",
                fr: "Dès qu'une case atteint sa masse critique, les orbes explosent dans les cases voisines en ajoutant une orbe et en donnant cette case au joueur.",
            },
            RULES_CHAIN_REACTION_SLIDE4: {
                en: "As soon as a player loses all their atoms, they are out of the game.",
                fr: "Sitôt qu'un joueur perd toutes ses orbes, ils sont exclus du jeu.",
            },
            CLOSE: {
                en: "Close",
                fr: "Fermer",
            },
        };
    }
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            game.animationEnded = true;
            //sendComputerMove();
        });
    }
    function sendComputerMove() {
        log.info('sendComputerMove', game.isComputerTurn);
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    game.round = 0;
    var intervalFuture = null;
    var maxRound = 10;
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
            maxRound = 1;
        }
        else {
            maxRound = game.state.delta.explosions.length + 1;
        }
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        log.info('updateUI', game.isComputerTurn);
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            log.info('updateUI - state info: ', game.state.delta);
        }
        /*
        if (intervalFuture) {
            $interval.cancel(intervalFuture);
        }
        round = 0;
        intervalFuture = $interval(() => {
            round++;
            if (round == maxRound) {
                $interval.cancel(intervalFuture);
            }
        }, 300);
        */
        game.round = 0;
        intervalFuture = $interval(performNextAnimation, 300);
    }
    function clearAnimationInterval() {
        log.info('clearAnimationInterval');
        if (intervalFuture) {
            $interval.cancel(intervalFuture);
            intervalFuture = null;
        }
    }
    function performNextAnimation() {
        if (game.round > maxRound)
            return;
        log.info('round before: ', game.round);
        game.round++;
        log.info('round after: ', game.round);
        log.info('maxRound : ', maxRound);
        if (game.round > maxRound) {
            clearAnimationInterval();
            if (game.isComputerTurn) {
                sendComputerMove();
            }
        }
    }
    function cellClicked(row, col) {
        log.info("Clicked on cell:", row, col);
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!game.canMakeMove) {
            return;
        }
        try {
            var nextMove = gameLogic.createMove(game.state, row, col, game.move.turnIndexAfterMove);
            game.canMakeMove = false; // to prevent making another move
            moveService.makeMove(nextMove);
        }
        catch (e) {
            log.info(["Cell is already full in position:", row, col]);
            return;
        }
    }
    game.cellClicked = cellClicked;
    function shouldShowImage(row, col, round) {
        //let cell = state.board[row][col];
        //return cell.playerId !== -1;
        try {
            // log.info("shouldShowImage : round ", round, "row", row, "col", col, "try")
            return game.state.delta.explosions[round].boardAfterExplosions[row][col].playerId !== -1;
        }
        catch (e) {
            //  log.info("shouldShowImage : round ", round, "row", row, "col", col, "catch")
            var cell = game.state.board[row][col];
            return cell.playerId !== -1;
        }
        //return contains(cells, row, col);
    }
    game.shouldShowImage = shouldShowImage;
    function containsMolOfPlayer(row, col, round, playerId, numMol) {
        try {
            var currCell = game.state.delta.explosions[round].boardAfterExplosions[row][col];
            return currCell.playerId === playerId && currCell.numMolecules === numMol;
        }
        catch (e) {
            return game.state.board[row][col].playerId === playerId && game.state.board[row][col].numMolecules == numMol;
        }
    }
    game.containsMolOfPlayer = containsMolOfPlayer;
    function maxMolecules(row, col) {
        var maxMol = 4;
        if (row == 0 || row == game.ROWS - 1) {
            maxMol--;
        }
        if (col == 0 || col == game.COLS - 1) {
            maxMol--;
        }
        return maxMol;
    }
    game.maxMolecules = maxMolecules;
    /*
    export function isPieceX(row: number, col: number): boolean {
      return state.board[row][col] === 'X';
    }
  
    export function isPieceO(row: number, col: number): boolean {
      return state.board[row][col] === 'O';
    }
    */
    function shouldSlowlyAppear(row, col, round) {
        /*
        return !animationEnded &&
            state.delta &&
            state.delta.row === row && state.delta.col === col;
        */
        return true;
    }
    game.shouldSlowlyAppear = shouldSlowlyAppear;
    function contains(cells, row, col) {
        //log.info("shouldAnimate -- contains")
        for (var i = 0; i < cells.length; i++) {
            if (cells[i].row === row && cells[i].col === col) {
                //log.info("shouldAnimate")
                //log.info("true")
                return true;
            }
        }
        //log.info("false")
        return false;
    }
    function shouldAnimate(row, col, round) {
        //log.info("shouldAnimate -- row , col , round and  explosions length:", row, col, round, state.delta.explosions.length);
        /*
        if (round >= state.delta.explosions.length) {
            log.info("shouldAnimate -- if")
            log.info("false")
            return false;
        }
        log.info("shouldAnimate -- outside if")
        return !animationEnded && contains(state.delta.explosions[round].cellsExploded, row, col);
        */
        try {
            return !game.animationEnded && contains(game.state.delta.explosions[round + 1].cellsExploded, row, col);
        }
        catch (e) {
            return false;
        }
    }
    game.shouldAnimate = shouldAnimate;
    function shouldAnimateForPlayer(row, col, round, playerId) {
        try {
            return !game.animationEnded && contains(game.state.delta.explosions[round + 1].cellsExploded, row, col) &&
                (game.state.delta.explosions[round].boardAfterExplosions[row][col].playerId === playerId);
        }
        catch (e) {
            return false;
        }
    }
    game.shouldAnimateForPlayer = shouldAnimateForPlayer;
    function moleculesMoreThanMaxMolecules(row, col, round, playerId) {
        try {
            return game.state.delta.explosions[round + 1].boardAfterExplosions[row][col].numMolecules > 0
                && (game.state.delta.explosions[round].boardAfterExplosions[row][col].playerId === playerId);
        }
        catch (e) {
            return false;
        }
    }
    game.moleculesMoreThanMaxMolecules = moleculesMoreThanMaxMolecules;
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map
;
var aiService;
(function (aiService) {
    /** Returns the move that the computer player should do for the given state in move. */
    function findComputerMove(move) {
        return createComputerMove(move);
    }
    aiService.findComputerMove = findComputerMove;
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
    function score(board, row, col, prevMove) {
        var move;
        try {
            move = gameLogic.createMove(prevMove.stateAfterMove, row, col, prevMove.turnIndexAfterMove);
        }
        catch (e) {
            return 25;
        }
        var newBoard = move.stateAfterMove.board;
        var opponentCells = 0;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
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
    function createComputerMove(prevMove) {
        //TODO : handle empty board, randomization
        var currBoard = prevMove.stateAfterMove.board;
        var bestRow = -1;
        var bestCol = -1;
        var bestScore = 25;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                var currScore = score(currBoard, i, j, prevMove);
                if (currScore < bestScore) {
                    bestRow = i;
                    bestCol = j;
                    bestScore = currScore;
                }
            }
        }
        return gameLogic.createMove(prevMove.stateAfterMove, bestRow, bestCol, prevMove.turnIndexAfterMove);
    }
    aiService.createComputerMove = createComputerMove;
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map