/** File for all Game Related Code */

import { Terminal } from "xterm";
import chalk from "chalk";

import { Prompter, formatDiff } from "./prompt";
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

  constructor(public name: string, state: setup.PlanetaryState) {
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
  get totalQol(): number {
    let qol = this.available.water;
    qol *= this.available.food;
    qol *= this.available.energy;
    return qol;
  }

  get qolPerCapita(): number {
    if (this.available.population == 0) {
      return 0;
    } else {
      return this.totalQol / this.available.population ** 3;
    }
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

  /** Step forward a single day for this planet. */
  step() {
    // calculate gain first
    // TODO
  }

  /** Simulate the planet forward in time. */
  forward(days: number) {
    for (let i = 0; i < days; i++) this.step();
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
    cmd.asyncOn("dev", () => {
      devIndicator = !devIndicator;
    });
    cmd.asyncOn("check", async (args: Array<string>) => {
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
    cmd.asyncOn("forward", async (args: Array<string>) => {
      const days = Number(args[0]);
      await this.forward(days);
    });
    cmd.asyncOn("transfer", async (args: string[]) => {
      // TODO perform better argument verification
      const res = args[0];
      const amt = Number(args[1]);
      const fromP = this.planets[args[2]];
      const toP = this.planets[args[3]];
      await this.transfer(res, amt, fromP, toP);
    });
    this.cmd = cmd;

    // create the planets
    const planets: any = {};
    for (let name in setup.planets) {
      planets[name] = new Planet(name, (setup.planets as any)[name]);
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
      const success = await this.cmd.parseArgs(args);
      if (!success) {
        this.term.writeln(chalk.redBright("Commands:"));
        for (let c of [
          "check <planet> [planetTo]",
          "forward <days>",
          "transfer <res> <amt> <from> <to>"
        ]) {
          this.term.writeln(`  ${c}`);
        }
      }
    }
  }

  async check(planet: Planet, planetTo?: Planet) {
    // TODO
    for (let resource in planet.available) {
      const available: number = (planet.available as any)[resource];
      const rate: number = (planet.available as any)[resource];
      const data = `${available.toExponential(2)} ${formatDiff(rate, 3)}`;
      this.term.writeln(`${resource}: ${data}`);
    }
  }

  async forward(days: number, subdivide = 10, wait = 5000) {
    for (let i = 0; i < subdivide; i++) {
      let daysLeft = Math.round(((subdivide - i) / subdivide) * days);
      this.term.writeln(`Waiting ${daysLeft} days...`);
      await sleep(wait / subdivide);
    }
  }

  async transfer(resource: string, amount: number, fromP: Planet, toP: Planet) {
    this.term.writeln(
      chalk.blueBright(
        `Setting up continuous trade of ${formatDiff(
          amount
        )} ${resource} from ${fromP.name} to ${toP.name}...`
      )
    ); // TODO
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}
