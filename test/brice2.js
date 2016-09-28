/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

// enable completion events to be raised after internal transtions
state.setInternalTransitionsTriggerCompletion(true);

// create the state machine model
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var S1 = new state.State("s1", model);
var S2 = new state.State("s2", model);

// initial transition
initial.to(S1);

// IT transition
S1.to().when(function (message, instance) { return instance.i === 0 }).effect(function (message, instance) { instance.i++; });

// T transition
S1.to(S2).when(function(message, instance) { return instance.i > 0 });

// create the state machine instance and initialise it
var instance = new state.StateMachineInstance("brice2");
instance.i = 0;

// initialise the state machine triggering the initial, IT and T transitions
state.initialise(model, instance);

// assertions
describe("test/brice2.js", function () {
	it("Internal transitions are evaluated on completion events", function(){
		assert.equal(1, instance.i);
	});

	it("Internal transitions fire completion events if switch set", function(){
		assert.equal(S2, instance.getCurrent(model.getDefaultRegion()));
	});
});