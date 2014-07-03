# Welcome to state.js

The current stable release is 4.1.3

If you're using state.js I'd love to hear about it; please e-mail me at mesmo@steelbreeze.net 

## Version 4.1
Version 4.1 adds passing of the state machine state (a.k.a. context) to the guard condintions of transitions.

##Version 4
Version 4 adds passing of the state machine state (a.k.a. context) to the Effect, Entry and Exit callbacks. This is only a breaking change in the area of message 
based transitions where the state machine state is passed to the Effect callback as the first parameter, with the message that caused the transition passed as the second parameter.

Added onEntry, onExit and onEffect methods to raise the Entry, Exit and Effect callbacks respectively; these can be replaced in derivative code as required where more complex behaviour is requied.

Also renamed a few of the internal methods for naming consistency.

The licence has also moved to MIT only.

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
###The MIT License (MIT)

Copyright (c) 2014 Steelbreeze Limited

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/1481fb51f491522f451063ef0b9604c7 "githalytics.com")](http://githalytics.com/steelbreeze/state.js)
