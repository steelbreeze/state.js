"use strict";
exports.__esModule = true;
var delegate_1 = require("../lib/node/delegate");
function world(s) {
    console.log(s + " world");
}
var one = delegate_1.create(function (s) { return console.log(s + " Hello world"); });
var two = delegate_1.create(function (s) { return console.log(s + " Hello"); }, world);
one("A");
two("B");
console.log(delegate_1.create(one, two, delegate_1.create())("C"));
