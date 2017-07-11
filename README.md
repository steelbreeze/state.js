  [![state.js Logo](http://state.software/images/logos/state_55.png)](https://state.software/)

  Executable state machine for [Node](http://nodejs.org) and [Web](https://cdn.rawgit.com/steelbreeze/state.js/master/examples/browser/test.html) development.

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Travis CI][travis-image]][travis-url]
  [![Code Climate][cc-image]][cc-url]
  [![Test Coverage][coverage-image]][coverage-url]
  [![Dev Dependencies][d-image]][d-url]

If you like state.js, please star it.

> **Update:** state.js v6 is nearing completion - it will be moving to the new [state](https://github.com/steelbreeze/state) repo and will use npm organistaions.

## Getting started

The state.js API is split into:

1. Classes that represent a state machine model (State, PseudoState, Transition, etc.)
2. An interface and implementation of *active state configuration* (current state); this allows multiple concurrent instances of a single state machine model
3. A set of functions that provide the state machine runtime

The API is bound to a global object of your choosing.

state.js is developed in TypeScript and transpiled to JavaScript; you can use it in either language.

### Node
#### 1. Install state.js in your project:

```sh
$ npm install state.js
```

#### 2. Import state.js and build your state machine:

```js
var state = require("state.js");

// send log messages, warnings and errors to the console
state.setConsole(console);

// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model);

// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when(function (message) { return message === "move"; });

// create a state machine instance
var instance = new state.StateMachineInstance("instance");

// initialise the model and instance
state.initialise(model, instance);

// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
state.evaluate(model, instance, "move");
```

### Web

#### 1. Add state.js to your project:
```sh
$ bower install --save state
```
Alternatively, download direct from [lib/web/state.js](https://github.com/steelbreeze/state.js/blob/master/lib/web/state.js) or [lib/web/state.min.js](https://github.com/steelbreeze/state.js/blob/master/lib/web/state.min.js).

#### 2. Include state.js as a script in your page:

```html
<script type="text/javascript" src="/bower_components/state/lib/web/state.min.js" target="state"></script>
```

**Note:** the *target* attribute within the script element defines the name of the global object that the state.js API will be bound to. If not specified, state.js will be bound to window.fsm.

#### 3. Create your state machine in another script:

```html
<script>
	// send log messages, warnings and errors to the console
	state.setConsole(console);

	// create the state machine model elements
	var model = new state.StateMachine("model");
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
</script>
```

## Versioning
The versions are in the form {major}.{minor}.{build}
* Major changes introduce significant new behavior and will update the public API.
* Minor changes introduce features, bug fixes, etc, but note that they also may break the public API.
* Build changes can introduce features, though usually are fixes and performance enhancements; these will never break the public API.

## Documentation
Documentation for the public API can be found [here](https://steelbreeze.net/state/docs/).

## Licence
state.js is dual-licenecd under the MIT and GPL v3 licences.

[npm-image]: https://img.shields.io/npm/v/state.js.svg
[npm-url]: https://npmjs.org/package/state.js
[downloads-image]: https://img.shields.io/npm/dm/state.js.svg
[downloads-url]: https://npmjs.org/package/state.js
[travis-image]: https://travis-ci.org/steelbreeze/state.js.svg?branch=master
[travis-url]: https://travis-ci.org/steelbreeze/state.js
[cc-image]: https://codeclimate.com/github/steelbreeze/state.js/badges/gpa.svg
[cc-url]: https://codeclimate.com/github/steelbreeze/state.js
[coverage-image]: https://codeclimate.com/github/steelbreeze/state.js/badges/coverage.svg
[coverage-url]: https://codeclimate.com/github/steelbreeze/state.js/coverage
[d-image]: https://david-dm.org/steelbreeze/state.js/dev-status.svg
[d-url]: https://david-dm.org/steelbreeze/state.js#info=devDependencies
