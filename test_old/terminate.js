/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var stateA = new state.State("stateA", model);
var terminate = new state.PseudoState("terminate", model, state.PseudoStateKind.Terminate);

initial.to(stateA);
stateA.to(terminate).when(function(message) { return message === 1; });

state.validate(model);

var instance = new state.StateMachineInstance("instance");

state.initialise(model, instance);

describe("test/terminate.js", function () {
	describe("State machine termination", function () {
		it("Message that doesn't trigger any transitions returns false", function(){
			assert.equal(false, state.evaluate(model, instance, 2));
		});

		it("Message that does trigger a transitions returns true", function(){
			assert.equal(true, state.evaluate(model, instance, 1));
		});

		it("Messages after a terminate is reached are not evaluated", function(){
			assert.equal(false, state.evaluate(model, instance, 1));
		});

		it("Instance is marked as terminted", function(){
			assert.equal(true, instance.isTerminated);
		});
	});
});