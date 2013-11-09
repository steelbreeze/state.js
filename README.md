# Welcome to state.js

The current stable release is 3.0.1.

If you're using state.js I'd love to hear about it; please e-mail me at mesmo@steelbreeze.net 

## Version 3 notes
Version 3 moves back to a class based coding style; it provides more control via explicit use of SimpleState, CompositeState and OrthogonalState classes; this also removes the insertion of 'default' regions leading to a flatter model where orthogonal regions are not required.

## Version 2 notes - please read before downloading
Version 2 breaks apart the state machine model and the state machine state. This facilitates creating a single state machine model and using it with many different state machine states without any overhead of resetting the state machine, serializing/deserializing state or rebuilding the machine.

###API changes
The following are breaking API changes from version 1.2.x:

Calls to initialise and process now take a new first parameter for the state machine state object; this will have the _active and _current properties added to it automatically.

Also removed the previously depricated Completion and Transition objects (just remove kind: Completion or kind: Transition from your transitions).

## Introduction
State.js is a JavaScript implementation of a state machine library that supports most of the UML 2 state machine semantics.

State.js provides a hierarchical state machine capable of managing orthogonal regions; a variety of pseudo state kinds are implemented including initial, shallow & deep history, choice, junction and entry & exit points. 

## Versioning
The versions are in the form {major}.{minor}.{build}
* Major changes introduce significant new behaviour and will update the public API.
* Minor changes introduce features, bug fixes, etc, but note that they also may break the public API.
* Build changes can introduce features, though usually are fixes and performance enhancements; these will never break the public API.

## Documentation
Please see the [wiki](https://github.com/steelbreeze/state.js/wiki) for documentation.

## Building state.js
There is no build, download a copy of state.js and use it in your site or project.
### Installing with node.js
state.js is available as a node packaged module; to install type:
`npm install state.js`

## Licence
Copyright © 2013 Steelbreeze Limited.

state.js may be licenced under either GPLv3 or MIT licences at your discretion.
[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/1481fb51f491522f451063ef0b9604c7 "githalytics.com")](http://githalytics.com/steelbreeze/state.js)
