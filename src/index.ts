import "./style.scss";
import "../node_modules/xterm/dist/xterm.css";

import * as WebFont from "webfontloader";
import { Terminal } from "xterm";
import * as fit from "xterm/lib/addons/fit/fit";
import chalk from "chalk";

// We know that chalk will work here.
chalk.enabled = true;
chalk.level = 1;

import { Game } from "./game";

Terminal.applyAddon(fit);

/** Create and fit a new terminal into the screen. */
function createTerminal(): Terminal {
  const terminalDiv: HTMLDivElement = document.getElementById(
    "terminal"
  ) as any;

  const term = new Terminal({
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: "bold",
    cursorBlink: true,
    cols: 40,
    rows: 20
  });

  term.open(terminalDiv);

  let screen = term.element
    .getElementsByClassName("xterm-screen")
    .item(0) as HTMLDivElement;
  let width = screen.style.width;
  terminalDiv.style.maxWidth = width;

  fit.fit(term);

  return term;
}

/** Execute the game. */
async function main(): Promise<void> {
  let term = createTerminal();

  let game = new Game(term);

  await game.play();
}

WebFont.load({
  google: {
    families: ["IBM Plex Mono"]
  },
  active: main
});
