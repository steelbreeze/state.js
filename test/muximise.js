/* global describe, it */
var assert = require("assert"),
	state = require("../lib/state.com.js");
	
var model = new state.StateMachine( "model" );

var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var ortho = new state.State("ortho", model);
var simple = new state.State("simple", model);
var final = new state.FinalState("final", model);

var r1 = new state.Region("r1", ortho);
var r2 = new state.Region("r2", ortho);

var i1 = new state.PseudoState("initial", r1, state.PseudoStateKind.ShallowHistory);
var i2 = new state.PseudoState("initial", r2, state.PseudoStateKind.ShallowHistory);

var s1 = new state.State("s1", r1);
var s2 = new state.State("s2", r2);

var f1 = new state.FinalState("f1", r1);
var f2 = new state.FinalState("f2", r2);

initial.to(ortho);

i1.to(s1);
i2.to(s2);

ortho.to(final); // This should happen once all regions in ortho are complete?

s1.to(f1).when(function(c) {
    return c === "complete1";
});

s2.to(f2).when(function(c) {
    return c === "complete2";
});

ortho.to(simple).when(function(c) {
    return c === "jump";
});

simple.to(ortho).when(function(c) {
    return c === "back";
});

var instance = new state.StateMachineInstance("instance");				
state.initialise(model, instance);

describe("Completion transitions from orthogonal states", function () {	
	it("Test should result in a completed state", function(){
		state.evaluate(model, instance, "complete1");
		state.evaluate(model, instance, "complete2");

		state.isComplete(model, instance);
	});
});
