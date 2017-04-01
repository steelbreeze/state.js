/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var initial1 = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var myComposite1 = new state.State("composite1", model);
var region1 = new state.Region("region1", myComposite1);
var state3 = new state.State("state3", model);
var initial2 = new state.PseudoState("initial", region1, state.PseudoStateKind.Initial);
var state1 = new state.State("state1", region1);
var state2 = new state.State("state2", region1);

initial1.to(myComposite1);
initial2.to(state1);
myComposite1.to(state3).when(function (i, c) { return c === "a"; });
state1.to(state2).when(function (i, c) { return c === "a"; });

var instance = new state.DictionaryInstance();
model.initialise(instance);

describe("test/brice.js", function () {
	it("Transitions should be selected depth-first", function () {
		model.evaluate(instance, "a");

		assert.equal(state2, instance.getCurrent(region1));
	});
});

state.setLogger(oldLogger);