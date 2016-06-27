import {Actions} from "./actions";

export class CommandHandler {
  static commands = {
    "add": true,
    "remove": true,
    "token": true,
    "help": true,
  };

  static isValid(input: string): boolean {
    const command: Array<string> = input.split(" ");
    if (command[0] !== "!dbg") return false;
    if (!CommandHandler.commands[command[1]]) return false;
    if (command.length > 3) return false;
    return true;
  }

  static getCommand(input: string): Function {
    const command: Array<string> = input.split(" ");
    return Actions[command[1]];
  }
}
