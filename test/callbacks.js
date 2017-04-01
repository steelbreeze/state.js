/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var instance = new state.DictionaryInstance("callbacks_instance");
instance.calls = 0;
instance.logs = 0;

var oldLogger = state.setLogger({ log: function (message) { console.log(message); instance.logs++; } });

var model = new state.StateMachine("callbacks_model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(function (instance, message) { instance.calls += 1; });
var stateB = new state.State("stateB", model).entry(function (instance, message) { instance.calls += 2; });

initial.to(stateA);
stateA.to(stateB).when(function (instance, message) { return message === "move"; }).effect(function (instance, message) { instance.calls += 4; });

model.initialise(instance);

model.evaluate(instance, "move");

describe("test/callbacks.js", function () {
	describe("User defined behavior", function () {
		it("State exit behavior called", function () {
			assert.equal(1, 1 & instance.calls);
		});

		it("State entry behavior called", function () {
			assert.equal(2, 2 & instance.calls);
		});

		it("State transition behavior called", function () {
			assert.equal(4, 4 & instance.calls);
		});
	});
});

describe("Custom logging", function () {
	it("Logger called during initialisation and state transitions", function () {
		assert.equal(9, instance.logs);
	});
});

state.setLogger(oldLogger);