/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state_async");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model).exit(async function (message, instance) {instance.calls += 1;} );

initial.to(stateA);

var instance = new state.StateMachineInstance("instance");

state.validate(model);


doit();

async function doit() {
    await state.initialise(model, instance);

//describe("test/callbacks.js", function () {
//	describe("With half the model defined:", function () {
//		it("Model will not respond to events", function () {
	assert.equal(false, await state.evaluate(model, instance, "move"));
//		});
//	});

    var stateB = new state.State("stateB", model).entry(async function (message, instance) {
        instance.calls += 2;
    });

    stateA.to(stateB).when(function (message) {
        return message === "move";
    }).effect(async function (message, instance) {
        instance.calls += 4;
    });

//	describe("With the full model defined:", function () {
//		it("Model will respond to events", function () {
    assert.equal(true, await state.evaluate(model, instance, "move"));
//		});
//	});
//});
}