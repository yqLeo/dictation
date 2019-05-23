import chalk from "chalk";

import { ask } from "./text";

export default {
  title: chalk`{rgb(255,0,255)  Dictation }`,
  introduction:
    "  A game about managing the resources of the Solar System, providing your citizens with the best life possible.",
  help: chalk`Help: {red TODO}`,

  // dialogs that show up when various conditions are met
  dialog: {
    good: [ask<{ planet: string }>("^PLANET is thriving!")]
  }
};
