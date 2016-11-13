var assert = require("assert"),
	state = require("../lib/node/state");

var oldConsole = state.console;
state.setConsole(console);

var model = new state.StateMachine("unit_model");
var initial = new state.PseudoState("initial", model);
var stateA = new state.State("stateA", model).exit(function () { console.log("Exit A"); });
var stateB = new state.State("stateB", model);

initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move" });

var visitor = new state.Visitor();

var instance = new state.DictionaryInstance("unit_instance");

model.initialise(instance);

model.evaluate(instance, "move");

state.setConsole(oldConsole);