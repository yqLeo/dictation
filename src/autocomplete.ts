import * as setup from "./setup";
import { Planet, Resources } from "./planet";

let planetNames: string[] = Object.keys(setup.planets);
let resourceNames: string[] = Object.keys(setup.refStd);
let commandNames: string[] = ["check", "transfer", "help", "forward"];

export function autocomplete(data: Array<string>): Array<string> {
    let words = data.join("").split(" "); // join all separate letters into one string
    let currentWord = words[words.length - 1];

    let wordList:string[] = [];

    if (words.length == 1) {
        // use the base commands
        wordList = commandNames; 
    } else if ((words[0] == "check" && words.length <= 3) || (words[0] == "transfer" && words.length >= 2 && words.length <= 5)){
        // first and second argument in check or third and fourth argument in transfer
        // either way we want to autocomplete a planet here
        wordList = planetNames; 
    } else if (words[0] == "transfer" && words.length == 2) {
        // first argument of transfer, autocomplete a resource
        wordList = resourceNames; 
    }

    for (let word of wordList) {
            if (word.includes(currentWord) && word.indexOf(currentWord) == 0) {
                words[words.length - 1] = word;
                break;
            }
    }
    return words.join(" ").split("");
}