module fsm {
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
		constructor(name: string, parent: Region, kind: PseudoStateKind);
		
		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {State} parent The parent state that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		constructor(name: string, parent: State, kind: PseudoStateKind);

		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {Element} parent The parent element that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		constructor(name: string, parent: any, kind: PseudoStateKind) {
			super(name, parent);

			this.kind = kind;

			if (this.isInitial()) {
				this.region.initial = this;
			}
		}

		/**
		 * Tests the vertex to determine if it is deemed to be complete.
		 * Pseudo states and simple states are always deemed to be complete.
		 * Composite states are deemed to be complete when all its child regions all are complete.
		 * @method isComplete
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @returns {boolean} True if the vertex is deemed to be complete.
		 */
		isComplete(instance: IActiveStateConfiguration): boolean {
			return true;
		}

		/**
		 * Tests a pseudo state to determine if it is a history pseudo state.
		 * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isHistory
		 * @returns {boolean} True if the pseudo state is a history pseudo state.
		 */
		isHistory(): boolean {
			return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
		}

		/**
		 * Tests a pseudo state to determine if it is an initial pseudo state.
		 * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isInitial
		 * @returns {boolean} True if the pseudo state is an initial pseudo state.
		 */
		isInitial(): boolean {
			return this.kind === PseudoStateKind.Initial || this.isHistory();
		}

		// selects the transition to follow for a given message and state machine instance combination
		select(message: any, instance: IActiveStateConfiguration): Transition {
			switch (this.kind) {
				case PseudoStateKind.Initial:
				case PseudoStateKind.DeepHistory:
				case PseudoStateKind.ShallowHistory:
					if (this.transitions.length === 1) {
						return this.transitions[0];
					} else {
						throw "Initial transition must have a single outbound transition from " + this.qualifiedName;
					}

				case PseudoStateKind.Junction:
					var result: Transition, elseResult: Transition;

					for (var i = 0, l = this.transitions.length; i < l; i++) {
						if (this.transitions[i].guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound transitions evaluated true";
							}

							elseResult = this.transitions[i];
						} else if (this.transitions[i].guard(message, instance)) {
							if (result) {
								throw "Multiple outbound transitions evaluated true";
							}

							result = this.transitions[i];
						}
					}

					return result || elseResult;

				case PseudoStateKind.Choice:
					var results: Array<Transition> = [];

					for (var i = 0, l = this.transitions.length; i < l; i++) {
						if (this.transitions[i].guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound else transitions found at " + this + " for " + message;
							}

							elseResult = this.transitions[i];
						} else if (this.transitions[i].guard(message, instance)) {
							results.push(this.transitions[i]);
						}
					}

					return results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;

				default:
					return null;
			}
		}

		/**
		 * Accepts an instance of a visitor and calls the visitPseudoState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitPseudoState(this, arg);
		}
	}
}