/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
namespace StateJS {
	/**
	 * Default working implementation of a state machine instance class.
	 *
	 * Implements the `IInstance` interface.
	 * It is possible to create other custom instance classes to manage state machine state in other ways (e.g. as serialisable JSON); just implement the same members and methods as this class.
	 * @class StateMachineInstance
	 * @implements IInstance
	 */
	export class StateMachineInstance implements IInstance {
		private last: any = [];

		/**
		 * The name of the state machine instance.
		 * @member {string}
		 */
		public /*readonly*/ name: string;

		/**
		 * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
		 * @member isTerminated
		 */
		public isTerminated: boolean = false;

		/**
		 * Creates a new instance of the state machine instance class.
		 * @param {string} name The optional name of the state machine instance.
		 */
		public constructor(name: string = "unnamed") {
			this.name = name;
		}

		// Updates the last known state for a given region.
		/*internal*/ setCurrent(region: Region, state: State): void {
			this.last[region.qualifiedName] = state;
		}

		// Returns the last known state for a given region.
		public getCurrent(region: Region): State {
			return this.last[region.qualifiedName];
		}

		/**
		 * Returns the name of the state machine instance.
		 * @method toString
		 * @returns {string} The name of the state machine instance.
		 */
		public toString(): string {
			return this.name;
		}
	}
}