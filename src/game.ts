/** File for all Game Related Code */

import { Terminal } from "xterm";
import chalk from "chalk";

import { Prompter } from "./prompt";
import * as setup from "./setup";
import Cmd from "./cmd";

let devIndicator = false; // track whether to enable extra debugging

/** Track State of Planetary Objects */
class Planet {
  /** Physical status of the planet. */
  public info: setup.PlanetaryState;
  /** Resources that have not been "mined" yet. */
  public raw: setup.Resources;
  /** Resources that are currently available. */
  public available: setup.Resources;
  /** Average change in resources per day (since last forward). */
  public rate: setup.Resources;

  constructor(state: setup.PlanetaryState) {
    this.info = Object.assign({}, state);
    this.raw = Object.assign({}, state.initResources); // avoid reference
    this.available = {
      water: 0,
      food: 0,
      energy: 0,
      population: state.initResources.population // copy population
    };
    this.rate = {
      water: 0,
      food: 0,
      energy: 0,
      population: 0
    };
  }

  /** Number to measure quality of life. */
  get qualityOfLife(): number {
    if (this.available.population == 0) {
      return 0;
    }
    let qol = this.available.water;
    qol *= this.available.food;
    qol *= this.available.energy;
    qol /= this.available.population;
    return qol;
  }

  /** X position of the planet. */
  get x(): number {
    return this.info.distance * Math.cos(this.info.theta);
  }

  /** Y position of the planet. */
  get y(): number {
    return this.info.distance * Math.sin(this.info.theta);
  }

  /** Calculate distance to another planet. */
  distance(planet: Planet) {
    const dx = planet.x - this.x;
    const dy = planet.y - this.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  /** Simulate the planet forward in time. */
  forward(days: number) {
    // TODO
    // process gains before losses
  }
}

type Planets = { [name: string]: Planet };

const pairRgx = /^(.*) (.*)$/; // "<from> <to>"

/** Master Game Logic */
export class Game {
  public prompter: Prompter;
  public cmd: Cmd;
  public planets: Planets;
  /** Amount of resources being transfered each day from one planet to another. */
  public transfers: { [namePair: string]: setup.Resources } = {};
  /** Sum of all quality of life over game run. */
  public qolScore = 0;

  constructor(private term: Terminal) {
    // create console
    this.prompter = new Prompter(term, chalk.cyanBright("> "));

    // setup commands
    const cmd = new Cmd();
    cmd.on("dev", () => {
      devIndicator = !devIndicator;
    });
    cmd.on("check", async (args: Array<string>) => {
      const name = args[0];
      if (Object.keys(this.planets).indexOf(name) == -1) {
        this.term.writeln(chalk.redBright("Valid planets:"));
        for (let name in this.planets) {
          this.term.writeln(`  ${chalk.redBright(name)}`);
        }
      } else {
        await this.check(this.planets[name]);
      }
    });
    cmd.on("forward", async (args: Array<string>) => {
      const days = Number(args[0]);
      await this.forward(days);
    });
    cmd.on("transfer", () => {
      this.transfer("", 0, undefined as any, undefined as any); // TODO
    });
    this.cmd = cmd;

    // create the planets
    const planets: any = {};
    for (let name in setup.planets) {
      planets[name] = new Planet((setup.planets as any)[name]);
    }
    this.planets = planets;
  }

  async play(): Promise<void> {
    // start game with 1 year of progress

    while (true) {
      const args = await this.prompter.fromPrompt();
      if (devIndicator) {
        this.term.writeln(JSON.stringify(args));
      }
      const success = this.cmd.parseArgs(args);
      if (!success) {
        this.term.writeln(chalk.redBright("Commands:"));
        for (let c of [
          "check <planet>",
          "forward <days>",
          "transfer <res> <amt> <from> <to>"
        ]) {
          this.term.writeln(`  ${c}`);
        }
      }
    }
  }

  async check(planet: Planet) {
    for (let resource in planet.available) {
      const available: number = (planet.available as any)[resource];
      const rate: number = (planet.available as any)[resource];
      const data = `${available.toExponential(2)} ${rate.toExponential(2)}`;
      this.term.writeln(`${chalk.greenBright(`${resource}:`)} ${data}`);
    }
  }

  async forward(days: number) {
    this.term.writeln(chalk.redBright("Work in progress.")); // TODO
  }

  async transfer(resource: string, amount: number, fromP: Planet, toP: Planet) {
    this.term.writeln(chalk.redBright("Work in progress.")); // TODO
  }
}
