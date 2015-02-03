/* State v4 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */

/// <reference path="../src/state-5.0.0.d.ts" />

var player = new state.StateMachine("player");

var initial = new state.PseudoState("initial", player, state.PseudoStateKind.Initial);
var operational = new state.State("operational", player);
var flipped = new state.State("flipped", player);
var finalState = new state.FinalState("final", player);

var deepHistory = new state.PseudoState("history", operational, state.PseudoStateKind.DeepHistory);
var stopped = new state.State("stopped", operational);
var active = new state.State("active", operational);

var running = new state.State("running", active);
var paused = new state.State("paused", active);

initial.to(operational); // NOTE: the example web page will add a transition effect
deepHistory.to(stopped);
stopped.to(running).when((s: string): boolean => { return s === "play"; });
active.to(stopped).when((s: string ): boolean => { return s === "stop"; });
running.to(paused).when((s: string): boolean => { return s === "pause"; });
paused.to(running).when((s: string): boolean => { return s === "play"; });
operational.to(flipped).when((s: string): boolean => { return s === "flip"; });
flipped.to(operational).when((s: string): boolean => { return s === "flip"; });
operational.to(finalState).when((s: string): boolean => { return s === "off"; });