# Welcome to state.js

This is version 5.3.0; it mainly aims to fixe the commonjs packaging issue to allow Node.js use again!

Please use the following files in the following ways:
* lib/state.com.js - this is the CommonJS module for use in Node.js or other CommonJS based applications; either reference this manually, or if you npm install state.js, this is the target when using require("state.js").
* lib/state.js - this is a version for use in browsers; all the classes and functions will be available under the fsm object as in earlier v5 versions.
* lib/state.min.js - a minified version of state.js for use in browsers.

To see the example code in action, click [here](https://cdn.rawgit.com/steelbreeze/state.js/master/examples/browser/test.html).

If you're using state.js I'd love to hear about it; please e-mail me at mesmo@steelbreeze.net

## Introduction
State.js is a JavaScript implementation of a state machine library that supports most of the UML 2 state machine semantics.

State.js provides a hierarchical state machine capable of managing orthogonal regions; a variety of pseudo state kinds are implemented including initial, shallow & deep history, choice, junction and terminate.

## Versioning
The versions are in the form {major}.{minor}.{build}
* Major changes introduce significant new behaviour and will update the public API.
* Minor changes introduce features, bug fixes, etc, but note that they also may break the public API.
* Build changes can introduce features, though usually are fixes and performance enhancements; these will never break the public API.

## Documentation
Documentation for the public API can be found [here](https://github.com/steelbreeze/state.js/blob/master/doc/state.com.md).

## Building state.js
There is no build, download a copy of state.js and use it in your site or project.
### Installing with node.js
state.js is available as a node packaged module; to install type:
`npm install state.js`

## Licence
State.js is dual-licenecd under the MIT and GPL v3 licences.
