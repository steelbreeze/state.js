/*
 * Finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */

// bind the API to a global variable defined by the target attribute of the script element
window[((document.currentScript || document.getElementsByTagName("script")[scripts.length - 1]).attributes.target || { textContent: "fsm" }).textContent] = require("../lib/node/state.js");