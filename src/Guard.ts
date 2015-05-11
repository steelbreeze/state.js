/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
	/**
	 * Declaration callbacks that provide transition guard conditions.
	 * @interface Guard
	 * @param {any} message The message that may trigger the transition.
	 * @param {IActiveStateConfiguration} instance The state machine instance.
	 * @param {boolean} history Internal use only
	 * @returns {boolean} True if the guard condition passed.
	 */
	export interface Guard {
		(message: any, instance: IActiveStateConfiguration): boolean;
	}
}