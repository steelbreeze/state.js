/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(function (message, instance) {instance.calls += 1;} );

initial.to(stateA);

var instance = new state.StateMachineInstance("instance");

state.validate(model);

state.initialise(model, instance);

//describe("test/callbacks.js", function () {
//	describe("With half the model defined:", function () {
//		it("Model will not respond to events", function () {
			assert.equal(false, state.evaluate(model, instance, "move"));
//		});
//	});

	var stateB = new state.State("stateB", model).entry(function (message, instance) {instance.calls += 2;});

	stateA.to(stateB).when(function (message) { return message === "move"; }).effect(function (message, instance) {instance.calls += 4;});

//	describe("With the full model defined:", function () {
//		it("Model will respond to events", function () {
			assert.equal(true, state.evaluate(model, instance, "move"));
//		});
//	});
//});