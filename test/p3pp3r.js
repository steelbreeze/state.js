/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var state1 = new state.State("state1", model);
var state2 = new state.State("state2", model);

var regionA = new state.Region("regionA", state1);
var initialA = new state.PseudoState("initialA", regionA, state.PseudoStateKind.Initial);
var state3 = new state.State("state3", regionA);
var state8 = new state.State("state8", regionA);

var regionB = new state.Region("regionB", state1);
var initialB = new state.PseudoState("initialB", regionB, state.PseudoStateKind.Initial);
var state4 = new state.State("state4", regionB);
var state5 = new state.State("state5", regionB);

var regionBa = new state.Region("regionBa", state4);
var initialBa = new state.PseudoState("initialBa", regionBa, state.PseudoStateKind.Initial);
var state6 = new state.State("state6", regionBa);

var regionBb = new state.Region("regionBb", state4);
var initialBb = new state.PseudoState("initialBb", regionBb, state.PseudoStateKind.Initial);
var state7 = new state.State("state7", regionBb);

initial.to(state1);
initialA.to(state3);
initialB.to(state4);
initialBa.to(state6);
initialBb.to(state7);

state3.to(state2).when(function (c) { return c === "event2"; });
state3.to(state8).when(function (c) { return c === "event1"; });
state7.to(state5).when(function (c) { return c === "event2"; });
state7.to(state5).when(function (c) { return c === "event1"; });

state.validate(model);

var instance = new state.StateMachineInstance("p3pp3r");
state.initialise(model, instance);

describe("test/p3pp3r.js", function () {
	it("All regions of orthogonal state must be exited during the external transition", function(){
		state.evaluate(model, instance, "event2");

		assert.equal(state2, instance.getCurrent(model.getDefaultRegion()));
		assert.equal(state4, instance.getCurrent(regionB));
	});
});