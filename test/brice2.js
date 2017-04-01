/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

// enable completion events to be raised after internal transtions
state.setInternalTransitionsTriggerCompletion(true);

// create the state machine model
var model = new state.StateMachine("model");
var region = new state.Region("region", model);
var initial = new state.PseudoState("initial", region);
var S1 = new state.State("s1", region);
var S2 = new state.State("s2", region);

// initial transition
initial.to(S1);

// IT transition
S1.to().when(function (instance, message) { return instance.i === 0 }).effect(function (instance, message) { instance.i++; });

// T transition
S1.to(S2).when(function (instance, message) { return instance.i > 0 });

// create the state machine instance and initialise it
var instance = new state.DictionaryInstance("brice2");
instance.i = 0;

// initialise the state machine triggering the initial, IT and T transitions
model.initialise(instance);

// assertions
describe("test/brice2.js", function () {
	it("Internal transitions are evaluated on completion events", function () {
		assert.equal(1, instance.i);
	});

	it("Internal transitions fire completion events if switch set", function () {
		assert.equal(S2, instance.getCurrent(region));
	});
});

state.setLogger(oldLogger);