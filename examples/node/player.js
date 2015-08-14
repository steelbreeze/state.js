//var fsm = require("state.js"); // use this form if installed via NPM
var state = require("../../lib/state.com.js"); // use this form if local

state.logger = console;

// create the state machine model elements
var model = new state.StateMachine ("model");
var initial = new state.PseudoState ("initial", model, state.PseudoStateKind.Initial);
var operational = new state.State ("operational", model);
var flipped = new state.State ("flipped", model);
var finalState = new state.FinalState ("final", model);
var deepHistory = new state.PseudoState ("history", operational, state.PseudoStateKind.DeepHistory);
var stopped = new state.State ("stopped", operational);
var active = new state.State ("active", operational).entry (function () { console.log("Engage head"); }).exit (function () { console.log("Disengage head"); });
var running = new state.State ("running", active).entry (function () { console.log("Start motor"); }).exit (function () { console.log("Stop motor"); });
var paused = new state.State ("paused", active);

// create the state machine model transitions
initial.to (operational);
deepHistory.to (stopped);
stopped.to (running).when (function (s) { return s === "play"; });
active.to (stopped).when (function (s) { return s === "stop"; });
running.to (paused).when (function (s) { return s === "pause"; });
paused.to (running).when (function (s) { return s === "play"; });
operational.to (flipped).when (function (s) { return s === "flip"; });
flipped.to (operational).when (function (s) { return s === "flip"; });
operational.to (finalState).when (function (s) { return s === "off"; });

// create a new state machine instance (this stores the active state configuration, allowing many instances to work with a single model)
var instance = new state.StateMachineInstance("player");

// initialse the state machine instance (also initialises the model if not already initialised explicitly or via another instance)
state.initialise(model, instance);

// send messages to the state machine to cause state transitions
state.evaluate(model, instance, "play");
state.evaluate(model, instance, "pause");
state.evaluate(model, instance, "stop");