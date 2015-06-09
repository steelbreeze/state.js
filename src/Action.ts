/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */

module StateJS {
	/**
	 * Declaration for callbacks that provide state entry, state exit and transition behaviour.
	 * @interface Action
	 * @param {any} message The message that may trigger the transition.
	 * @param {IActiveStateConfiguration} instance The state machine instance.
	 * @param {boolean} history Internal use only
	 * @returns {any} Actions can return any value.
	 */
	export interface Action {
		(message?: any, instance?: IActiveStateConfiguration, history?: boolean): any;
	}
}