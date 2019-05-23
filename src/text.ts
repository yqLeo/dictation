import strip from "strip-ansi";

// original pattern from "ansi-regex" by Sindre Sorhus and Josh Junon
// licensed under MIT
/** Matches any ANSI escape code. */
const ansiRgx = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|")
);

/** Matches any ANSI escape code OR other character (a,v). */
const avRgx = new RegExp(`(${ansiRgx.source})|(.)`);

/** Represent the visual part of a word. */
export class VWord {
  private _length: number;

  constructor(private _raw: string) {
    this._length = strip(_raw).length;
  }

  /** Raw word string. */
  get raw(): string {
    return this._raw;
  }

  /** Visual length of word. */
  get length(): number {
    return this._length;
  }

  /** Resolve visual index to raw index. */
  private rawIndex(n: number): number {
    // keep a copy of raw word
    let copy = this.raw;
    // track current position of index
    let i = 0;
    // search through word
    while (n > 0) {
      // match next ansi/visual character
      const m = copy.match(ansiRgx);

      if (m === null) {
        // reached end of string (n too large)
        return -1;
      } else if (m[2] !== undefined) {
        // detected visual character
        n -= 1;
      }

      // cut off matched character from copy
      copy = copy.slice(m[0].length);
      // increment raw index
      i += 1;
    }
    return i;
  }

  split(n: number): [VWord, VWord] {
    const first = this.raw.slice(0, this.rawIndex(n));
    const second = this.raw.slice(this.rawIndex(n));
    return [new VWord(first), new VWord(second)];
  }
}

/** Represent the visual words of a line. */
export class VLine {
  constructor(public vWords: VWord[] = []) {}

  /** Return raw version line including spaces. */
  get raw(): string {
    return (
      this.vWords
        // convert words to raw strings
        .map(w => w.raw)
        // concatenate raw strings together with spaces
        .join(" ")
    );
  }

  /** Visual length of line including spaces. */
  get length(): number {
    const spaces = this.vWords.length === 0 ? 0 : this.vWords.length - 1;
    return (
      this.vWords
        // convert words to lengths
        .map(w => w.length)
        // sum lengths
        .reduce((n, dn) => n + dn, 0) + spaces
    );
  }
}

/** Word wrap only a single line (no newlines present). */
function wrapSingle(s: string, width: number): string[] {
  const lines: VLine[] = [];

  let line: VLine = new VLine();
  for (
    // break up string and convert into vwords
    const wordsRev = s
      .split(" ")
      .map(raw => new VWord(raw))
      .reverse();
    // ensure words are still available
    wordsRev.length > 0;

  ) {
    // grab next word
    const word = wordsRev.pop() as VWord;

    // try putting word onto line
    line.vWords.push(word);

    const overflow = line.length - width;

    if (overflow > 0) {
      // not enough space for full word
      line.vWords.pop();

      if (word.length > width) {
        // big word must be split
        const [vw1, vw2] = word.split(word.length - overflow);
        // push first portion to current line
        line.vWords.push(vw1);
        // add second portion into array
        wordsRev.push(vw2);
      } else {
        // add last word back into array
        wordsRev.push(word);
      }

      // insert finished line
      lines.push(line);
      // reset line
      line = new VLine();
    }
  }
  // add last line
  lines.push(line);

  return lines.map(l => l.raw);
}

/** Convert string of words into array of lines with length less than width. */
export function wordWrap(s: string, width: number): string[] {
  // split lines along newlines
  const lines = s.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    // store lines created
    result.push(...wrapSingle(line, width));
  }

  return result;
}

/** Word wrap and return string containing multiple lines. */
export function feedWrap(s: string, width: number): string {
  return wordWrap(s, width).join("\n");
}

/** Control column justification. */
export enum Justify {
  left,
  right
}

/** Fit 2D data into columns. */
export function tablify(data: string[][], format: Justify[] = []): string[] {
  // handle potential asci codes
  const info = data.map(l => l.map(r => new VWord(r)));
  // convert information to sizes
  const sizes = info.map(l => l.map(w => w.length));

  // calculate width of each column
  const colWidths: number[] = [];
  for (const row of sizes) {
    row.forEach((v, c) => {
      colWidths[c] = Math.max(colWidths[c] || 0, v);
    });
  }

  return info.map(row =>
    row
      .map((w, c) => {
        const padding = " ".repeat(colWidths[c] - w.length);

        if (format[c] === Justify.left || format[c] === undefined) {
          return w.raw + padding;
        } else if (format[c] === Justify.right) {
          return padding + w.raw;
        } else {
          throw new Error("unknown justification option");
        }
      })
      .join(" ")
  );
}

export function feedTablify(data: string[][], format: Justify[] = []): string {
  return tablify(data, format).join("\n");
}

/** Formats a string with a specified object. */
export function substitute(s: string, obj: { [name: string]: string }): string {
  // replace all instances of "[^]<NAME>" with values from object
  return s.replace(/(\^)?([A-Z]+)/g, (s, capitalize: string, name: string) => {
    const value = obj[name.toLowerCase()];
    if (value === undefined) {
      return s; // do nothing
    } else {
      let rendered = value !== undefined ? value : name;
      if (capitalize) {
        // capitalize first letter
        rendered = rendered[0].toUpperCase() + rendered.slice(1);
      }
      return rendered;
    }
  });
}

/** Helper function for declaring dependencies for string. */
export function ask<T>(
  s: string
): (obj: { [key in keyof T]: string }) => string {
  return obj => substitute(s, obj);
}
