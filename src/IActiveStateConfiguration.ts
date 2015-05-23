/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
	/**
	 * Interface for the state machine instance; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
	 * @interface IActiveStateConfiguration
	 */
	export interface IActiveStateConfiguration {
		// the visitor used to evaluate messages for this state machine instance.
		evaluator: Visitor<IActiveStateConfiguration>;
		
		/**
		 * @member {boolean} isTerminated Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
		 */
		isTerminated: boolean;

		/**
		 * Updates the last known state for a given region.
		 * @method setCurrent
		 * @param {Region} region The region to update the last known state for.
		 * @param {State} state The last known state for the given region.
		 */
		setCurrent(region: Region, state: State): void;

		/**
		 * Returns the last known state for a given region.
		 * @method getCurrent
		 * @param {Region} region The region to update the last known state for.
		 * @returns {State} The last known state for the given region.
		 */
		getCurrent(region: Region): State;
	}
}