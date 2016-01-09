var state = require("../lib/state.com.js");


state.console = console;
var instance = new state.StateMachineInstance("test");

//async entry action
var model = new state.StateMachine("model").entry(function(message, instance,history,cb){setTimeout(function(){
    console.log(111);
    cb(null,1);//if error occur, use 
                //cb("entry model error",1);
},1000)});
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model).entry(function(message, instance,history,cb){cb(null,1)});


initial.to(stateA);
stateA.to(stateB);

state.initialise(model, instance);