/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("compTest");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);

var activity1 = new state.State("activity1", model);
var activity2 = new state.State("activity2", model);
var activity3 = new state.State("activity3", model);
var junction1 = new state.PseudoState("junction1", model, state.PseudoStateKind.Junction);
var junction2 = new state.PseudoState("junction2", model, state.PseudoStateKind.Junction);
var end = new state.State("end", model);

var subInitial = new state.PseudoState("subInitial", activity2, state.PseudoStateKind.Initial);
var subEnd = new state.State("subEnd", activity2);

subInitial.to(subEnd);
initial.to(activity1);
activity1.to(activity2);
activity2.to(junction1);
junction1.to(junction2).else();
junction2.to(activity3).else();
activity3.to(end);

state.validate(model);

var instance = new state.StateMachineInstance("instance");
state.initialise(model, instance);

describe("test/transitions.js", function () {
	it("Completion transitions should be triggered by state entry", function(){
		assert.equal(true, state.isComplete(model, instance));
	});
});