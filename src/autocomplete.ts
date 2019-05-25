import * as setup from "./setup";
import { Planet, Resources } from "./planet";

let planetNames: string[] = Object.keys(setup.planets);
let resourceNames: string[] = Object.keys(setup.refStd);
// only check and transfer, we don't need to autocomplete anything in forward
let commandNames: string[] = ["check", "transfer"];

export function autocomplete(data: Array<string>): Array<string> {
    let words = data.join("").split(" "); // join all separate letters into one string
    let currentWord = words[words.length - 1];

    if (words.length == 1) {
        // use the base commands
        for (let commandName in commandNames) {
            if (commandName.includes(currentWord)) {
                words[0] = commandName;
                break;
            }
        }
    } else if ((words[0] == "check" && words.length <= 3) || (words[0] == "transfer" && words.length >= 2 && words.length <= 5)){
        // first and second argument in check or third and fourth argument in transfer
        // either way we want to autocomplete a planet here
        for (let planetName in planetNames) {
            if (planetName.includes(currentWord)) {
                words[words.length - 1] = planetName;
                break;
            }
        } 
    } else if (words[0] == "transfer" && words.length == 2) {
        // first argument of transfer, autocomplete a resource
        for (let resourceName in resourceNames) {
            if (resourceName.includes(currentWord)) {
                words[1] = resourceName;
                break;
            }
        }
    }

    return words.join("").split("");
}