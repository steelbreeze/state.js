/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
(function (parent) {
	// get the dom element that included this script
	var script = document.currentScript;

	// for browsers that do not support currentScript, get via other means
	if (!script) {
		var scripts = document.getElementsByTagName("script");

		script = scripts[scripts.length - 1];
	}

	var target = script.attributes.target ? script.attributes.target.textContent : "fsm";

	// bind the state.js API to the specified name or use "fsm"" as a default
	parent[target] = require("../lib/state.com.js");
})(window);