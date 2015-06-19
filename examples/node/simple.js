//var fsm = require("state.js"); // use this form if installed via NPM
var state = require("../../lib/state.com.js"); // use this form if local

// create the state machine model elements
var model = new state.StateMachine("model").setLogger(console);
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var junction = new state.PseudoState("junction", model, state.PseudoStateKind.Junction);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model);

// create the state machine model transitions
initial.to(stateA);
stateA.to(junction).when(function (message) { return message === "move"; });
junction.to(stateB).else();

// create a state machine instance
var instance = new state.StateMachineInstance("test");

// initialise the model and instance
state.initialise(model, instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
state.evaluate(model, instance, "move");