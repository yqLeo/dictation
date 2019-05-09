/** Convert from degrees to radians. */
function rad(d: number): number {
  return ((2 * Math.PI) / 360) * d;
}

export interface Resources {
  /** Amount of water in liters. */
  water: number;
  /** Amount of edible food in kilograms. */
  food: number;
  /** Net obtainable energy in joules. */
  energy: number;

  /** Current population living on planet. */
  population: number;
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
      food: 1.878 * 7.53e9 * 365 * 10000,
      energy: 5.97e24 * 1e-6,

      population: 7.53e9
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
