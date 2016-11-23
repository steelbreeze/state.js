// this test creates the following state machine model structure:
//
// model
// + default
//   + initial      completion transition to stateA
//   + stateA       transition "move" to stateB and therefore bStateI
//   + stateB       two transtions "local" and "exter" to bStateII
//     + default
//       + bInitial completion transition to bStateI
//       + bStateI
//       + bSTateII

/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldConsole = state.console;
state.setConsole(console);

// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model).exit(function (message, instance) { instance.stateBExitCount++; });

var bInitial = new state.PseudoState("bInitial", stateB);
var bStateI = new state.State("bStateI", stateB);
var bStateII = new state.State("bStateII", stateB);

// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move"; });

bInitial.to(bStateI);

var local = stateB.to(bStateII, state.TransitionKind.Local).when(function (message) { return message === "local"; });
var exter = stateB.to(bStateII, state.TransitionKind.External).when(function (message) { return message === "external"; });

// create a state machine instance
var instance = new state.DictionaryInstance("instance");
instance.stateBExitCount = 0;

// initialise the model and instance
model.initialise(instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
model.evaluate(instance, "move");
model.evaluate(instance, "local");

describe("Local transition tests", function () {
	it("External transition fired OK", function () {
		assert.equal(true, instance.getCurrent(stateB.defaultRegion) === bStateII);
	});
});


//	it("Local transition fired OK", function () {
//		assert.equal(true, instance.getCurrent(stateB.defaultRegion) === bStateII);
//	});

// ensure that completion transitions for orthogonal states are triggered after completion of all child regions
//	it("Completion transition fires once all regions of an orthogonal state are complete", function () {
//		assert.equal(0, instance.stateBExitCount);
//	});

//	model.evaluate(instance, "external");

//	it("External transitions do exit the source composite state", function () {
//		assert.equal(1, instance.stateBExitCount);
//	});
//});

state.setConsole(oldConsole);