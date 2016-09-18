/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var target = new state.State("state", model).entry(function (message, instance) { instance.entryCount++; }).exit(function (message, instance) { instance.exitCount++; });

initial.to(target);

target.to().when(function (message) { return message === "internal"; }).effect(function (message, instance) { instance.transitionCount++; });
target.to(target).when(function (message) { return message === "external"; }).effect(function (message, instance) { instance.transitionCount++; });

var instance = new state.StateMachineInstance("instance");
instance.entryCount = 0;
instance.exitCount = 0;
instance.transitionCount = 0;

state.validate(model);

state.initialise(model, instance);

describe("test/internal.js", function () {
	it("Internal transitions do not trigger a state transition", function () {
		state.evaluate(model, instance, "internal");

		assert.equal(target, instance.getCurrent(model.getDefaultRegion()));
		assert.equal(1, instance.entryCount);
		assert.equal(0, instance.exitCount);
		assert.equal(1, instance.transitionCount);
	});

	it("External transitions do trigger a state transition", function () {
		state.evaluate(model, instance, "external");

		assert.equal(target, instance.getCurrent(model.getDefaultRegion()));
		assert.equal(2, instance.entryCount);
		assert.equal(1, instance.exitCount);
		assert.equal(2, instance.transitionCount);
	});
});