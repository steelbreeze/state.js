/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine( "model" );

var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var ortho = new state.State("ortho", model);
var simple = new state.State("simple", model);
var final = new state.State("final", model);

var r1 = new state.Region("r1", ortho);
var r2 = new state.Region("r2", ortho);

var i1 = new state.PseudoState("initial", r1, state.PseudoStateKind.ShallowHistory);
var i2 = new state.PseudoState("initial", r2, state.PseudoStateKind.ShallowHistory);

var s1 = new state.State("s1", r1);
var s2 = new state.State("s2", r2);

var f1 = new state.State("f1", r1);
var f2 = new state.State("f2", r2);

initial.to(ortho);

i1.to(s1);
i2.to(s2);

ortho.to(final); // This should happen once all regions in ortho are complete?

s1.to(f1).when(function(c) {
    return c === "complete1";
});

s2.to(f2).when(function(c) {
    return c === "complete2";
});

ortho.to(simple).when(function(c) {
    return c === "jump";
});

simple.to(ortho).when(function(c) {
    return c === "back";
});

state.validate(model);

var instance = new state.StateMachineInstance("instance");
state.initialise(model, instance);

console.log("simple.isSimple = " + simple.isSimple());
console.log("simple.isComposite = " + simple.isComposite());
console.log("simple.isOrthogonal = " + simple.isOrthogonal());

console.log("model.isSimple = " + model.isSimple());
console.log("model.isComposite = " + model.isComposite());
console.log("model.isOrthogonal = " + model.isOrthogonal());

console.log("ortho.isSimple = " + ortho.isSimple());
console.log("ortho.isComposite = " + ortho.isComposite());
console.log("ortho.isOrthogonal = " + ortho.isOrthogonal());


describe("test/muximise.js", function () {
	describe("State type tests", function () {
		// ensure only simple states return true for isSimple
		it("simple state isSimple", function () {
			assert(simple.isSimple());
			assert(!model.isSimple());
			assert(!ortho.isSimple());
		});

		// ensure only composite states return true for isComposite
		it("State.isComposite", function () {
			assert(!simple.isComposite());
			assert(model.isComposite());
			assert(ortho.isComposite());
		});

		// ensure only orthogonal states return true for isOrthogonal
		it("State.isOrthogonal", function () {
			assert(!simple.isOrthogonal());
			assert(!model.isOrthogonal());
			assert(ortho.isOrthogonal());
		});
	});

	describe("Orthogonal state completion", function () {
		// ensure that completion transitions for orthogonal states are triggered after completion of all child regions
		it("Completion transition fires once all regions of an orthogonal state are complete", function(){
			state.evaluate(model, instance, "complete1");
			state.evaluate(model, instance, "complete2");

			assert.equal(true, state.isComplete(model, instance));
		});
	});
});