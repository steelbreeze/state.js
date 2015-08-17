/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	export class Behavior {
		private actions: Array<Action> = [];

		constructor(behavior?: Behavior) {
			if (behavior) {
				this.push(behavior); // NOTE: ensure a copy of the array is made
			}
		}

		push(action: Action): Behavior;
		push(action: Behavior): Behavior;
		push(behavior: any): Behavior {
			Array.prototype.push.apply(this.actions, behavior instanceof Behavior ? behavior.actions : arguments);

			return this;
		}

		isActive() : boolean {
			return this.actions.length !== 0;
		}

		invoke(message: any, instance: IActiveStateConfiguration, history: boolean = false): void {
			this.actions.forEach(action => action(message, instance, history));
		}
	}
}