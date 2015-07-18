/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An element within a state machine model that is a container of Vertices.
	 *
	 * Regions are implicitly inserted into composite state machines as a container for vertices.
	 * They only need to be explicitly defined if orthogonal states are required.
	 *
	 * Region extends the Element class and inherits its public interface.
	 * @class Region
	 * @augments Element
	 */
	export class Region extends Element {
		/**
		 * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
		 * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
		 * Update this static member to use a different name for default regions.
		 * @member {string}
		 */
		public static defaultName: string = "default";

		/**
		 * The parent state of this region.
		 * @member {Region}
		 */
		public state: State;

		/**
		 * The set of vertices that are children of the region.
		 * @member {Array<Vertex>}
		 */
		public vertices: Array<Vertex> = [];

		/**
		 * The pseudo state that will be in initial starting state when entering the region explicitly.
		 * @member {PseudoState}
		 */
		public initial: PseudoState;

		/**
		 * Creates a new instance of the Region class.
		 * @param {string} name The name of the region.
		 * @param {State} state The parent state that this region will be a child of.
		 */
		public constructor(name: string, state: State) {
			super(name, state);

			this.state = state;

			this.state.regions.push(this);

			this.state.getRoot().clean = false;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitRegion method on it.
		 * @method accept
		 * @param {Visitor<TArg1>} visitor The visitor instance.
		 * @param {TArg1} arg1 An optional argument to pass into the visitor.
		 * @param {any} arg2 An optional argument to pass into the visitor.
		 * @param {any} arg3 An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return visitor.visitRegion(this, arg1, arg2, arg3);
		}
	}
}