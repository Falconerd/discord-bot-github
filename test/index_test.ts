import tap = require("tap");
import {SomeClass} from "../src/index";
tap.pass("this is fine");
tap.equal(4, SomeClass.add(1, 3));
