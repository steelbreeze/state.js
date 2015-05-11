/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
	/**
	 * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
	 *
	 * States are one of the fundamental building blocks of the state machine model.
	 * Behaviour can be defined for both state entry and state exit.
	 *
	 * State extends the Vertex class and inherits its public interface.
	 * @class State
	 * @augments Vertex
	 */
	export class State extends Vertex {
		// user defined behaviour (via exit method) to execute when exiting a state.
		exitBehavior: Array<Action> = [];
		
		// user defined behaviour (via entry method) to execute when entering a state.
		entryBehavior: Array<Action> = [];
		
		/**
		 * The set of regions under this state.
		 * @member {Array<Region>}
		 */
		regions: Array<Region> = [];		

		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {Region} parent The parent region that owns the state.
		 */
		constructor(name: string, parent: Region);
		
		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {State} parent The parent state that owns the state.
		 */
		constructor(name: string, parent: State);

		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {Element} parent The parent state that owns the state.
		 */
		constructor(name: string, parent: any) {
			super(name, parent);
		}

		/**
		 * Returns the default region for the state.
		 * Note, this will create the default region if it does not already exist.
		 * @method defaultRegion
		 * @returns {Region} The default region.
		 */
		defaultRegion(): Region {
			var region: Region;

			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.regions[i].name === Region.defaultName) {
					region = this.regions[i];
				}
			}

			if (!region) {
				region = new Region(Region.defaultName, this);
			}

			return region;
		}

		/**
		 * Determines if an element is active within a given state machine instance.
		 * @method isActive
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the element is active within the state machine instance.
		 */
		isActive(instance: IActiveStateConfiguration): boolean {
			return super.isActive(instance) && instance.getCurrent(this.region) === this;
		}

		/**
		 * Tests the state to see if it is a final state;
		 * a final state is one that has no outbound transitions.
		 * @method isFinal
		 * @returns {boolean} True if the state is a final state.
		 */
		isFinal(): boolean {
			return this.transitions.length === 0;
		}
		
		/**
		 * Tests the state to see if it is a simple state;
		 * a simple state is one that has no child regions.
		 * @method isSimple
		 * @returns {boolean} True if the state is a simple state.
		 */
		isSimple(): boolean {
			return this.regions.length === 0;
		}

		/**
		 * Tests the state to see if it is a composite state;
		 * a composite state is one that has one or more child regions.
		 * @method isComposite
		 * @returns {boolean} True if the state is a composite state.
		 */
		isComposite(): boolean {
			return this.regions.length > 0;
		}

		/**
		 * Tests the state to see if it is an orthogonal state;
		 * an orthogonal state is one that has two or more child regions.
		 * @method isOrthogonal
		 * @returns {boolean} True if the state is an orthogonal state.
		 */
		isOrthogonal(): boolean {
			return this.regions.length > 1;
		}

		/**
		 * Tests a region to determine if it is deemed to be complete.
		 * A region is complete if its current state is final (a state having on outbound transitions).
		 * @method isComplete
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @returns {boolean} True if the region is deemed to be complete.
		 */
		isComplete(instance: IActiveStateConfiguration): boolean {
			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.regions[i].isComplete(instance) === false) {
					return false;
				}
			}

			return true;
		}
		
		/**
		 * Adds behaviour to a state that is executed each time the state is exited.
		 * @method exit
		 * @param {Action} exitAction The action to add to the state's exit behaviour.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		exit<TMessage>(exitAction: Action): State {
			this.exitBehavior.push(exitAction);

			this.root().clean = false;

			return this;
		}

		/**
		 * Adds behaviour to a state that is executed each time the state is entered.
		 * @method entry
		 * @param {Action} entryAction The action to add to the state's entry behaviour.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		entry<TMessage>(entryAction: Action): State {
			this.entryBehavior.push(entryAction);

			this.root().clean = false;

			return this;
		}

		// selects the transition to follow for a given message and state machine instance combination
		select(message: any, instance: IActiveStateConfiguration): Transition {
			var result: Transition;

			for (var i = 0, l = this.transitions.length; i < l; i++) {
				if (this.transitions[i].guard(message, instance)) {
					if (result) {
						throw "Multiple outbound transitions evaluated true";
					}

					result = this.transitions[i];
				}
			}

			return result;
		}

		/**
		 * Evaluates a message to determine if a state transition can be made.
		 * States initially delegate messages to their child regions for evaluation, if no state transition is triggered, they behave as any other vertex.
		 * @method evaluate
		 * @param {any} message The message that will be evaluated.
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the message triggered a state transition.
		 */
		evaluate(message: any, instance: IActiveStateConfiguration): boolean {
			var processed = false;

			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.isActive(instance) === true) {
					if (this.regions[i].evaluate(message, instance)) {
						processed = true;
					}
				}
			}

			if (processed === false) {
				processed = super.evaluate(message, instance);
			}

			if (processed === true && message !== this && this.isComplete(instance)) {
				this.evaluate(this, instance);
			}

			return processed;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitState(this, arg);
		}
	}
}