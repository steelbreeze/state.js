/* global describe, it */
var assert = require("assert"),
	state = require("../lib/state.com.js");

state.console = console;

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

// initialise the state machine triggering the initial and IT transition
state.initialise(model, instance);

// assertions
describe("test/brice2.js", function () {
	it("Internal transitions are evaluated on completion events", function(){
		assert.equal(1, instance.i);
	});

	it("Internal transitions do not fire completion events", function(){
		assert.equal(S1, instance.getCurrent(model.defaultRegion()));
	});
});