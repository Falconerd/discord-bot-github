/// <reference path="../typings/index.d.ts" />
import {MongoClient} from "mongodb";
import tap = require("tap");
import {Actions} from "../src/actions";

tap.test("#add", function(t) {
  t.ok(Actions.add("Falconerd/multiply", null), "Expect true as a user was successfully added");
  t.end();
});
