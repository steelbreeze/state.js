// State v4 finite state machine library
// http://www.steelbreeze.net/state.js
// Copyright (c) 2014 Steelbreeze Limited
// Licensed under MIT and GPL v3 licences
/// <reference path="../src/state.ts" />
var player = new FSM.StateMachine("player");

var initial = new FSM.PseudoState("initial", player, FSM.PseudoStateKind.Initial);
var operational = new FSM.State("operational", player);
var flipped = new FSM.State("flipped", player);
var finalState = new FSM.FinalState("final", player);

var deepHistory = new FSM.PseudoState("history", operational, FSM.PseudoStateKind.DeepHistory);
var stopped = new FSM.State("stopped", operational);
var active = new FSM.State("active", operational);

var running = new FSM.State("running", active);
var paused = new FSM.State("paused", active);

var initialise = initial.to(operational); // NOTE: the example web page will add a transition effect
deepHistory.to(stopped);
stopped.to(running).when<String>((command: String): Boolean => { return command === "play"; });
active.to(stopped).when<String>((command: String): Boolean => { return command === "stop"; });
running.to(paused).when<String>((command: String): Boolean => { return command === "pause"; });
paused.to(running).when<String>((command: String): Boolean => { return command === "play"; });
operational.to(flipped).when<string>((command: string): Boolean => { return command === "flip"; });
flipped.to(operational).when<string>((command: string): Boolean => { return command === "flip"; });
operational.to(finalState).when<String>((command: String): Boolean => { return command === "off"; });