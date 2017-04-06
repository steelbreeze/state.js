/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);
/*
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var first = new state.State("first", model).exit(function (i, ...p) { i.exitParams = p; });
var second = new state.State("second", model).entry(function (i, ...p) { i.entryParams = p; });

initial.to(first);

first.to(second).when(function (i, ...p) { return p[1] === "closer"; }).effect(function (i, ...p) { i.transParams = p; });

var instance = new state.DictionaryInstance("instance");

model.initialise(instance);

model.evaluate(instance, "move", "closer");

describe("test/params.js", function () {
	it("Multiple parameters available to exit behavior", function () {
		assert.equal(2, instance.exitParams.length);
	});

	it("Multiple parameters available to entry behavior", function () {
		assert.equal(2, instance.entryParams.length);
	});

	it("Multiple parameters available to transition behavior", function () {
		assert.equal(2, instance.transParams.length);
	});
});
*/
state.setLogger(oldLogger);