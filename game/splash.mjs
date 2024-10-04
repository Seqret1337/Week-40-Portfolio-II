import { ANSI } from "./ansi.mjs";

const ART = `
${ANSI.COLOR.BLUE}  _______   _____    ____   ${ANSI.COLOR.GREEN}  _______       ___       ____   ${ANSI.COLOR.YELLOW}  _______   ____    ______ ${ANSI.RESET}
${ANSI.COLOR.BLUE} |__   __| |_   _|  / ___|  ${ANSI.COLOR.GREEN} |__   __|     / _ \\     / ___|  ${ANSI.COLOR.YELLOW} |__   __| / __ \\  |  ____|${ANSI.RESET}
${ANSI.COLOR.BLUE}    | |      | |   / /      ${ANSI.COLOR.GREEN}    | |       / /_\\ \\   / /      ${ANSI.COLOR.YELLOW}    | |   | |  | | | |__   ${ANSI.RESET}
${ANSI.COLOR.BLUE}    | |      | |  | |       ${ANSI.COLOR.GREEN}    | |      / _____ \\ | |       ${ANSI.COLOR.YELLOW}    | |   | |  | | |  __|  ${ANSI.RESET}
${ANSI.COLOR.BLUE}    | |     _| |_  \\ \\___   ${ANSI.COLOR.GREEN}    | |     / /     \\ \\ \\ \\___   ${ANSI.COLOR.YELLOW}    | |   | |__| | | |____ ${ANSI.RESET}
${ANSI.COLOR.BLUE}    |_|    |_____|  \\____|  ${ANSI.COLOR.GREEN}    |_|    /_/       \\_\\ \\____|  ${ANSI.COLOR.YELLOW}    |_|    \\____/  |______|${ANSI.RESET}
`;

function showSplashScreen() {
    console.log(ART);
}

export default showSplashScreen;