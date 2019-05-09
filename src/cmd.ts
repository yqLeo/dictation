import { EventEmitter } from "eventemitter3";

export default class Cmd extends EventEmitter {
  parseArgs(args: Array<string>) {
    return this.emit(args[0], args.slice(1));
  }
}
