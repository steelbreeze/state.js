/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
(function (target) {
	// get the dom element that included this script
	var script = document.currentScript;

	// for browsers that do not support currentScript, get via other means
	if (!script) {
		var scripts = document.getElementsByTagName("script");

		script = scripts[scripts.length - 1];
	}

	// bind the state.js API to the specified name or use "fsm"" as a default
	target[script.attributes.target ? script.attributes.target.textContent : "fsm"] = require("../lib/state.com.js"); // TODO: look to change to window itself if no target supplied
})(window);