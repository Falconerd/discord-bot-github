"use strict";
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var app = express_1.default();
var port = process.env.PORT || 8080;
app.use(body_parser_1.default.json());
app.post("/", function (req, res) {
    console.log(req);
});
app.listen(port, function () {
    console.log("app listening on ", port);
});
