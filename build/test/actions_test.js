"use strict";
var tap = require("tap");
var actions_1 = require("../src/actions");
tap.test("#add", function (t) {
    t.ok(actions_1.Actions.add(), "Expect true as a user was successfully added");
    t.end();
});
