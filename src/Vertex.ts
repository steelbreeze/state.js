/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
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
		region: Region;
		
		/**
		 * The set of transitions from this vertex.
		 * @member {Array<Transition>}
		 */
		transitions: Array<Transition> = [];

		/**
		 * Creates a new instance of the Vertex class within a given parent region.
		 * @param {string} name The name of the vertex.
		 * @param {Region} parent The parent region.
		 */
		constructor(name: string, parent: Region);
		
		/**
		 * Creates a new instance of the Vertex class within a given parent state.
		 * Note, this will create the vertex within the parent states default region.
		 * @param {string} name The name of the vertex.
		 * @param {State} parent The parent state.
		 */
		constructor(name: string, parent: State);

		/**
		 * Creates a new instance of the Vertex class.
		 * @param {string} name The name of the vertex.
		 * @param {Region|State} parent The parent region or state.
		 */
		constructor(name: string, parent: any) {
			super(name);

			if (parent instanceof Region) {
				this.region = <Region>parent;
			} else if (parent instanceof State) {
				this.region = (<State>parent).defaultRegion();
			}

			if (this.region) {
				this.region.vertices.push(this);
				this.region.root().clean = false;
			}
		}

		/**
		 * Returns the parent element of this vertex.
		 * @method getParent
		 * @returns {Element} The parent element of the vertex.
		 */
		getParent(): Element {
			return this.region;
		}
		
		/**
		 * Creates a new transition from this vertex.
		 * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
		 * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
		 * @method to
		 * @param {Vertex} target The destination of the transition; omit for internal transitions.
		 * @returns {Transition} The new transition object.
		 */
		to(target?: Vertex): Transition {
			var transition = new Transition(this, target);

			this.transitions.push(transition);
			this.root().clean = false;

			return transition;
		}
	}
}