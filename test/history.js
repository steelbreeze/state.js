/* global describe, it */
var assert = require("assert"),
	state = require("../lib/node/state");

var model = new state.StateMachine( "history" );

var initial = new state.PseudoState( "initial", model, state.PseudoStateKind.Initial);
var shallow = new state.State( "shallow", model );
var deep = new state.State( "deep", model );
var end = new state.State( "final", model );

var s1 = new state.State( "s1", shallow );
var s2 = new state.State( "s2", shallow );

initial.to(shallow);
new state.PseudoState( "shallow", shallow, state.PseudoStateKind.ShallowHistory).to( s1 );
s1.to(s2).when(function(c) { return c === "move";} );
shallow.to(deep).when(function(c) { return c === "go deep";} );
deep.to(shallow).when(function(c) { return c === "go shallow";} );
s2.to(end).when(function(c) { return c === "end"; } );

state.validate(model);

var instance = new state.StateMachineInstance("instance");

state.initialise(model, instance);

state.evaluate (model, instance, "move");
state.evaluate (model, instance, "go deep");
state.evaluate (model, instance, "go shallow");
state.evaluate (model, instance, "end");

describe("test/history.js", function () {
	it("Test should result in a completed state", function(){
		assert.equal(true, state.isComplete(model, instance));
	});
});