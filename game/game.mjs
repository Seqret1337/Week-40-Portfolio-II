import { print, askQuestion } from "./io.mjs"
import { debug, DEBUG_LEVELS } from "./debug.mjs";
import { ANSI } from "./ansi.mjs";
import DICTIONARY from "./language.mjs";
import showSplashScreen from "./splash.mjs";
import { clear } from "console";

const GAME_BOARD_SIZE = 3;
const PLAYER_1 = 1;
const PLAYER_2 = -1;

/*
// These are the valid choices for the menu.
const MENU_CHOICES = {
    MENU_CHOICE_START_GAME: 1,
    MENU_CHOICE_SHOW_SETTINGS: 2,
    MENU_CHOICE_EXIT_GAME: 3
};
*/
//const NO_CHOICE = -1;

let language = DICTIONARY.en;
let gameboard;
let currentPlayer;

const MENU_ACTIONS = [
    makeMenuItem(language.MENU_PLAY_GAME_PVP, runGame),
    makeMenuItem(language.MENU_PLAY_GAME_PVC),
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
setTimeout(start, 2500); // This waites 2.5seconds before calling the function. i.e. we get to see the splash screen for 2.5 seconds before the menue takes over. 

function makeMenuItem(description, action) {
    return { description, action };
}

function showMenu(menu) {
    clearScreen();
    print(ANSI.COLOR.YELLOW + language.MENU_TITLE + ANSI.RESET);
    for (let i = 0; i < menu.length; i++) {
        print((i + 1) + ". " + menu[i].description);
    }
}

async function getMenuSelection(menu) {
    let choice;
    do {
        choice = Number(await askQuestion(""));
    } while (choice < 1 || choice > menu.length);
    return choice - 1;
}

//#region game functions -----------------------------

async function start() {
    while (true) {
        showMenu(currentMenu);
        let menuSelection = await getMenuSelection(currentMenu);
        await currentMenu[menuSelection].action();
    }
}

async function runGame() {

    let isPlaying = true;

    while (isPlaying) { // Do the following until the player dos not want to play anymore. 
        initializeGame(); // Reset everything related to playing the game
        isPlaying = await playGame(); // run the actual game 
    }
}
/*
async function showMenu() {

    let choice = NO_CHOICE;  // This variable tracks the choice the player has made. We set it to -1 initially because that is not a valid choice.
    let validChoice = false;    // This variable tells us if the choice the player has made is one of the valid choices. It is initially set to false because the player has made no choices.

    while (!validChoice) {
        // Display our menu to the player.
        clearScreen();
        print(ANSI.COLOR.YELLOW + language.MENU_TITLE + ANSI.RESET);
        print(language.MENU_PLAY_GAME);
        print(language.MENU_SETTINGS);
        print(language.MENU_EXIT_GAME);

        // Wait for the choice.
        choice = await askQuestion("");

        // Check to see if the choice is valid.
        if ([MENU_CHOICES.MENU_CHOICE_START_GAME, MENU_CHOICES.MENU_CHOICE_SHOW_SETTINGS, MENU_CHOICES.MENU_CHOICE_EXIT_GAME].includes(Number(choice))) {
            validChoice = true;
        }
    }

    return choice;
}
*/
async function playGame() {
    // Play game..
    let outcome = null;
    do {
        clearScreen();
        showGameBoardWithCurrentState();
        showHUD();
        let move = await getGameMoveFromtCurrentPlayer();
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
    if (outcome === 0) {
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
    
    let isBoardFull = gameboard.every(row => row.every(cell => cell !== 0));
    if (isBoardFull) {
        return 0;
    }
    
    return state;
}

function updateGameBoardState(move) {
    const row = parseInt(move[0]) - 1;
    const col = parseInt(move[1]) - 1;
    gameboard[row][col] = currentPlayer;
}

async function getGameMoveFromtCurrentPlayer() {
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

    const row = parseInt(position[0]) - 1;
    const col = parseInt(position[1]) - 1;

    if (isNaN(row) || isNaN(col)) {
        return false;
    }

    if (row < 0 || row >= GAME_BOARD_SIZE || col < 0 || col >= GAME_BOARD_SIZE) {
        return false;
    }

    if (gameboard[row][col] !== 0) {
        return false;
    }

    return true;
}

function showHUD() {
    let playerDescription = currentPlayer === PLAYER_1 ? "one" : "two";
    print(language.PLAYER_TURN.replace("{0}", playerDescription));
}

function showGameBoardWithCurrentState() {
    for (let currentRow = 0; currentRow < GAME_BOARD_SIZE; currentRow++) {
        let rowOutput = "";
        for (let currentCol = 0; currentCol < GAME_BOARD_SIZE; currentCol++) {
            let cell = gameboard[currentRow][currentCol];
            if (cell == 0) {
                rowOutput += "_ ";
            }
            else if (cell > 0) {
                rowOutput += "X ";
            } else {
                rowOutput += "O ";
            }
        }

        print(rowOutput);
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
    if (languageChoice.toLowerCase() === "en") {
        language = DICTIONARY.en;
    } else if (languageChoice.toLowerCase() === "no") {
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
//#endregion

