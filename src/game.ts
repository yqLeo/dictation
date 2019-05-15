/** File for all Game Related Code */

import { Terminal } from "xterm";
import chalk from "chalk";

import { Prompter, formatDiff, getCursor } from "./prompt";
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

  get escape(): number {
    return this.info.gravity ** 2;
  }

  get productivity(): number {
    return this.totalQol / setup.qolBase;
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
    for (let res of Object.keys(this.available)) {
      if (res == "population") {
        this.available.population +=
          setup.c.gainFactor *
          this.available.population *
          (this.productivity - 1);
        this.available.population = Math.max(this.available.population, 0);
      } else {
        let dr = this.raw[res] * this.productivity;
        dr = Math.min(dr, this.raw[res]); // cannot pull out more than exists
        this.raw[res] -= dr;
        this.available[res] += dr;
      }
    }

    // calculate consumtion
    for (let res of Object.keys(this.available)) {
      // population taken into account above
      if (res != "population") {
        let dr = setup.refStd[res] * this.available.population;
        this.available[res] -= Math.min(dr, this.available[res]); // cannot consume more than exists
      }
    }

    this.info.theta += (2 * Math.PI) / this.info.period; // perform rotation
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
  public hError = (reason: Error) => {
    if (typeof reason == "string") {
      this.term.writeln(chalk.magentaBright(reason));
    } else {
      this.term.writeln(chalk.magentaBright(reason.message));
    }
    throw reason;
  };

  public prompter: Prompter;
  public cmd: Cmd;
  public currentDay: number = 0;
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
    cmd.on("error", this.hError); // do not suppress errors
    cmd.asyncOn("", () => {}); // nothing command
    cmd.asyncOn("dev", () => {
      devIndicator = !devIndicator;
    });
    cmd.asyncOn("check", async (args: Array<string>) => {
      const names = args[1] == undefined ? [args[0]] : [args[0], args[1]];
      // verify names make sense
      for (let name of names) {
        if (Object.keys(this.planets).indexOf(name) == -1) {
          this.listPlanets();
          return; // exit fast
        }
      }
      await this.check(this.planets[names[0]], this.planets[names[1]]);
    });
    cmd.asyncOn("forward", async (args: Array<string>) => {
      let days: number;
      try {
        days = Number(args[0]);
      } catch (e) {
        this.error(`"${args[0]}" is not a number`);
        return;
      }
      await this.forward(days);
    });
    cmd.asyncOn("transfer", async (args: string[]) => {
      const res = args[0];
      if (Object.keys(setup.refStd).indexOf(res) == -1) {
        this.listOptions("resources", Object.keys(setup.refStd));
        return;
      }
      let amt: number;
      try {
        amt = Number(args[1]);
      } catch (e) {
        this.error(`"${args[1]}" is not a number`);
        return;
      }
      const fromP = this.planets[args[2]];
      const toP = this.planets[args[3]];
      if (fromP == undefined || toP == undefined) {
        this.listPlanets();
        return;
      }
      await this.transfer(res, amt, fromP, toP);
    });
    this.cmd = cmd;

    // create the planets
    const planets: { [name: string]: Planet } = {};
    for (let name in setup.planets) {
      planets[name] = new Planet(name, (setup.planets as any)[name]);
      if (name == "earth") {
        planets[name].available = Object.assign({}, setup.earthAvailable);
      }
    }
    this.planets = planets;
  }

  async play(): Promise<void> {
    this.term.writeln(setup.openingText);

    // start game with 1 year of progress

    while (true) {
      const args = await this.prompter.fromPrompt();
      // enable developer info
      if (devIndicator) {
        this.term.writeln(JSON.stringify(args));
      }
      // check that a valid command was given
      const success = await this.cmd.parseArgs(args).catch(this.hError); // do not suppress errors
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

  error(msg: string): void {
    this.term.writeln(chalk.redBright(msg));
  }

  async wrapPrint(msg: string): Promise<void> {
    const sep = msg.split(" ");
    this.term.write(sep[0]);
    for (let word of sep.slice(1)) {
      if (this.term.cols - (await getCursor(this.term)).x <= word.length) {
        this.term.write("\n\r");
      } else {
        this.term.write(` ${word}`);
      }
    }
  }

  /** Print valid options. */
  listOptions(kind: string, opts: string[]): void {
    this.error(`Valid ${kind}:`);
    for (let name of opts) {
      this.error(`  ${name}`);
    }
  }

  /** Print names of all planets in the solar system. */
  listPlanets(): void {
    this.listOptions("planets", Object.keys(this.planets));
  }

  /** Print available resources and their changes over time. */
  listResources(av: setup.Resources, ra?: setup.Resources): void {
    for (let resource in av) {
      const available: number = av[resource];
      let data = `${available.toExponential(2)}`;

      // only add rate information if necessary
      if (ra != undefined) {
        const rate: number = ra[resource];
        data += ` ${formatDiff(rate)}`;
      }

      // IMPLICIT INDENT
      this.term.writeln(`  ${resource}: ${data}`);
    }
  }

  /** Print the current status of a planet. */
  showPlanetStatus(planet: Planet): void {
    this.term.writeln(chalk.blueBright(`${planet.name.toUpperCase()}:`));
    const orbit = Math.round(planet.info.theta * (180 / Math.PI));
    this.term.writeln(`  orbit: ${orbit}_deg`);
    this.listResources(planet.available, planet.rate);
  }

  async check(planet: Planet, planetTo?: Planet) {
    this.showPlanetStatus(planet);

    // provide extra info if necessary
    if (planetTo != undefined) {
      // print transfer information
      const res = this.getTransfer(planet, planetTo);
      // might need to correct sign of values
      let corrected: setup.Resources;
      if (planet.name <= planetTo.name) {
        corrected = res;
      } else {
        // flip signs
        corrected = {
          water: -res.water,
          food: -res.food,
          energy: -res.energy,
          population: -res.population
        };
      }

      this.term.writeln(
        chalk.blueBright(
          `Transfers from ${planet.name.toUpperCase()} to ${planetTo.name.toUpperCase()}`
        )
      );
      this.term.writeln(
        `  distance: ${planet.distance(planetTo).toExponential(2)}`
      );
      this.listResources(corrected);

      // print other planet's status
      this.showPlanetStatus(planetTo);
    }
  }

  async forward(days: number, subdivide = 10, wait = 5000) {
    // bind abort option
    this.term.writeln("Hit (q) to stop.");
    let abort = false;
    const aborter = (key: string) => {
      if (key == "q") {
        abort = true;
      }
    };
    this.term.on("key", aborter);

    wait = Math.min(wait, wait * (days / subdivide));
    subdivide = Math.min(subdivide, days); // don't waste time

    // perform all updates
    for (let i = 0; i < subdivide; i++) {
      // split updates into sizable portions
      let daysLeft = Math.round(((subdivide - i) / subdivide) * days);
      // provide simple feedback
      this.term.writeln(`Waiting ${daysLeft} days...`);
      let prevQol = this.qolScore;

      // calculate number of rounds (days) needed to wait for this portion
      let rounds: number;
      if (i == subdivide - 1) {
        rounds = days % subdivide;
      } else {
        rounds = Math.floor(days / subdivide);
      }
      // ensure current execution does not halt
      const pUpdate = new Promise<void>(resolve => {
        setImmediate(() => {
          for (let r = 0; r < rounds; r++) this.update();
          resolve();
        });
      });

      // execute sleep and update at the same time
      await Promise.all([pUpdate, sleep(wait / subdivide)]);

      // give ongoing status
      this.term.writeln(
        `  QOL: ${this.qolScore} ${formatDiff(this.qolScore - prevQol)}`
      );

      // abort if necessary
      if (abort) {
        break;
      }
    }

    // unbind abort option
    this.term.off("key", aborter);
  }

  /** Update the game world by one day. */
  async update() {
    // process planets
    for (let planet of Object.values(this.planets)) {
      planet.step();
      this.qolScore += planet.totalQol;
    }

    // process transfers
    for (let [namePair, res] of Object.entries(this.transfers)) {
      const { p1, p2 } = this.rgxTransfer(namePair); // already in order
      for (let name in res) {
        let reqE: number = Math.abs(setup.c.transferFactor * res[name]); // energy req to transfer amt
        let dr: number;
        if (res[name] >= 0) {
          reqE += Math.abs(setup.c.escapeFactor * res[name] * p1.escape);
          let loss = Math.min(p1.available.energy / reqE, 1); // when the transfer cannot be afforded
          reqE = Math.min(reqE, p1.available.energy);
          dr = Math.min(p1.available[name], res[name] * loss);
        } else {
          reqE += Math.abs(setup.c.escapeFactor * res[name] * p2.escape);
          let loss = Math.min(p2.available.energy / reqE, 1); // when the transfer cannot be afforded
          reqE = Math.min(reqE, p2.available.energy);
          dr = Math.max(-p2.available[name], res[name] * loss);
        }
        p1.available[name] -= dr;
        p2.available[name] += dr;
      }
    }
  }

  async transfer(resource: string, amount: number, fromP: Planet, toP: Planet) {
    this.term.writeln(
      `Setting up continual transfer of \n\r  ${formatDiff(
        amount
      )} \n\r${resource} from ${fromP.name.toUpperCase()} to ${toP.name.toUpperCase()}...`
    );
    const res = this.getTransfer(fromP, toP);
    // correct sign
    if (fromP.name <= toP.name) {
      res[resource] += amount;
    } else {
      res[resource] -= amount;
    }
  }

  /** Convert key from transfers dictionary to planets. */
  rgxTransfer(s: string): { p1: Planet; p2: Planet } {
    const match = s.match(pairRgx);
    if (match) {
      let p1s = match[1];
      let p2s = match[2];
      let p1 = this.planets[p1s];
      let p2 = this.planets[p2s];
      return { p1: p1, p2: p2 };
    } else {
      // this should never happen
      throw new Error("bad transfer pair");
    }
  }

  getTransfer(p1: Planet, p2: Planet): setup.Resources {
    const l = [p1.name, p2.name];
    let res = this.transfers[l.sort().join(" ")];
    // create a default zero-transfer if one does not exist
    if (res == undefined) {
      res = {
        water: 0,
        food: 0,
        energy: 0,
        population: 0
      };
      this.setTransfer(p1, p2, res);
    }
    return res;
  }

  setTransfer(p1: Planet, p2: Planet, t: setup.Resources): void {
    const l = [p1.name, p2.name];
    this.transfers[l.sort().join(" ")] = t;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}
