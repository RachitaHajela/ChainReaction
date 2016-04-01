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
                iw: "חוקי המשחק",
            },
            RULES_SLIDE1: {
                en: "You and your opponent take turns to occupy the cells by putting their balls in them. A ball can be put in an empty cell or a cell already occupied by you",
                iw: "אתה והיריב מסמנים איקס או עיגול כל תור",
            },
            RULES_SLIDE2: {
                en: "A cell explodes and occupies the neighboring cells if the number of balls in it becomes equal to the number of neighbors it has",
                iw: "הראשון שמסמן שורה, עמודה או אלכסון מנצח",
            },
            RULES_SLIDE3: {
                en: "The player who wipes out the other player's occupied cells wins.",
                iw: "הראשון שמסמן שורה, עמודה או אלכסון מנצח",
            },
            CLOSE: {
                en: "Close",
                iw: "סגור",
            },
        };
    }
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            game.animationEnded = true;
            sendComputerMove();
        });
    }
    function sendComputerMove() {
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    game.round = 0;
    var intervalFuture = null;
    var maxRound = 4;
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
        }
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            if (!game.state.delta) {
                // This is the first move in the match, so
                // there is not going to be an animation, so
                // call sendComputerMove() now (can happen in ?onlyAIs mode)
                sendComputerMove();
            }
        }
        if (intervalFuture) {
            $interval.cancel(intervalFuture);
        }
        game.round = 0;
        intervalFuture = $interval(function () {
            game.round++;
            if (game.round == maxRound) {
                $interval.cancel(intervalFuture);
            }
        }, 1000);
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
            log.info("shouldShowImage : round ", round, "try");
            return game.state.delta.explosions[round].boardAfterExplosions[row][col].playerId !== -1;
        }
        catch (e) {
            log.info("shouldShowImage : round ", round, "catch");
            var cell = game.state.board[row][col];
            return cell.playerId !== -1;
        }
        //return contains(cells, row, col);
    }
    game.shouldShowImage = shouldShowImage;
    function containsMolOfPlayer(row, col, playerId, numMol) {
        return game.state.board[row][col].playerId === playerId && game.state.board[row][col].numMolecules == numMol;
    }
    game.containsMolOfPlayer = containsMolOfPlayer;
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
        log.info("shouldAnimate -- contains");
        for (var i = 0; i < cells.length; i++) {
            if (cells[i].row === row && cells[i].col === col) {
                //log.info("shouldAnimate")
                log.info("true");
                return true;
            }
        }
        log.info("false");
        return false;
    }
    function shouldAnimate(row, col, round) {
        log.info("shouldAnimate -- row , col , round and  explosions length:", row, col, round, game.state.delta.explosions.length);
        if (round >= game.state.delta.explosions.length) {
            log.info("shouldAnimate -- if");
            log.info("false");
            return false;
        }
        log.info("shouldAnimate -- outside if");
        return !game.animationEnded && contains(game.state.delta.explosions[round].cellsExploded, row, col);
    }
    game.shouldAnimate = shouldAnimate;
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