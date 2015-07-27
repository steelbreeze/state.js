/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An element within a state machine model that represents an transitory Vertex within the state machine model.
	 *
	 * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
	 * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
	 * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
	 *
	 * PseudoState extends the Vertex class and inherits its public interface.
	 * @class PseudoState
	 * @augments Vertex
	 */
	export class PseudoState extends Vertex {
		/**
		 * The kind of the pseudo state which determines its use and behaviour.
		 * @member {PseudoStateKind}
		 */
		public kind: PseudoStateKind;

		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {Region} parent The parent region that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		public constructor(name: string, parent: Region, kind: PseudoStateKind);

		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {State} parent The parent state that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		public constructor(name: string, parent: State, kind: PseudoStateKind);

		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {Element} parent The parent element that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		public constructor(name: string, parent: any, kind: PseudoStateKind = PseudoStateKind.Initial) {
			super(name, parent);

			this.kind = kind;
		}

		/**
		 * Tests a pseudo state to determine if it is a history pseudo state.
		 * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isHistory
		 * @returns {boolean} True if the pseudo state is a history pseudo state.
		 */
		public isHistory(): boolean {
			return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
		}

		/**
		 * Tests a pseudo state to determine if it is an initial pseudo state.
		 * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isInitial
		 * @returns {boolean} True if the pseudo state is an initial pseudo state.
		 */
		public isInitial(): boolean {
			return this.kind === PseudoStateKind.Initial || this.isHistory();
		}

		/**
		 * Accepts an instance of a visitor and calls the visitPseudoState method on it.
		 * @method accept
		 * @param {Visitor<TArg1>} visitor The visitor instance.
		 * @param {TArg1} arg1 An optional argument to pass into the visitor.
		 * @param {any} arg2 An optional argument to pass into the visitor.
		 * @param {any} arg3 An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return visitor.visitPseudoState(this, arg1, arg2, arg3);
		}
	}
}