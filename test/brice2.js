/* global describe, it */
var assert = require("assert"),
	state = require("../lib/state.com.js");

state.console = console;

var instance = new state.StateMachineInstance("brice2");
instance.i = 0;

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var S1 = new state.State("s1", model);
var S2 = new state.State("s2", model);

initial.to(S1);

S1.to().when(function (message, instance) { return instance.i === 0 }).effect(function (message, instance) { instance.i++; });

S1.to(S2).when(function(message, instance) { return instance.i > 0 });

state.initialise(model, instance);

describe("test/brice2.js", function () {
	it("Internal transitions are evaluated on completion events", function(){
		assert.equal(1, instance.i);
	});

	it("Internal transitions do not fire completion events", function(){
		assert.equal(S1, instance.getCurrent(model.defaultRegion()));
	});
});