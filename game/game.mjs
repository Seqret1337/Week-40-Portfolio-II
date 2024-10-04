import { print, askQuestion } from "./io.mjs"
import { debug, DEBUG_LEVELS } from "./debug.mjs";
import { ANSI } from "./ansi.mjs";
import DICTIONARY from "./language.mjs";
import showSplashScreen from "./splash.mjs";
import { clear } from "console";

const GAME_BOARD_SIZE = 3;
const PLAYER_1 = 1;
const PLAYER_2 = -1;
const EMPTY_CELL = 0;
const SPLASH_SCREEN_DUARTION = 2500;

const MENU_START_INDEX = 1;

const LANGUAGE_EN = "en";
const LANGUAGE_NO = "no";

let language = DICTIONARY.en;
let gameboard;
let currentPlayer;

const MENU_ACTIONS = [
    makeMenuItem(language.MENU_PLAY_GAME_PVP, () => runGame(false)),
    makeMenuItem(language.MENU_PLAY_GAME_PVC, () => runGame(true)),
    makeMenuItem(language.MENU_SETTINGS, showSettings),
    makeMenuItem(language.MENU_EXIT_GAME, exitGame),
];

const SETTINGS_MENU = [
    makeMenuItem(language.MENU_CHANGE_LANGUAGE, changeLanguage),
    makeMenuItem(language.MENU_BACK, function () { currentMenu = MENU_ACTIONS; }),
]

let currentMenu = MENU_ACTIONS;

clearScreen();
showSplashScreen();
setTimeout(start, SPLASH_SCREEN_DUARTION); // This waites 2.5seconds before calling the function. i.e. we get to see the splash screen for 2.5 seconds before the menue takes over. 

function makeMenuItem(description, action) {
    return { description, action };
}

function showMenu(menu) {
    clearScreen();
    print(ANSI.COLOR.YELLOW + language.MENU_TITLE + ANSI.RESET);
    for (let i = 0; i < menu.length; i++) {
        print((i + MENU_START_INDEX) + ". " + menu[i].description);
    }
}

async function getMenuSelection(menu) {
    let choice;
    do {
        choice = Number(await askQuestion(""));
    } while (choice < MENU_START_INDEX || choice > menu.length);
    return choice - MENU_START_INDEX;
}

//#region game functions -----------------------------

async function start() {
    while (true) {
        showMenu(currentMenu);
        let menuSelection = await getMenuSelection(currentMenu);
        await currentMenu[menuSelection].action();
    }
}

async function runGame(isPvC = false) {

    let isPlaying = true;

    while (isPlaying) { // Do the following until the player dos not want to play anymore. 
        initializeGame(); // Reset everything related to playing the game
        isPlaying = await playGame(isPvC); // run the actual game 
    }
}

async function playGame(isPvC) {
    // Play game..
    let outcome = null;
    do {
        clearScreen();
        showGameBoardWithCurrentState();
        showHUD();
        let move;
        if (isPvC && currentPlayer === PLAYER_2) {
            print(language.COMPUTER_THINKING);
            await new Promise(resolve => setTimeout(resolve, 1500));
            move = getComputerMove();
        } else {
            move = await getGameMoveFromCurrentPlayer();
        }
        updateGameBoardState(move);
        outcome = evaluateGameState();
        if (outcome === null) {
            changeCurrentPlayer();
        }
    } while (outcome === null)

    showGameSummary(outcome);

    return await askWantToPlayAgain();
}

async function askWantToPlayAgain() {
    let answer = await askQuestion(language.PLAY_AGAIN_QUESTION);
    let playAgain = true;
    if (answer && answer.toLowerCase()[0] != language.CONFIRM) {
        playAgain = false;
    }
    return playAgain;
}

function showGameSummary(outcome) {
    clearScreen();
    if (outcome === EMPTY_CELL) {
        print(language.ITS_A_DRAW);
    } else {
        let winningPlayer = (outcome > 0) ? 1 : 2;
        print(language.WINNER_IS_PLAYER + winningPlayer);
    }
    
    showGameBoardWithCurrentState();
    print(language.GAME_OVER);
}

function changeCurrentPlayer() {
    currentPlayer *= -1;
}

function evaluateGameState() {
    let state = null;

    for (let row = 0; row < GAME_BOARD_SIZE; row++) {
        let sum = gameboard[row].reduce((a, b) => a + b, 0);
        if (Math.abs(sum) === GAME_BOARD_SIZE) {
            return sum / GAME_BOARD_SIZE;
        }
    }

    for (let col = 0; col < GAME_BOARD_SIZE; col++) {
        let sum = 0;
        for (let row = 0; row < GAME_BOARD_SIZE; row++) {
            sum += gameboard[row][col];
        }
        if (Math.abs(sum) === GAME_BOARD_SIZE) {
            return sum / GAME_BOARD_SIZE;
        }
    }

    let mainDiagonalSum = 0;
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        mainDiagonalSum += gameboard[i][i];
    }
    if (Math.abs(mainDiagonalSum) === GAME_BOARD_SIZE) {
        return mainDiagonalSum / GAME_BOARD_SIZE;
    }
    
    let antiDiagonalSum = 0;
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        antiDiagonalSum += gameboard[i][GAME_BOARD_SIZE - 1 - i];
    }
    if (Math.abs(antiDiagonalSum) === GAME_BOARD_SIZE) {
        return antiDiagonalSum / GAME_BOARD_SIZE;
    }
    
    let isBoardFull = gameboard.every(row => row.every(cell => cell !== EMPTY_CELL));
    if (isBoardFull) {
        return EMPTY_CELL;
    }
    
    return state;
}

