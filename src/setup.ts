import { Resources, PlanetaryState } from "./planet";

/** Convert from degrees to radians. */
function rad(d: number): number {
  return ((2 * Math.PI) / 360) * d;
}

function perYearToDay(x: number): number {
  return (1 + x) ** (1 / 365) - 1;
}

/** Resources consumed by one person per day. */
export const refStd: Resources = {
  water: 350,
  food: 1.878,
  energy: 1e10,
  population: 1
};

export const generation = 365 * 25;

function perGenToDay(x: number): number {
  return (1 + x) ** (1 / generation) - 1;
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

export const earthAvailable: Resources = {} as any;
for (let name of Object.keys(planets.earth.initResources)) {
  earthAvailable[name] = refStd[name] * planets.earth.initResources.population;
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
