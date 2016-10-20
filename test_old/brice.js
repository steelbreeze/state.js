/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial1 = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var myComposite1 = new state.State("composite1", model);
var state3 = new state.State("state3", model);
var initial2 = new state.PseudoState("initial", myComposite1, state.PseudoStateKind.Initial);
var state1 = new state.State("state1", myComposite1);
var state2 = new state.State("state2", myComposite1);

initial1.to(myComposite1);
initial2.to(state1);
myComposite1.to(state3).when(function(c) { return c === "a";});
state1.to(state2).when(function(c) { return c === "a";});

state.validate(model);

var instance = new state.StateMachineInstance();
state.initialise(model, instance);

describe("test/brice.js", function () {
	it("Transitions should be selected depth-first", function(){
		state.evaluate(model, instance, "a");

		assert.equal(state2, instance.getCurrent(myComposite1.getDefaultRegion()));
	});
});