"use strict";
var state = require("../../lib/node/state");
// send log messages, warnings and errors to the console
state.setConsole(console);
// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var operational = new state.State("operational", model);
var flipped = new state.State("flipped", model);
var finalState = new state.State("final", model);
var deepHistory = new state.PseudoState("history", operational, state.PseudoStateKind.DeepHistory);
var stopped = new state.State("stopped", operational);
var active = new state.State("active", operational).entry(function () { return console.log("Engage head"); }).exit(function () { return console.log("Disengage head"); });
var running = new state.State("running", active).entry(function () { return console.log("Start motor"); }).exit(function () { return console.log("Stop motor"); });
var paused = new state.State("paused", active);
// create the state machine model transitions
initial.to(operational);
deepHistory.to(stopped);
stopped.to(running).when(function (s) { return s === "play"; });
active.to(stopped).when(function (s) { return s === "stop"; });
running.to(paused).when(function (s) { return s === "pause"; });
paused.to(running).when(function (s) { return s === "play"; });
operational.to(flipped).when(function (s) { return s === "flip"; });
flipped.to(operational).when(function (s) { return s === "flip"; });
operational.to(finalState).when(function (s) { return s === "off"; });
// create a new state machine instance (this stores the active state configuration, allowing many instances to work with a single model)
var instance = new state.JSONInstance("player");
// initialse the state machine instance (also initialises the model if not already initialised explicitly or via another instance)
state.initialise(model, instance);
// send messages to the state machine to cause state transitions
state.evaluate(model, instance, "play");
state.evaluate(model, instance, "pause");
state.evaluate(model, instance, "stop");
console.log(instance.toJSON());
