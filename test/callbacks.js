/* global describe, it */
var assert = require("assert"),
	state = require("../lib/state.com.js");

var instance = new state.StateMachineInstance("test");
instance.calls = 0;
instance.logs = 0;

//state.logTo = ({ log: function (text) { instance.logs++; } })
state.warnTo = console;

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(function (message, instance) { instance.calls += 1; });
var stateB = new state.State("stateB", model).entry(function (message, instance) { instance.calls += 2; });

initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move"; }).effect(function (message, instance) { instance.calls += 4; });

state.validate(model);

state.initialise(model, instance);

state.evaluate(model, instance, "move");

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

// TODO: reinstate test
//	describe("Custom logging", function () {
//		it("Logger called during initialisation and state transitions", function () {
//			assert.equal(10, instance.logs);
//		});
//	});
