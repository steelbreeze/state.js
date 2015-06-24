/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An enumeration of static constants that dictates the precise behaviour of transitions.
	 *
	 * Use these constants as the `kind` parameter when creating new `Transition` instances.
	 * @class TransitionKind
	 */
	export enum TransitionKind {
		/**
		 * The transition, if triggered, occurs without exiting or entering the source state.
		 * Thus, it does not cause a state change. This means that the entry or exit condition of the source state will not be invoked.
		 * An internal transition can be taken even if the state machine is in one or more regions nested within this state.
		 * @member {TransitionKind} Internal
		 */
		Internal,
		
		/**
		 * The transition, if triggered, will not exit the composite (source) state, but it will apply to any state within the composite state, and these will be exited and entered.
		 * @member {TransitionKind} Local
		 */
		Local,
		
		/**
		 * The transition, if triggered, will exit the source vertex.
		 * @member {TransitionKind} External
		 */
		External
	}
}