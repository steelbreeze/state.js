/* global describe, it */
var assert = require("assert"),
	state = require("../lib/state.com.js");

var instance = new state.StateMachineInstance("test");
instance.path1 = 0;
instance.path2 = 0;
instance.path3 = 0;

var model = new state.StateMachine("model").setLogger(console);
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(function (message, instance) {instance.calls += 1;} );
var stateB = new state.State("stateB", model).entry(function (message, instance) {instance.calls += 2;});
var choice = new state.PseudoState("choice", model, state.PseudoStateKind.Choice);

initial.to(stateA);

stateA.to(choice).when(function(message) { return message === "choose"; });
stateA.to(stateB).else();

choice.to(stateA).effect(function (message, instance) { instance.path1++; })
choice.to(stateA).effect(function (message, instance) { instance.path2++; })
choice.to(stateA).effect(function (message, instance) { instance.path3++; })

state.initialise(model, instance);

for (var i = 0; i < 100; i++) {
	state.evaluate(model, instance, "choose");
}

state.evaluate(model, instance, "end");

describe("test/choice.js", function () {
	describe("Random behavior of choice pseudo states", function () {
		it("State transition behavior called", function () {
			assert.equal(100, instance.path1 + instance.path2 + instance.path3);
			
			assert.equal(true, instance.path1 > 0);
			assert.equal(true, instance.path2 > 0);
			assert.equal(true, instance.path3 > 0);
		});
	});	
});