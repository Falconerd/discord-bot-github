export class CommandChecker {
  static commands = {
    "add": true,
    "remove": true,
    "token": true,
    "help": true,
  };

  static isValid(input: string): boolean {
    const command: Array<string> = input.split(" ");
    if (command[0] !== "!dbg") return false;
    if (!CommandChecker.commands[command[1]]) return false;
    if (command.length > 3) return false;
    return true;
  }

  static getCommand(input: string): any {
    if (CommandChecker.isValid(input)) {
      return { command: input.split(" ")[1], argument: input.split(" ")[2] };
    } else {
      return undefined;
    }
  }
}
