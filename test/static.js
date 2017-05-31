/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldLogger = state.setLogger(console);

var model = new state.StateMachine("model");
var region = new state.Region("region", model);
var initial = new state.PseudoState("initial", region, state.PseudoStateKind.Initial);
var junction1 = new state.PseudoState("junction1", region, state.PseudoStateKind.Junction);
var junction2 = new state.PseudoState("junction2", region, state.PseudoStateKind.Junction);

var pass = new state.State("success", region);
var fail = new state.State("error", region);

initial.to(junction1);

junction1.to(junction2).when(function (instance) { return instance.counter === 0; }).effect(function (instance) { return instance.counter++; });
junction1.to(fail).else();
junction2.to(pass).when(function (instance) { return instance.counter === 0; }).effect(function (instance) { return instance.counter++; });
junction2.to(fail).else();

var instance = new state.JSONInstance();
instance.counter = 0;

describe("test/static.js", function () {
	it("Junction transitions implement a static conditional branch", function () {
		model.initialise(instance);

		assert.equal(pass, instance.getCurrent(region));
	});

	it("Junction transitions call all transition behavior after guards have been tested", function () {

		assert.equal(2, instance.counter);
	});
});

state.setLogger(oldLogger);