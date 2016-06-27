import tap = require("tap");
import {CommandHandler as ch} from "../src/command-handler";

tap.ok(new ch); // Wow, seriously?

tap.test("#isValid", function(t) {
  t.type(ch.isValid("asdf"), "boolean", "Should return a boolean");
  t.ok(ch.isValid("!dbg add user/repo"), "Should return true");
  t.notOk(ch.isValid("woobaga"), "Should return false");
  t.end();
});

tap.test("#getCommand", function(t) {
  t.type(ch.getCommand("asdf"), "undefined", "Should return undefined");
  t.type(ch.getCommand("!dbg add user/repo"), "function", "Should return a function");
  t.end();
});
