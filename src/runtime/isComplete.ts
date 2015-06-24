/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Tests a state machine instance to see if its lifecycle is complete. A state machine instance is complete if all regions belonging to the state machine root have curent states that are final states.
	 * @function isComplete
	 * @param {StateMachine} stateMachineModel The state machine model. 
	 * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the state machine instance is complete.
	 */
	export function isComplete(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration): boolean {
		if (vertex instanceof State) {
			return (<State>vertex).regions.every(region => { return stateMachineInstance.getCurrent(region).isFinal(); });
		}

		return true;
	}
}