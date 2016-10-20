/* global describe, it */
var assert = require("assert"),
    state = require("../lib/node/state"); // use this form if local

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

stateB.to(bStateII, state.TransitionKind.Local).when(function (message) { return message === "local"; });
stateB.to(bStateII, state.TransitionKind.External).when(function (message) { return message === "external"; });

state.validate(model);

// create a state machine instance
var instance = new state.StateMachineInstance("instance");
instance.stateBExitCount = 0;

// initialise the model and instance
state.initialise(model, instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
state.evaluate(model, instance, "move");

describe("test/local.js", function () {
	it("Local transitions do not exit the source composite state", function () {
		state.evaluate(model, instance, "local");

		assert.equal(0, instance.stateBExitCount);
	});

	it("External transitions do exit the source composite state", function () {
		state.evaluate(model, instance, "external");

		assert.equal(1, instance.stateBExitCount);
	});
});