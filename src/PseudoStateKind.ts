module fsm {
	/**
	 * An enumeration of static constants that dictates the precise behaviour of pseudo states.
	 *
	 * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
	 * @class PseudoStateKind
	 */
	export enum PseudoStateKind {		
		/**
		 * Used for pseudo states that are always the staring point when entering their parent region.
		 * @member {number} Initial
		 */
		Initial,
				
		/**
		 * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
		 * @member {number} ShallowHistory
		 */
		ShallowHistory,
		
		/**
		 * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
		 * @member {number} DeepHistory
		 */
		DeepHistory,
		
		/**
		 * Enables a dynamic conditional branches; within a compound transition.
		 * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
		 * if a single transition is found, it will be traversed;
		 * if many transitions are found, an arbitary one will be selected and traversed;
		 * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
		 * @member {number} Choice
		 */
		Choice,

		/**
		 * Enables a static conditional branches; within a compound transition.
		 * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
		 * if a single transition is found, it will be traversed;
		 * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
		 * @member {number} Junction
		 */
		Junction,

		/**
		 * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
		 * @member {number} Terminate
		 */
		Terminate
	}
}