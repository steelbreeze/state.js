/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldConsole = state.console;
state.setConsole(console);

// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model).exit(function (message, instance) { instance.stateBExitCount++; });

var bInitial = new state.PseudoState("bInitial", stateB);
var bStateI = new state.State("bStateI", stateB);
var bStateII = new state.State("bStateII", stateB);

// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move"; });

bInitial.to(bStateI);

var local = stateB.to(bStateII, state.TransitionKind.Local).when(function (message) { return message === "local"; });
var exter = stateB.to(bStateII, state.TransitionKind.External).when(function (message) { return message === "external"; });

console.log("LOCAL is " + state.TransitionKind[local.kind]);
console.log("EXTER is " + state.TransitionKind[exter.kind]);

// create a state machine instance
var instance = new state.DictionaryInstance("instance");
instance.stateBExitCount = 0;

// initialise the model and instance
model.initialise(instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
model.evaluate(instance, "move");

describe("Orthogonal state completion", function () {
	model.evaluate(instance, "local");

	// ensure that completion transitions for orthogonal states are triggered after completion of all child regions
	it("Completion transition fires once all regions of an orthogonal state are complete", function () {
		assert.equal(0, instance.stateBExitCount);
	});

	model.evaluate(instance, "external");

	it("External transitions do exit the source composite state", function () {
		assert.equal(1, instance.stateBExitCount);
	});
});

state.setConsole(oldConsole);