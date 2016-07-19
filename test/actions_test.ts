/// <reference path="../typings/index.d.ts" />
import {MongoClient} from "mongodb";
import tap = require("tap");
import {Actions} from "../src/actions";

tap.test("#add", function (t) {
  t.ok(Actions.add("Falconerd/multiply", null), "Expect true as sub was added");
  t.end();
});

tap.test("#remove", function(t) {
  t.ok(Actions.remove("Falconerd/multiply", null), "Expect true as sub was removed");
  t.end();
});

tap.test("#token", function(t) {
  t.ok(Actions.token("token", null), "Expect true as token was added");
  t.end();
});
