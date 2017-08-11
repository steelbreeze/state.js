/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

state.setConsole(console);

// States
const model = new state.StateMachine("model");
const initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
const identify = new state.State("identify", model);
const exception_1 = new state.State("exception_1", model);
const model_pass = new state.State("model_pass", model);
const model_fail = new state.State("model_fail", model);

const A = new state.State("A", model);
const A_initial = new state.PseudoState("A_initial", A, state.PseudoStateKind.Initial);
const A_1 = new state.State("A_1", A);
const A_2 = new state.State("A_2", A);
const A_3 = new state.State("A_3", A);
const A_4 = new state.State("A_4", A);
const A_pass = new state.State("A_pass", A);
const A_fail = new state.State("A_fail", A);

// Transitions
initial.to(identify);
identify.to(exception_1).when((message) => message === "Continue");

exception_1.to(identify).when((message) => message === "Yes");
exception_1.to(A).when((message) => message === "No");
exception_1.to(model_fail).when((message) => message === "Unsure");

A_initial.to(A_1);

A_1.to(A_2).when((message) => message === "Yes");
A_1.to(A_fail).when((message) => /No|Unsure/.test(message));

A_2.to(A_pass).when((message) => message === "Yes");
A_2.to(A_3).when((message) => message === "No");
A_2.to(A_fail).when((message) => message === "Unsure");

A_3.to(A_pass).when((message) => message === "Yes");
A_3.to(A_4).when((message) => message === "No");
A_3.to(A_fail).when((message) => message === "Unsure");

A_4.to(A_pass).when((message) => message === "Yes");
A_4.to(A_fail).when((message) => /No|Unsure/.test(message));

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