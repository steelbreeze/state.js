module fsm {
	/**
	 * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
	 *
	 * A final state cannot have outbound transitions.
	 *
	 * FinalState extends the State class and inherits its public interface.
	 * @class FinalState
	 * @augments State
	 */
	export class FinalState extends State {
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {Region} parent The parent region that owns the final state.
		 */
		constructor(name: string, parent: Region);
		
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {State} parent The parent state that owns the final state.
		 */
		constructor(name: string, parent: State);
		
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {Element} parent The parent element that owns the final state.
		 */
		constructor(name: string, parent: any) {
			super(name, parent);
		}

		// override Vertex.to to throw an exception when trying to create a transition from a final state.
		to(target?: Vertex): Transition {
			throw "A FinalState cannot be the source of a transition.";
		}

		/**
		 * Accepts an instance of a visitor and calls the visitFinalState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitFinalState(this, arg);
		}
	}
}