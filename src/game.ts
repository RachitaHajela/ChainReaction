interface SupportedLanguages { en: string, iw: string};
interface Translations {
  [index: string]: SupportedLanguages;
}

module game {
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console:
  // game.state
  export let animationEnded = false;
  export let canMakeMove = false;
  export let isComputerTurn = false;
  export let move: IMove = null;
  export let state: IState = null;
  export let isHelpModalShown: boolean = false;

  export function init() {
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

    let w: any = window;
    if (w["HTMLInspector"]) {
      setInterval(function () {
        w["HTMLInspector"].inspect({
          excludeRules: ["unused-classes", "script-placement"],
        });
      }, 3000);
    }
  }

  function getTranslations(): Translations {
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
      CLOSE:  {
        en: "Close",
        iw: "סגור",
      },
    };
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
      sendComputerMove();
    });
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    moveService.makeMove(aiService.findComputerMove(move));
  }

  export let round: number = 0;
  let intervalFuture: ng.IPromise<any> = null;
  let maxRound: number = 10;
  
  function updateUI(params: IUpdateUI): void {
    
    log.info("Game got updateUI:", params);
    animationEnded = false;
    move = params.move;
    state = move.stateAfterMove;
    if (!state) {
      state = gameLogic.getInitialState();
      maxRound = 1;
    } else {
      maxRound = state.delta.explosions.length+1;
    }
    canMakeMove = move.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === move.turnIndexAfterMove; // it's my turn

    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    if (isComputerTurn) {
      // To make sure the player won't click something and send a move instead of the computer sending a move.
      canMakeMove = false;
      // We calculate the AI move only after the animation finishes,
      // because if we call aiService now
      // then the animation will be paused until the javascript finishes.
      if (!state.delta) {
        // This is the first move in the match, so
        // there is not going to be an animation, so
        // call sendComputerMove() now (can happen in ?onlyAIs mode)
        sendComputerMove();
      }
    }
    if (intervalFuture) {
      $interval.cancel(intervalFuture);
    }
    round = 0;
     intervalFuture = $interval(() => {
      round++;
      if (round == maxRound) {
        $interval.cancel(intervalFuture);
      }
    }, 1000);
  }
  

  export function cellClicked(row: number, col: number): void {
    log.info("Clicked on cell:", row, col);
    if (window.location.search === '?throwException') { // to test encoding a stack trace with sourcemap
      throw new Error("Throwing the error because URL has '?throwException'");
    }
    if (!canMakeMove) {
      return;
    }
    try {
      let nextMove = gameLogic.createMove(
          state, row, col, move.turnIndexAfterMove);
      canMakeMove = false; // to prevent making another move
      moveService.makeMove(nextMove);
    } catch (e) {
      log.info(["Cell is already full in position:", row, col]);
      return;
    }
  }

  export function shouldShowImage(row: number, col: number, round: number): boolean {
    //let cell = state.board[row][col];
    //return cell.playerId !== -1;
    try {
      log.info("shouldShowImage : round ", round, "row", row, "col", col, "try")      
      return state.delta.explosions[round].boardAfterExplosions[row][col].playerId !== -1;
    } catch (e) {
      log.info("shouldShowImage : round ", round, "row", row, "col", col, "catch") 
         
      let cell = state.board[row][col];
      return cell.playerId !== -1;
      
      //return false;
    }
    //return contains(cells, row, col);
  }

  export function containsMolOfPlayer(row: number, col: number, round: number, playerId: number, numMol: number): boolean {
      try {
          let currCell : CellState = state.delta.explosions[round].boardAfterExplosions[row][col];
          return currCell.playerId === playerId && currCell.numMolecules === numMol;
      } catch (e) {
          return state.board[row][col].playerId === playerId && state.board[row][col].numMolecules == numMol;
      }
  }

  /*
  export function isPieceX(row: number, col: number): boolean {
    return state.board[row][col] === 'X';
  }

  export function isPieceO(row: number, col: number): boolean {
    return state.board[row][col] === 'O';
  }
  */
  
  export function shouldSlowlyAppear(row: number, col: number, round: number): boolean {
    /*
    return !animationEnded &&
        state.delta &&
        state.delta.row === row && state.delta.col === col;
    */
    return true;
  }
  
  function contains(cells: Cell[], row: number, col: number): boolean {
        log.info("shouldAnimate -- contains")
      for (let i=0; i<cells.length; i++) {
          if (cells[i].row === row && cells[i].col === col) {
              //log.info("shouldAnimate")
              log.info("true")
              return true;
          }
      }
        log.info("false")
      return false;
  }
  
  export function shouldAnimate(row: number, col: number, round: number): boolean {
    log.info("shouldAnimate -- row , col , round and  explosions length:",row, col, round, state.delta.explosions.length);
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
        return !animationEnded && contains(state.delta.explosions[round+1].cellsExploded, row, col);
    } catch (e) {
        return false;
    }
  }

  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isHelpModalShown = false;
    }
    return true;
  }
}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });
