import * as state from "../../lib/node/state";

const model = new state.StateMachine("model");

const initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
const on = new state.State("on", model);
const off = new state.State("off", model);
const clean = new state.State("clean", model);
const final = new state.State("final", model);
const history = new state.PseudoState("history", on, state.PseudoStateKind.ShallowHistory);
const idle = new state.State("idle", on);
const moveItem = new state.State("moveItem", on);
const showMoveItemPattern = new state.State("showMoveItemPattern", on);
const hideMoveItemPattern = new state.State("hideMoveItemPattern", on);

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

let instance = new state.StateMachineInstance("florent");

state.setConsole(console);

state.initialise(model, instance);

state.evaluate(model, instance, "Disable");
state.evaluate(model, instance, "Enable");