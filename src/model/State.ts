/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
namespace StateJS {
	/**
	 * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
	 *
	 * States are one of the fundamental building blocks of the state machine model.
	 * Behavior can be defined for both state entry and state exit.
	 *
	 * State extends the Vertex class and inherits its public interface.
	 * @class State
	 * @augments Vertex
	 */
	export class State extends Vertex {
		// user defined behavior (via exit method) to execute when exiting a state.
		/* internal */ exitBehavior = new Behavior();

		// user defined behavior (via entry method) to execute when entering a state.
		/* internal */ entryBehavior = new Behavior();

		/**
		 * The set of regions under this state.
		 * @member {Array<Region>}
		 */
		public regions: Array<Region> = [];

		/**
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {Element} parent The parent state that owns the state.
		 */
		public constructor(name: string, parent: Element) {
			super(name, parent);
		}

		/**
		 * Returns the default region for the state.
		 * Note, this will create the default region if it does not already exist.
		 * @method defaultRegion
		 * @returns {Region} The default region.
		 */
		public defaultRegion(): Region {
			return this.regions.reduce((result, region) => region.name === Region.defaultName ? region : result, undefined) || new Region(Region.defaultName, this);
		}

		/**
		 * Tests the state to see if it is a final state;
		 * a final state is one that has no outbound transitions.
		 * @method isFinal
		 * @returns {boolean} True if the state is a final state.
		 */
		public isFinal(): boolean {
			return this.outgoing.length === 0;
		}

		/**
		 * Tests the state to see if it is a simple state;
		 * a simple state is one that has no child regions.
		 * @method isSimple
		 * @returns {boolean} True if the state is a simple state.
		 */
		public isSimple(): boolean {
			return this.regions.length === 0;
		}

		/**
		 * Tests the state to see if it is a composite state;
		 * a composite state is one that has one or more child regions.
		 * @method isComposite
		 * @returns {boolean} True if the state is a composite state.
		 */
		public isComposite(): boolean {
			return this.regions.length > 0;
		}

		/**
		 * Tests the state to see if it is an orthogonal state;
		 * an orthogonal state is one that has two or more child regions.
		 * @method isOrthogonal
		 * @returns {boolean} True if the state is an orthogonal state.
		 */
		public isOrthogonal(): boolean {
			return this.regions.length > 1;
		}

		/**
		 * Removes the state from the state machine model
		 * @method remove
		 */
		public remove() {
			this.regions.forEach(region => { region.remove() });

			super.remove();
		}

		/**
		 * Adds behavior to a state that is executed each time the state is exited.
		 * @method exit
		 * @param {Action} exitAction The action to add to the state's exit behavior.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		public exit(exitAction: Action) {
			this.exitBehavior.push(exitAction);

			this.getRoot().clean = false;

			return this;
		}

		/**
		 * Adds behavior to a state that is executed each time the state is entered.
		 * @method entry
		 * @param {Action} entryAction The action to add to the state's entry behavior.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		public entry(entryAction: Action) {
			this.entryBehavior.push(entryAction);

			this.getRoot().clean = false;

			return this;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitState method on it.
		 * @method accept
		 * @param {Visitor<TArg1>} visitor The visitor instance.
		 * @param {TArg1} arg1 An optional argument to pass into the visitor.
		 * @param {any} arg2 An optional argument to pass into the visitor.
		 * @param {any} arg3 An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return visitor.visitState(this, arg1, arg2, arg3);
		}
	}
}