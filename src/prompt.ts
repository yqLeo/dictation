/** xTerm Prompt Support */

import { Terminal } from "xterm";
import { split } from "shlex";
import * as ansi from "ansi-escapes";
import chalk from "chalk";

const recordable = /^(\.|-|\w| |")$/;

/** Represent a position on the screen. */
export interface Position {
  x: number;
  y: number;
}

/** Get cursor position from a terminal. */
export async function getCursor(term: Terminal): Promise<Position> {
  return new Promise<Position>(resolve => {
    let record = "";

    const listener = (key: string, ev: KeyboardEvent) => {
      // this assumes that no process interrupts the key stream from the terminal
      record += key;

      const match = record.match(/\x1b\[(\d*?);(\d*?)R/);
      if (match) {
        // will error on null match
        const y = Number(match[1]) - 1;
        const x = Number(match[2]) - 1;
        term.off("data", listener);
        resolve({ x: x, y: y });
      }
    };
    term.on("data", listener);

    term.write(ansi.cursorGetPosition);
  });
}

/** Use to track multiple cursor positions. */
export class CursorPosition {
  public x: number = 0;
  public y: number = 0;

  constructor(private term: Terminal) {}

  /** Save current position of cursor. */
  async save(): Promise<this> {
    const position = await getCursor(this.term);
    this.x = position.x;
    this.y = position.y;
    return this;
  }

  /** Restore cursor to previously saved position. */
  restore() {
    this.term.write(ansi.cursorTo(this.x, this.y));
  }
}

/** Provide user input abilities. */
export class Prompter {
  constructor(public term: Terminal, public prompt = "> ") {}

  private inputSpace(col: number): number {
    if (col < this.term.cols) {
      return this.term.cols - this.prompt.length;
    } else {
      throw new Error("prompt is too large to fit in terminal");
    }
  }

  abbreviate(width: number, data: string): string {
    return data.slice(Math.min(0, -width));
  }

  private printPrompt(): void {
    // prepare prompt line
    {
      let buffer = "";
      buffer += ansi.eraseLine; // clear current prompt
      buffer += ansi.cursorTo(0); // move cursor to left side
      this.term.write(buffer);
    }

    // print prompt
    this.term.write(this.prompt);
  }

  /** Wait for user to type input and press enter. */
  async getInput(width = -1): Promise<string> {
    const originalPosition = await new CursorPosition(this.term).save();

    return new Promise(resolve => {
      const data: string[] = [];
      const listener = (key: string, ev: KeyboardEvent): void => {
        if (ev.key == "Enter") {
          this.term.off("key", listener); // remove input listener
          this.term.writeln(""); // move to the next line
          return resolve(data.join("")); // return data to promise
        } else if (ev.key == "Backspace") {
          data.pop(); // remove character from input
        } else if (key.match(recordable)) {
          data.push(key); // add character to input
        } else {
          return; // nothing of note, so exit fast
        }

        // refresh input line
        originalPosition.restore();
        this.term.write(ansi.eraseEndLine);
        this.term.write(this.abbreviate(width, data.join("")));
      };
      this.term.on("key", listener);
    });
  }

  /** Get input and shlex split it. */
  async getArgs(width = -1): Promise<string[]> {
    return split(await this.getInput(width));
  }

  /** Use a prompt to get input. */
  async fromPrompt(): Promise<string[]> {
    this.printPrompt();
    const position = await getCursor(this.term);
    return this.getArgs(this.term.cols - position.x);
  }
}

/** Add color and format difference. */
export function formatDiff(dx: number, prec = 3): string {
  const sign = Math.sign(dx) >= 0 ? "+" : "-";
  const n = dx.toExponential(prec - 1);

  let color: string = "whiteBright";
  if (dx > 0) {
    color = "greenBright";
  } else if (dx == 0) {
    color = "yellowBright";
  } else if (dx < 0) {
    color = "redBright";
  }

  return (chalk as any)[color](`(${sign}${n})`);
}
