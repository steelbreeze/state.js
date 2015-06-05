/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */

(function (target) {
	// get the dom element that included this script
	var script = document.currentScript || (function () {
		var scripts = document.getElementsByTagName("script");
		return scripts[scripts.length - 1];
	})();

	// get the class attfibute from the script element
	var classAttribute = script.attributes["target"];

	// bind the state.js API to the specified name or use "fsm"" as a default
	target[classAttribute ? classAttribute.textContent : "fsm"] = require("../lib/state.com.js");
})(window);