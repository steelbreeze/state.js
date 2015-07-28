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
		 * The set of transitions from this vertex.
		 * @member {Array<Transition>}
		 */
		public outgoing: Array<Transition> = [];

		/**
		 * Creates a new instance of the Vertex class.
		 * @param {string} name The name of the vertex.
		 * @param {Element} parent The parent region or state.
		 */
		public constructor(name: string, parent: Element) {
			super(name, parent instanceof State ? parent.defaultRegion() : parent);

			if (this.region = <Region>this.parent) {

				this.region.vertices.push(this);

				this.region.getRoot().clean = false;
			}
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
			var transition = new Transition(this, target, target ? kind : TransitionKind.Internal);

			this.outgoing.push(transition);
			this.getRoot().clean = false;

			return transition;
		}
	}
}