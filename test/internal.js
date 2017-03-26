/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var region  = new state.Region("region", model);
var initial = new state.PseudoState("initial", region, state.PseudoStateKind.Initial);
var target = new state.State("state", region).entry(function (message, instance) { instance.entryCount++; }).exit(function (message, instance) { instance.exitCount++; });

initial.to(target);

target.to().when(function (message) { return message === "internal"; }).effect(function (message, instance) { instance.transitionCount++; });
target.to(target).when(function (message) { return message === "external"; }).effect(function (message, instance) { instance.transitionCount++; });

var instance = new state.DictionaryInstance("instance");
instance.entryCount = 0;
instance.exitCount = 0;
instance.transitionCount = 0;

model.initialise(instance);

describe("test/internal.js", function () {
	it("Internal transitions do not trigger a state transition", function () {
		model.evaluate(instance, "internal");

		assert.equal(target, instance.getCurrent(region));
		assert.equal(1, instance.entryCount);
		assert.equal(0, instance.exitCount);
		assert.equal(1, instance.transitionCount);
	});

	it("External transitions do trigger a state transition", function () {
		model.evaluate(instance, "external");

		assert.equal(target, instance.getCurrent(region));
		assert.equal(2, instance.entryCount);
		assert.equal(1, instance.exitCount);
		assert.equal(2, instance.transitionCount);
	});
});

state.setLogger(oldLogger);