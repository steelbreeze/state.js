import * as state from "../../lib/state.com";

var model = new state.StateMachine("model");

var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
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
on.to(off).when(s => s === "Disable");
off.to(history).when(s => s === "Enable");
on.to(clean).when(s => s === "DestroyInput");
off.to(clean).when(s => s === "DestroyInput");
clean.to(final);
idle.to(moveItem).when(s => s === "TransformInput");
moveItem.to(idle).when(s => s === "ReleaseInput");
idle.to(showMoveItemPattern).when(s => s === "ReleaseInput");
showMoveItemPattern.to(hideMoveItemPattern).when(s => s === "ReleaseInput");
hideMoveItemPattern.to(idle);

state.validate(model);

var instance = new state.StateMachineInstance("florent");

state.console = console;

state.initialise(model, instance);

state.evaluate(model, instance, "Disable");
state.evaluate(model, instance, "Enable");