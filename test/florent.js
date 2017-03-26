/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var oldConsole = state.setLogger(console);

var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model);
var on = new state.State("on", model);
var onRegion = new state.Region("onRegion", on);
var off = new state.State("off", model);
var clean = new state.State("clean", model);
var final = new state.State("final", model);
var history = new state.PseudoState("history", onRegion, state.PseudoStateKind.ShallowHistory);
var idle = new state.State("idle", onRegion);
var moveItem = new state.State("moveItem", onRegion);
var showMoveItemPattern = new state.State("showMoveItemPattern", onRegion);
var hideMoveItemPattern = new state.State("hideMoveItemPattern", onRegion);

initial.to(idle);
on.to(off).when(function (s) { return s === "Disable" });
off.to(history).when(function (s) { return s === "Enable" });
on.to(clean).when(function (s) { return s === "DestroyInput" });
off.to(clean).when(function (s) { return s === "DestroyInput" });
clean.to(final);
idle.to(moveItem).when(function (s) { return s === "TransformInput" });
moveItem.to(idle).when(function (s) { return s === "ReleaseInput" });
idle.to(showMoveItemPattern).when(function (s) { return s === "ReleaseInput" });
showMoveItemPattern.to(hideMoveItemPattern).when(function (s) { return s === "ReleaseInput" });
hideMoveItemPattern.to(idle);

var instance = new state.DictionaryInstance("florent");

model.initialise(instance);

describe("test/florent.js", function () {
	it("History semantics should set the regions active state configuration to the last known state", function () {
		model.evaluate(instance, "ReleaseInput");
		model.evaluate(instance, "Disable");
		model.evaluate(instance, "Enable");

		assert.equal(showMoveItemPattern, instance.getCurrent(onRegion));

		model.evaluate(instance, "ReleaseInput");
		model.evaluate(instance, "Disable");
		model.evaluate(instance, "Enable");

		assert.equal(idle, instance.getCurrent(onRegion));
	});
});

state.setLogger(oldConsole);