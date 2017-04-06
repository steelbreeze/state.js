/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var first = new state.State("first", model).exit(function (i, first, second) { i.exitParams = first && second ? 2 : 0; });
var second = new state.State("second", model).entry(function (i, first, second) { i.entryParams = first && second ? 2 : 0; });

initial.to(first);

first.to(second).when(function (i, first, second) { return second === "closer"; }).effect(function (i, first, second) { i.transParams = first && second ? 2 : 0; });

var instance = new state.DictionaryInstance("instance");

model.initialise(instance);

model.evaluate(instance, "move", "closer");

describe("test/params.js", function () {
	it("Multiple parameters available to exit behavior", function () {
		assert.equal(2, instance.exitParams);
	});

	it("Multiple parameters available to entry behavior", function () {
		assert.equal(2, instance.entryParams);
	});

	it("Multiple parameters available to transition behavior", function () {
		assert.equal(2, instance.transParams);
	});
});

state.setLogger(oldLogger);