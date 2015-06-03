//var fsm = require("state.js"); // use this form if installed via NPM
var fsm = require("../../lib/state.com.js"); // use this form if local

// create the state machine model elements
var model = new fsm.StateMachine ("model").setLogger(console);
var initial = new fsm.PseudoState ("initial", model, fsm.PseudoStateKind.Initial);
var operational = new fsm.State ("operational", model);
var flipped = new fsm.State ("flipped", model);
var finalState = new fsm.FinalState ("final", model);
var deepHistory = new fsm.PseudoState ("history", operational, fsm.PseudoStateKind.DeepHistory);
var stopped = new fsm.State ("stopped", operational);
var active = new fsm.State ("active", operational).entry (function () { console.log("Engage head"); }).exit (function () { console.log("Disengage head"); });
var running = new fsm.State ("running", active).entry (function () { console.log("Start motor"); }).exit (function () { console.log("Stop motor"); });
var paused = new fsm.State ("paused", active);

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
var instance = new fsm.StateMachineInstance("player");

// initialse the state machine instance (also initialises the model if not already initialised explicitly or via another instance)
fsm.initialise(model, instance);

// send messages to the state machine to cause state transitions
fsm.evaluate(model, instance, "play");
fsm.evaluate(model, instance, "pause");
fsm.evaluate(model, instance, "stop");