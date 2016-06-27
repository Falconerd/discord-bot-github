import tap = require("tap");
import {CommandHandler as ch} from "../src/command-handler";

tap.ok(new ch); // Wow, seriously?

tap.test("#isValid", function(t) {
  t.type(ch.isValid("asdf"), "boolean", "Expect boolean");
  t.ok(ch.isValid("!dbg add user/repo"), "Expect true as this command is valid");
  t.notOk(ch.isValid("woobaga"), "Expect false as this command doesn't start with !dbg");
  t.notOk(ch.isValid("!dbg sad"), "Expect false as the command 'sad' does not exist");
  t.notOk(ch.isValid("!dbg add asd ffff"), "Expect false as there are too many commands/options");
  t.end();
});

tap.test("#getCommand", function(t) {
  t.type(ch.getCommand("asdf"), "undefined", "Expect undefined as 'asdf' is not a command");
  t.match(ch.getCommand("!dbg add user/repo"), "add", "Expect 'add' as this command is valid");
  t.end();
});
