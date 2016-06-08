/*
 * Finite state machine library
 * Copyright (c) 2014-6 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */

// using immediage invoaction pattern to avoid polluting the global namespace
(function (parent) {
	// get the dom element that included this script
	var script = document.currentScript;

	// for browsers that do not support currentScript, get via other means
	if (!script) {
		script = document.getElementsByTagName("script")[scripts.length - 1];
	}

	// determine the global variable to bind the API to
	var target = script.attributes.target ? script.attributes.target.textContent : "fsm";

	// bind the state.js API to the specified name or use "fsm"" as a default
	parent[target] = require("../lib/state.com");
})(window);