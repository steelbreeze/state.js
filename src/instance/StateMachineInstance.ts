/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {

	interface States {
		[index: string]: State;
	}

	/**
	 * Default working implementation of a state machine instance class.
	 *
	 * Implements the `IActiveStateConfiguration` interface.
	 * It is possible to create other custom instance classes to manage state machine state in any way (e.g. as serialisable JSON); just implement the same members and methods as this class.
	 * @class StateMachineInstance
	 * @implements IActiveStateConfiguration
	 */
	export class StateMachineInstance implements IActiveStateConfiguration {
		private last: States = {};

		/**
		 * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
		 * @member isTerminated
		 */
		public isTerminated: boolean = false;

		/**
		 * Creates a new instance of the state machine instance class.
		 * @param {string} name The optional name of the state machine instance.
		 */
		public constructor(public name: string = "unnamed") { }

		// Updates the last known state for a given region.
		setCurrent(region: Region, state: State): void {
			this.last[region.qualifiedName] = state;
		}

		// Returns the last known state for a given region.
		getCurrent(region: Region): State {
			return this.last[region.qualifiedName];
		}

		/**
		 * Returns the name of the state machine instance.
		 * @method toString
		 * @returns {string} The name of the state machine instance.
		 */
		toString(): string {
			return this.name;
		}
	}
}