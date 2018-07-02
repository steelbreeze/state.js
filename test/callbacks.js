/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state_async");
var instance;
var oldConsole;

before("callbacks.js", async function () {
    instance = new state.StateMachineInstance("test");
    instance.calls = 0;
    instance.logs = 0;

    oldConsole = state.console;

    state.setConsole({
        log: function (message) {
            console.log(message);
            instance.logs++;
        }
    });

    var model = new state.StateMachine("model");
    var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
    var stateA = new state.State("stateA", model).exit(async function (message, instance) {
        instance.calls += 1;
    });
    var stateB = new state.State("stateB", model).entry(async function (message, instance) {
        instance.calls += 2;
    });

    initial.to(stateA);
    stateA.to(stateB).when(function (message) {
        return message === "move";
    }).effect(async function (message, instance) {
        instance.calls += 4;
    });

    state.validate(model);

    await state.initialise(model, instance);

    await state.evaluate(model, instance, "move");
});

describe("test/callbacks.js", async function () {
	describe("User defined behavior", async function () {
		it("State exit behavior called", function () {
			assert.equal(1, 1 & instance.calls);
		});

		it("State entry behavior called", function () {
			assert.equal(2, 2 & instance.calls);
		});

		it("State transition behavior called", function () {
			assert.equal(4, 4 & instance.calls);
		});
	});
});

describe("Custom logging", async function () {
	it("Logger called during initialisation and state transitions", function () {
		assert.equal(10, instance.logs);
	});
});

after ("callbacks.js", function () { state.setConsole(oldConsole)});