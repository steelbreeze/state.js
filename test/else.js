/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");

var initial = new state.PseudoState("initial", model);

var choice = new state.PseudoState("choice", model, state.PseudoStateKind.Choice);
var junction = new state.PseudoState("junction", model, state.PseudoStateKind.Junction);

var finalState = new state.State("final", model);

initial.to(choice);
choice.to(junction).when(function(message, instance) { return !instance.hello }).effect(function (message, instance) {instance.hello = "hello"; });
choice.to(finalState).else();
junction.to(choice).when(function(message, instance) { return !instance.world }).effect(function (message, instance) {instance.world = "world"; });

state.validate(model);

var instance = new state.StateMachineInstance("instance");

state.initialise(model, instance);

describe("test/else.js", function () {
	it("Test should result in a completed state", function(){
		assert.equal(true, state.isComplete(model, instance));
	});

	it("Else from choice transition fired appropriately", function(){
		assert.equal("hello", instance.hello);
	});

	it("Else from junction transition fired appropriately", function(){
		assert.equal("world", instance.world);
	});
});