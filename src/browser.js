/*
 * Finite state machine library
 * Copyright (c) 2014-6 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
window[(function() {
	// find the script HTML element
	var script = document.currentScript || document.getElementsByTagName("script")[scripts.length - 1];

	// determine the global variable to bind the API to
	return script.attributes.target ? script.attributes.target.textContent : "fsm";
} ())] = require("../lib/state.com");