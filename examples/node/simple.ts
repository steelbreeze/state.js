import * as state from "../../lib/node/state";

// send log messages, warnings and errors to the console
state.setLogger(console);

// create the state machine model elements
const model = new state.StateMachine("model");
const initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
const stateA = new state.State("stateA", model);
const stateB = new state.State("stateB", model);

// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when((instance, message) => message === "move");

// create a state machine instance
let instance = new state.JSONInstance("instance");

// initialise the model and instance
model.initialise(instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
model.evaluate(instance, "move");

console.log(instance.toJSON());