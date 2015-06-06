Version 5.3.1, stable.

state.js is a JavaScript implementation of UML hierarchical finite state machines.

## Getting started

The API is split into:

1. Classes that represent a state machine model (State, PseudoState, Transition, etc.)
2. An interface and implementation of *active state configuration*; this allows multiple concurrent instances of the same state machine model
3. A set of functions that provide the state machine runtime

The API is bound to a global object of you choosing through CommonJS, or our own secret sauce for web browsers. 

### Node
#### 1. Install state.js in your project:

```sh
$ npm install state.js
```

#### 2. Import state.js into your project and start building a state machine model:

```js
var state = require("state.js");

// create the state machine model elements
var model = new state.StateMachine("model").setLogger(console);
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model);

// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move"; });

// create a state machine instance
var instance = new state.StateMachineInstance("test");

// initialise the model and instance
state.initialise(model, instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
state.evaluate(model, instance, "move");
```

### Browser

#### 1. Download lib/state.js from GitHub

#### 2. Include state.js as a script in your page:

```html
<script type="text/javascript" src="state.js" target="state"></script>
```

Note that that the element *target* defines the name of the global object that the state.js API will be bound to.

#### 3. Write another script with your state machine code:

```html
<script>
```
```js
	// create the state machine model elements
	var model = new state.StateMachine("model").setLogger(console);
	var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
	var stateA = new state.State("stateA", model);
	var stateB = new state.State("stateB", model);
	
	// create the state machine model transitions
	initial.to(stateA);
	stateA.to(stateB).when(function (message) { return message === "move"; });
	
	// create a state machine instance
	var instance = new state.StateMachineInstance("test");
	
	// initialise the model and instance
	state.initialise(model, instance);
	
	// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
	state.evaluate(model, instance, "move");
```
```html
</script>
```



## Versioning
The versions are in the form {major}.{minor}.{build}
* Major changes introduce significant new behaviour and will update the public API.
* Minor changes introduce features, bug fixes, etc, but note that they also may break the public API.
* Build changes can introduce features, though usually are fixes and performance enhancements; these will never break the public API.

## Documentation
Documentation for the public API can be found [here](https://github.com/steelbreeze/state.js/blob/master/doc/state.com.md).

## Licence
state.js is dual-licenecd under the MIT and GPL v3 licences.
