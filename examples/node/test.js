var fsm = require("../../src/state.com.js"); // NOTE: change to require("state.js") if npm install used to install state.js

var model = new fsm.StateMachine("model");

var operational = new fsm.State("operational", model);

fsm.initialise(model);

console.log("Hello node");

console.log("Hello " + operational);