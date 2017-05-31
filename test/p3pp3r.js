/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var region = new state.Region("region", model);
var initial = new state.PseudoState("initial", region, state.PseudoStateKind.Initial);
var state1 = new state.State("state1", region);
var state2 = new state.State("state2", region);

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

state3.to(state2).when(function (i, c) { return c === "event2"; });
state3.to(state8).when(function (i, c) { return c === "event1"; });
state7.to(state5).when(function (i, c) { return c === "event2"; });
state7.to(state5).when(function (i, c) { return c === "event1"; });

var instance = new state.JSONInstance("p3pp3r");
model.initialise(instance);

describe("test/p3pp3r.js", function () {
	it("All regions of orthogonal state must be exited during the external transition", function () {
		model.evaluate(instance, "event2");

		assert.equal(state2, instance.getCurrent(region));
		assert.equal(state4, instance.getCurrent(regionB));
	});
});

state.setLogger(oldLogger);