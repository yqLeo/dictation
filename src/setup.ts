import chalk from "chalk";

/** Convert from degrees to radians. */
function rad(d: number): number {
  return ((2 * Math.PI) / 360) * d;
}

export const openingText =
  chalk.cyanBright(`Welcome to Dictation!\n\r`) +
  `  A game about managing the resources of the Solar System, ` +
  `providing your citizens with the best life possible.`;

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

/** Resources consumed by one person per day. */
export const refStd: Resources = {
  water: 350,
  food: 1.878,
  energy: 1e10,
  population: 1
};

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

/** Initial data about the planets from NASA factsheet. */
export namespace planets {
  /** Example inner planet. */
  export const earth: PlanetaryState = {
    gravity: 9.8,
    distance: 149.6e6,
    period: 365.2,
    theta: 0.0,

    initResources: {
      water: 1.39e21,
      food: refStd.food * 7.53e9 * 365 * 10e3,
      energy: 5.97e24 * 1e-6,

      population: 7.53e9
    }
  };

  /** Another inner planet, */
  export const mars: PlanetaryState = {
    gravity: 3.7,
    distance: 227.9e6,
    period: 687,
    theta: Math.PI / 4,

    // mostly made up
    initResources: {
      water: 2.1e19,
      food: refStd.food * refStd.population * 365 * 1e3,
      energy: earth.initResources.energy / 1e3,

      population: 0
    }
  };

  /*
  export const mercury: PlanetaryState = {
    gravity: 3.7,
    distance: 57.9e6,
    period: 88.0,
    theta: rad(10.0),

    water: earth.water / 1e9
  };
  */
}

export interface SetupData {
  planets: {
    mercury: PlanetaryState;
    venus: PlanetaryState;
    earth: PlanetaryState;
    mars: PlanetaryState;
    jupiter: PlanetaryState;
    saturn: PlanetaryState;
    uranus: PlanetaryState;
    neptune: PlanetaryState;
  };
}
