// State v4 finite state machine library
// http://www.steelbreeze.net/state.js
// Copyright (c) 2014 Steelbreeze Limited
// Licensed under MIT and GPL v3 licences
/// <reference path="../src/state.ts" />

function engageHead() {
    console.log("- engaging head");
}

function disengageHead() {
    console.log("- disengaging head");
}

function startMotor() {
    console.log("- starting motor");
}

function stopMotor() {
    console.log("- stopping motor");
}

var model = new FSM.StateMachine("player");
var region1 = new FSM.Region("default", model);

var initial = new FSM.PseudoState("initial", region1, FSM.PseudoStateKind.Initial);
var operational = new FSM.State("operational", region1);
var flipped = new FSM.State("flipped", region1);
var final = new FSM.FinalState("final", region1);

var region2 = new FSM.Region("default", operational);
var dhistory = new FSM.PseudoState("history", region2, FSM.PseudoStateKind.DeepHistory);
var stopped = new FSM.State("stopped", region2);
var active = new FSM.State("active", region2).entry(engageHead).exit(disengageHead);

var region3 = new FSM.Region("default", active);
var running = new FSM.State("running", region3).entry(startMotor).exit(stopMotor);
var paused = new FSM.State("paused", region3);

initial.To(operational).effect(disengageHead).effect(stopMotor);
dhistory.To(stopped);
stopped.To(running).when<String>((command: String): Boolean => { return command === "play"; });
active.To(stopped).when<String>((command: String): Boolean => { return command === "stop"; });
running.To(paused).when<String>((command: String): Boolean => { return command === "pause"; });
paused.To(running).when<String>((command: String): Boolean => { return command === "play"; });
operational.To(flipped).when<string>((command: string): Boolean => { return command === "flip"; });
flipped.To(operational).when<string>((command: string): Boolean => { return command === "flip"; });
operational.To(final).when<String>((command: String): Boolean => { return command === "off"; });

var context = new FSM.DictionaryContext("example");

model.initialise(context);

model.evaluate("play", context);
model.evaluate("pause", context);
model.evaluate("flip", context);
model.evaluate("flip", context);
