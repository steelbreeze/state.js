/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */

(function (target) {
	var script = document.currentScript;
	
	if(!script) {
		var scripts = document.getElementsByTagName("script");
		
		script = scripts[scripts.length - 1]; // TODO: find a better work-around in IE
	}
	
	var classAttribute = script.attributes["class"];
	
	target[classAttribute ? classAttribute.textContent : "fsm"] = require ("../lib/state.com.js");	
})(window);