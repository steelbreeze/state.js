/* State v4 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */

/// <reference path="../src/state-5.0.1.d.ts" />

var player = new fsm.StateMachine("player");

var initial = new fsm.PseudoState("initial", player, fsm.PseudoStateKind.Initial);
var operational = new fsm.State("operational", player);
var flipped = new fsm.State("flipped", player);
var finalState = new fsm.FinalState("final", player);

var deepHistory = new fsm.PseudoState("history", operational, fsm.PseudoStateKind.DeepHistory);
var stopped = new fsm.State("stopped", operational);
var active = new fsm.State("active", operational);

var running = new fsm.State("running", active);
var paused = new fsm.State("paused", active);

initial.to(operational);
deepHistory.to(stopped);
stopped.to(running).when((s: string): boolean => { return s === "play"; });
active.to(stopped).when((s: string ): boolean => { return s === "stop"; });
running.to(paused).when((s: string): boolean => { return s === "pause"; });
paused.to(running).when((s: string): boolean => { return s === "play"; });
operational.to(flipped).when((s: string): boolean => { return s === "flip"; });
flipped.to(operational).when((s: string): boolean => { return s === "flip"; });
operational.to(finalState).when((s: string): boolean => { return s === "off"; });