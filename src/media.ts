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
    //Five level of situation related to "food/population" index
    "Hunger spreads the whole PLANET and the last living creature just died."
    "The population in the PLANET is decaying massively as they fight for food."
    "PLANET has enough food for people to live."
    "There are abundant food in the PLANET and people are thriving"
    "Too much food is produced in PLANET and people start wasting food."
    //Five level of situation related to "happiness" index
    "The world war in PLANET caused countless homeless and disabled people. The end of day in PLANET is approaching."
    "Robbery and Stealing is everywhere in PLANET, people no longer trust others."
    "People are having normal life in PLANET."
    "People in PLANET are happy with their living standard. The world is full of happiness and laughters"
    "PLANET is now the happiest planet."
    //Three level of situation related to "energy" index
    "The technology in PLANET stopped developing."
    "The technology in PLANET is slowly developing. Twenty years per significant innovation."
    "The technology in PLANET is exploding. Signiciant innovation every year."
    //Five level of situation related to "population" index
    "The PLANET has nothing but ashes."
    "The last few survivors are struggling on PLANET."
    "The life in PLANET is sustaining despite there are not much population."
    "Some developed cities in PLANET is full of people. People are socialized and third industry is bombing."
    "The PLANET is full of people, they barely have private spaces. Chaos is everywhere."
  }
};
