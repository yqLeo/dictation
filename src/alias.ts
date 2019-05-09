/** Define alias type. */

/** Provide aliasing for strings. */
export class Alias {
  constructor(public names: { [key: string]: string }) {}

  /** Return aliased name or original if unknown. */
  resolve(name: string): string {
    const lookup = this.names[name];
    return lookup != undefined ? lookup : name;
  }
}
