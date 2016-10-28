var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var stateA = new state.State("stateA", model).exit(function () { console.log("Exit A"); });
var stateB = new state.State("stateB", model);

initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move" });

var visitor = new state.Visitor();

var instance = new state.DictionaryInstance("unit_model");

model.initialise(instance);