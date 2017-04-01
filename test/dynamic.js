/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(function (instance, message) { instance.calls += 1; });

initial.to(stateA);

var instance = new state.DictionaryInstance("instance");


model.initialise(instance);

// TODO: fix up unit tests
describe("test/callbacks.js", function () {
	//	describe("With half the model defined:", function () {
	it("Model will not respond to events", function () {
		assert.equal(false, model.evaluate(instance, "move"));
	});
	//	});

	var stateB = new state.State("stateB", model).entry(function (instance, message) { instance.calls += 2; });

	stateA.to(stateB).when(function (instance, message) { return message === "move"; }).effect(function (instance, message) { instance.calls += 4; });

	//	describe("With the full model defined:", function () {
	//		it("Model will respond to events", function () {
	assert.equal(true, model.evaluate(instance, "move"));
	//		});
	//	});
});

state.setLogger(oldLogger);