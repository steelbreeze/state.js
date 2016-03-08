/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
	 *
	 * Vertex extends the Element class and inherits its public interface.
	 * @class Vertex
	 * @augments Element
	 */
	export class Vertex extends Element {
		/**
		 * The parent region of this vertex.
		 * @member {Region}
		 */
		public region: Region;

		/**
		 * The set of transitions originating from this vertex.
		 * @member {Array<Transition>}
		 */
		public outgoing: Array<Transition> = [];

		/**
		 * The set of transitions targeting this vertex.
		 * @member {Array<Transition>}
		 */
		public incoming: Array<Transition> = [];

		/**
		 * Creates a new instance of the Vertex class.
		 * @param {string} name The name of the vertex.
		 * @param {Element} parent The parent region or state.
		 */
		public constructor(name: string, parent: Element) {
			super(name, parent instanceof State ? parent.defaultRegion() : parent); // TODO: find a cleaner way to manage implicit conversion

			this.region = parent instanceof State ? parent.defaultRegion() : parent instanceof Region ? parent : undefined;

			if (this.region) {
				this.region.vertices.push(this);

				this.region.getRoot().clean = false;
			}
		}

		// returns the ancestry of this vertex
		ancestry(): Array<Vertex> {
			return (this.region ? this.region.state.ancestry() : []).concat(this);
		}

		/**
		 * Returns the root element within the state machine model.
		 * @method getRoot
		 * @returns {StateMachine} The root state machine element.
		 */
		public getRoot(): StateMachine {
			return this.region.getRoot(); // NOTE: need to keep this dynamic as a state machine may be embedded within another
		}

		/**
		 * Removes the vertex from the state machine model
		 * @method remove
		 */
		public remove() {
			this.outgoing.forEach(transition => { transition.remove() });
			this.incoming.forEach(transition => { transition.remove() });

			this.region.vertices.splice(this.region.vertices.indexOf(this), 1);

			console.log("remove " + this);

			this.region.getRoot().clean = false;
		}

		/**
		 * Creates a new transition from this vertex.
		 * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
		 * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
		 * @method to
		 * @param {Vertex} target The destination of the transition; omit for internal transitions.
		 * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
		 * @returns {Transition} The new transition object.
		 */
		public to(target?: Vertex, kind: TransitionKind = TransitionKind.External): Transition {
			return new Transition(this, target, kind);
		}

		/**
		 * Accepts an instance of a visitor.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any { /* virtual method */ }
	}
}