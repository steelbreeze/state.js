/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var on = new state.State("on", model);
var off = new state.State("off", model);
var clean = new state.State("clean", model);
var final = new state.State("final", model);
var history = new state.PseudoState("history", on, state.PseudoStateKind.ShallowHistory);
var idle = new state.State("idle", on);
var moveItem = new state.State("moveItem", on);
var showMoveItemPattern = new state.State("showMoveItemPattern", on);
var hideMoveItemPattern = new state.State("hideMoveItemPattern", on);

initial.to(idle);
on.to(off).when(function(s) { return s === "Disable" });
off.to(history).when(function(s) { return s === "Enable" });
on.to(clean).when(function(s) { return s === "DestroyInput" });
off.to(clean).when(function(s) { return s === "DestroyInput" });
clean.to(final);
idle.to(moveItem).when(function(s) { return s === "TransformInput" });
moveItem.to(idle).when(function(s) { return s === "ReleaseInput" });
idle.to(showMoveItemPattern).when(function(s) { return s === "ReleaseInput" });
showMoveItemPattern.to(hideMoveItemPattern).when(function(s) { return s === "ReleaseInput" });
hideMoveItemPattern.to(idle);

state.validate(model);

var instance = new state.StateMachineInstance("florent");

state.initialise(model, instance);

describe("test/florent.js", function () {
	it("History semantics should set the regions active state configuration to the last known state", function(){
		state.evaluate(model, instance, "ReleaseInput");
		state.evaluate(model, instance, "Disable");
		state.evaluate(model, instance, "Enable");

		assert.equal(showMoveItemPattern, instance.getCurrent(on.getDefaultRegion()));

		state.evaluate(model, instance, "ReleaseInput");
		state.evaluate(model, instance, "Disable");
		state.evaluate(model, instance, "Enable");

		assert.equal(idle, instance.getCurrent(on.getDefaultRegion()));
	});
});