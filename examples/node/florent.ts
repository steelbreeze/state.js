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
on.to(off).when((i, s) => s === "Disable");
off.to(history).when((i, s) => s === "Enable");
on.to(clean).when((i, s) => s === "DestroyInput");
off.to(clean).when((i, s) => s === "DestroyInput");
clean.to(final);
idle.to(moveItem).when((i, s) => s === "TransformInput");
moveItem.to(idle).when((i, s) => s === "ReleaseInput");
idle.to(showMoveItemPattern).when((i, s) => s === "ReleaseInput");
showMoveItemPattern.to(hideMoveItemPattern).when((i, s) => s === "ReleaseInput");
hideMoveItemPattern.to(idle);

let instance = new state.DictionaryInstance("florent");

state.setLogger(console);

model.initialise(instance);

model.evaluate(instance, "Disable");
model.evaluate(instance, "Enable");