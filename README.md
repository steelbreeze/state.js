# Welcome to state.js

The current stable release is 4.1.8 on the master branch.
This is the version 5 development branch and currently incomplete.

If you're using state.js I'd love to hear about it; please e-mail me at mesmo@steelbreeze.net

## Version 5
Version 5 is a complete re-write from version 4.x.x:
- Much better performance by pre-computing all steps required during a state change. A clean/diry state is maintained  and re-computing possible if the machine strucutre changes.
- The API has changed to a fluent style enabling transitions to be defined in a more natural way.
- The code is authored in TypeScript; this hopefully will lead to better quality code. State machines using state.js can be authored in JavaScript of TypeScript.

## Introduction
State.js is a JavaScript implementation of a state machine library that supports most of the UML 2 state machine semantics.

State.js provides a hierarchical state machine capable of managing orthogonal regions; a variety of pseudo state kinds are implemented including initial, shallow & deep history, choice, junction and terminate.

## Versioning
The versions are in the form {major}.{minor}.{build}
* Major changes introduce significant new behaviour and will update the public API.
* Minor changes introduce features, bug fixes, etc, but note that they also may break the public API.
* Build changes can introduce features, though usually are fixes and performance enhancements; these will never break the public API.

## Documentation
Documentation for the public API can be found [here](http://www.steelbreeze.net/state.js/JavaScript_API.pdf) (please bear with me as I update this).

## Building state.js
There is no build, download a copy of state.js and use it in your site or project.
### Installing with node.js
state.js is available as a node packaged module; to install type:
`npm install state.js`

## Licence
State.js is dual-licenecd under the MIT and GPL v3 licences.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/1481fb51f491522f451063ef0b9604c7 "githalytics.com")](http://githalytics.com/steelbreeze/state.js)
