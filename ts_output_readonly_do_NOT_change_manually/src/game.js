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