import chalk from "chalk";

import * as sim from "./sim";
// circular import sort of
import * as setup from "./setup";

/** Container for resources. */
export interface Resources {
  /** General requirement for discoverability. */
  [key: string]: number;
  /** Amount of water in liters. */
  water: number;
  /** Amount of edible food in kilograms. */
  food: number;
  /** Net obtainable energy in joules. */
  energy: number;

  /** Current population living on planet. */
  population: number;
}

/** Some string helpers for giving units to resources. */
export const units: { [name: string]: string } = {
  water: "L", // liters
  food: "kg", // kilograms
  energy: "J", // joules
  population: "",

  // extra units
  angle: "_deg", // degrees
  distance: "m" // meters
};
for (const key in units) {
  units[key] = chalk.magentaBright(units[key]);
}

/** Simply return a resource object with all zeroes. */
export function zeroRes(): Resources {
  return {
    water: 0,
    food: 0,
    energy: 0,
    population: 0
  };
}

/** Invert a collection of resource values. */
export function invert(res: Resources): Resources {
  let newRes: any = {};
  for (let resName of Object.keys(res)) {
    newRes[resName] = -res[resName];
  }
  return newRes;
}

/** Facts about a planet. */
export interface PlanetaryState {
  /** Surface gravity of planet (m/s^2). */
  gravity: number;
  /** Distance from the sun in meters. */
  distance: number;
  /** Orbital period around the sun in Earth days. */
  period: number;
  /** Orbital theta position (rad). */
  theta: number;

  initResources: Resources;
}

/** Track State of Planetary Objects */
export class Planet {
  /** Physical status of the planet. */
  public info: PlanetaryState;
  /** Resources that have not been "mined" yet. */
  public raw: Resources;
  /** Resources that are currently available. */
  public available: Resources;
  /** Average change in resources per day (since last forward). */
  public rate: Resources;

  constructor(public name: string, state: PlanetaryState) {
    this.info = Object.assign({}, state);
    this.raw = Object.assign({}, state.initResources); // avoid reference
    this.available = {
      water: 1,
      food: 1,
      energy: 1,
      population: state.initResources.population // copy population
    };
    this.rate = zeroRes();
  }

  /** Avereage water per person, will error on pop=0. */
  get waterPerCapita(): number {
    return this.available.water / this.available.population;
  }

  /** Average food per person, will error on pop=0. */
  get foodPerCapita(): number {
    return this.available.food / this.available.population;
  }

  /** Average energy per person, will error on pop=0. */
  get energyPerCapita(): number {
    return this.available.energy / this.available.population;
  }

  /** Average qol per person. */
  get qolPerCapita(): number {
    if (this.available.population === 0) {
      return 0;
    } else {
      let qol = 1;
      qol *= this.waterPerCapita / setup.refStd.water;
      qol *= this.foodPerCapita / setup.refStd.food;
      qol *= this.energyPerCapita / setup.refStd.energy;
      return Math.sqrt(qol);
    }
  }

  /** Number to measure quality of life. */
  get totalQol(): number {
    return this.qolPerCapita * this.available.population;
  }

  /** X position of the planet. */
  get x(): number {
    return this.info.distance * Math.cos(this.info.theta);
  }

  /** Y position of the planet. */
  get y(): number {
    return this.info.distance * Math.sin(this.info.theta);
  }

  /** Theta of the planet, but in degrees. */
  get deg(): number {
    return this.info.theta * (180 / Math.PI);
  }

  /** Escape factor. */
  get escape(): number {
    return this.info.gravity ** 2;
  }

  /** Average productivity per capita of the planet. */
  get productivity(): number {
    return this.qolPerCapita / refPlanet.qolPerCapita;
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
      if (res === "population") {
        let growth = 1;
        growth *= this.available.population;
        let quench =
          this.waterPerCapita / setup.refStd.water - sim.thirstFactor;
        let fullness =
          this.foodPerCapita / setup.refStd.food - sim.hungerFactor;
        growth *= quench + fullness;
        this.available.population += growth * sim.gainFactor;
        this.available.population = Math.max(this.available.population, 0);
      } else {
        let dr = this.raw[res] * this.productivity * sim.gainFactor;
        dr = Math.min(dr, this.raw[res]); // cannot pull out more than exists
        this.raw[res] -= dr;
        this.available[res] += dr;
      }
    }

    // calculate consumtion
    for (let res of Object.keys(this.available)) {
      // population taken into account above
      if (res !== "population") {
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

export const refPlanet = new Planet("Reference", {
  distance: 1,
  gravity: 1,
  period: 1,
  theta: 1,
  initResources: setup.refStd
});

export type Planets = { [name: string]: Planet };
