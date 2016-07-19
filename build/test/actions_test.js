"use strict";
var tap = require("tap");
var actions_1 = require("../src/actions");
tap.test("#add", function (t) {
    t.ok(actions_1.Actions.add("Falconerd/multiply", null), "Expect true as sub was added");
    t.end();
});
tap.test("#remove", function (t) {
    t.ok(actions_1.Actions.remove("Falconerd/multiply", null), "Expect true as sub was removed");
    t.end();
});
tap.test("#token", function (t) {
    t.ok(actions_1.Actions.token("token", null), "Expect true as token was added");
    t.end();
});
