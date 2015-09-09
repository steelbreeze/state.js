/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Behavior encapsulates multiple Action callbacks that can be invoked by a single call.
	 * @class Behavior
	 */
	export class Behavior {
		private actions: Array<Action> = [];

		/**
		 * Creates a new instance of the Behavior class.
		 * @param {Behavior} behavior The copy constructor; omit this optional parameter for a simple constructor.
		 */
		constructor(behavior?: Behavior) {
			if (behavior) {
				this.push(behavior); // NOTE: this ensures a copy of the array is made
			}
		}

		/**
		 * Adds a single Action callback to this behavior instance.
		 * @method push
		 * @param {Action} action The Action callback to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
		push(action: Action): Behavior;

		/**
		 * Adds the set of Actions callbacks in a Behavior instance to this behavior instance.
		 * @method push
		 * @param {Behavior} behavior The  set of Actions callbacks to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
		push(behavior: Behavior): Behavior;

		/**
		 * Adds an Action or set of Actions callbacks in a Behavior instance to this behavior instance.
		 * @method push
		 * @param {Behavior} behavior The Action or set of Actions callbacks to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
		push(behavior: any): Behavior {
			Array.prototype.push.apply(this.actions, behavior instanceof Behavior ? behavior.actions : arguments);

			return this;
		}

		/**
		 * Tests the Behavior instance to see if any actions have been defined.
		 * @method hasActions
		 * @returns {boolean} True if there are actions defined within this Behavior instance.
		 */
		hasActions() : boolean { // TODO: find a better name
			return this.actions.length !== 0;
		}

		/**
		 * Invokes all the action callbacks in this Behavior instance.
		 * @method invoke
		 * @param {any} message The message that triggered the transition.
		 * @param {IInstance} instance The state machine instance.
		 * @param {boolean} history Internal use only
		 */
		invoke(message: any, instance: IInstance, history: boolean = false): void {
			this.actions.forEach(action => action(message, instance, history));
		}
	}
}