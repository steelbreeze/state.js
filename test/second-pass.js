/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state_async");

state.setConsole(console);

// States
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var identify = new state.State("identify", model);
var exception_1 = new state.State("exception_1", model);
var model_pass = new state.State("model_pass", model);
var model_fail = new state.State("model_fail", model);

var A = new state.State("A", model);
var A_initial = new state.PseudoState("A_initial", A, state.PseudoStateKind.Initial);
var A_1 = new state.State("A_1", A);
var A_2 = new state.State("A_2", A);
var A_3 = new state.State("A_3", A);
var A_4 = new state.State("A_4", A);
var A_pass = new state.State("A_pass", A);
var A_fail = new state.State("A_fail", A);

// Transitions
initial.to(identify);
identify.to(exception_1).when(function (message) { return message === "Continue"; });

exception_1.to(identify).when(function (message) { return message === "Yes"; });
exception_1.to(A).when(function (message) { return message === "No"; });
exception_1.to(model_fail).when(function (message) { return message === "Unsure"; });

A_initial.to(A_1);

A_1.to(A_2).when(function (message) { return message === "Yes"; });
A_1.to(A_fail).when(function (message) { return /No|Unsure/.test(message); });

A_2.to(A_pass).when(function (message) { return message === "Yes"; });
A_2.to(A_3).when(function (message) { return message === "No"; });
A_2.to(A_fail).when(function (message) { return message === "Unsure"; });

A_3.to(A_pass).when(function (message) { return message === "Yes"; });
A_3.to(A_4).when(function (message) { return message === "No"; });
A_3.to(A_fail).when(function (message) { return message === "Unsure"; });

A_4.to(A_pass).when(function (message) { return message === "Yes"; });
A_4.to(A_fail).when(function (message) { return /No|Unsure/.test(message); });

A_pass.to(model_pass);
A_fail.to(model_fail);

model_pass.to(identify);
model_fail.to(identify);

var instance = new state.StateMachineInstance("second-pass");

state.initialise(model, instance);

// Transitions
state.evaluate(model, instance, "Continue");
state.evaluate(model, instance, "No", "first time");
state.evaluate(model, instance, "Yes");
state.evaluate(model, instance, "Yes");
state.evaluate(model, instance, "Continue");
state.evaluate(model, instance, "No", "second time");