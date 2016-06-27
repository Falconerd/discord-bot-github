"use strict";
var tap = require("tap");
var index_1 = require("../src/index");
tap.pass("this is fine");
tap.equal(4, index_1.SomeClass.add(1, 3));
