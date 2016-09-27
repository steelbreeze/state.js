//var fsm = require("state.js"); // use this form if installed via NPM
var state = require("../../lib/node/state"); // use this form if local

// send log messages, warnings and errors to the console
state.setConsole(console);

// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var initialA = new state.PseudoState("initialA", stateA, state.PseudoStateKind.Initial);
var stateAA = new state.State("stateAA", stateA);
var stateAB = new state.State("stateAB", stateA);

// create the state machine model transitions
initial.to(stateA);
initialA.to(stateAA);
stateA.to(stateAB, state.TransitionKind.Local).when(function(s) {return s === "move";});

// create a state machine instance
var instance = new state.StateMachineInstance("instance");

// initialise the model and instance
state.initialise(model, instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
state.evaluate(model, instance, "move");
