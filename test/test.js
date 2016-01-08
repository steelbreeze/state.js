var state = require("../lib/state.com.js");


state.console = console;
var instance = new state.StateMachineInstance("test");


var model = new state.StateMachine("model").entry(function(){setTimeout(function(){
    console.log(111);
    
},1000)});
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model);
// var stateC = new state.State("stateC", model)

initial.to(stateA);
stateA.to(stateB);
// stateA.to(stateB).when(function (message) { return message === "move"; }).effect(function (message, instance) { instance.calls += 4; });
// stateB.to(stateC);


// state.validate(model);

state.initialise(model, instance);
var a;
// state.evaluate(model, instance, "move");