function updateGameBoardState(move) {
    const row = parseInt(move[0]) - MENU_START_INDEX;
    const col = parseInt(move[1]) - MENU_START_INDEX;
    gameboard[row][col] = currentPlayer;
}

async function getGameMoveFromCurrentPlayer() {
    let position = null;
    do {
        let rawInput = await askQuestion(language.PLACE_MARK);
        position = rawInput.split(" ");
    } while (isValidPositionOnBoard(position) == false)

    return position
}

function isValidPositionOnBoard(position) {

    if (position.length !== 2) {
        return false;
    }

    const row = parseInt(position[0]) - MENU_START_INDEX;
    const col = parseInt(position[1]) - MENU_START_INDEX;

    if (isNaN(row) || isNaN(col)) {
        return false;
    }

    if (row < 0 || row >= GAME_BOARD_SIZE || col < 0 || col >= GAME_BOARD_SIZE) {
        return false;
    }

    if (gameboard[row][col] !== EMPTY_CELL) {
        return false;
    }

    return true;
}

function showHUD() {
    let playerDescription = currentPlayer === PLAYER_1 ? "one" : "two";
    print(language.PLAYER_TURN.replace("{0}", playerDescription));
}

function showGameBoardWithCurrentState() {
    const horizontalLine = "+" + "---+".repeat(GAME_BOARD_SIZE);

    print(horizontalLine);

    for (let currentRow = 0; currentRow < GAME_BOARD_SIZE; currentRow++) {
        let rowOutput = "|";
        for (let currentCol = 0; currentCol < GAME_BOARD_SIZE; currentCol++) {
            let cell = gameboard[currentRow][currentCol];
            let cellContent;
            if (cell === 0) {
                cellContent = "   ";
            }
            else if (cell === PLAYER_1) {
                cellContent = ANSI.COLOR.RED + " X " + ANSI.RESET;
            } else {
                cellContent = ANSI.COLOR.BLUE + " O " + ANSI.RESET;
            }
            rowOutput += cellContent + "|";
        }
        print(rowOutput);
        print(horizontalLine);
    }
}

function initializeGame() {
    gameboard = createGameBoard();
    currentPlayer = PLAYER_1;
}

function createGameBoard() {

    let newBoard = new Array(GAME_BOARD_SIZE);

    for (let currentRow = 0; currentRow < GAME_BOARD_SIZE; currentRow++) {
        let row = new Array(GAME_BOARD_SIZE);
        for (let currentColumn = 0; currentColumn < GAME_BOARD_SIZE; currentColumn++) {
            row[currentColumn] = 0;
        }
        newBoard[currentRow] = row;
    }

    return newBoard;

}

function clearScreen() {
    console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME, ANSI.RESET);
}

async function showSettings() {
    currentMenu = SETTINGS_MENU;
}

function exitGame() {
    clearScreen();
    process.exit();
}

async function changeLanguage() {
    const languageChoice = await askQuestion("Choose language (en/no): ")
    if (languageChoice.toLowerCase() === LANGUAGE_EN) {
        language = DICTIONARY.en;
    } else if (languageChoice.toLowerCase() === LANGUAGE_NO) {
        language = DICTIONARY.no;
    }
    updateMenuLanguage();
}

function updateMenuLanguage() {
    MENU_ACTIONS[0].description = language.MENU_PLAY_GAME_PVP;
    MENU_ACTIONS[1].description = language.MENU_PLAY_GAME_PVC;
    MENU_ACTIONS[2].description = language.MENU_SETTINGS;
    MENU_ACTIONS[3].description = language.MENU_EXIT_GAME;

    SETTINGS_MENU[0].description = language.MENU_CHANGE_LANGUAGE;
    SETTINGS_MENU[1].description = language.MENU_BACK;
}

function getComputerMove() {
    let avaliableMoves = [];
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        for (let j = 0; j < GAME_BOARD_SIZE; j++) {
            if (gameboard[i][j] === EMPTY_CELL) {
                avaliableMoves.push([i + MENU_START_INDEX, j + MENU_START_INDEX]);
            }
        }
    }
    return avaliableMoves[Math.floor(Math.random() * avaliableMoves.length)];
}
//#endregion

