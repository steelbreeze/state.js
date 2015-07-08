/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Determines if a state is currently active; that it has been entered but not yet exited.
	 * @function isActive
	 * @param {State} state The state to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model.
	 * @returns {boolean} True if the state is active.
	 */
	export function isActive(state: State, stateMachineInstance: IActiveStateConfiguration): boolean;

	/**
	 * Determines if a region is currently active; that it has been entered but not yet exited.
	 * @function isActive
	 * @param {Region} region The state to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model.
	 * @returns {boolean} True if the region is active.
	 */
	export function isActive(region: Region, stateMachineInstance: IActiveStateConfiguration): boolean;

	/**
	 * Determines if an element is currently active; that it has been entered but not yet exited.
	 * @function isActive
	 * @param {Element} element The state to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model.
	 * @returns {boolean} True if the element is active.
	 */
	export function isActive(element: Element, stateMachineInstance: IActiveStateConfiguration): boolean;

	/**
	 * Determines if an element is currently active; that it has been entered but not yet exited.
	 * @function isActive
	 * @param {Element} element The state to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model.
	 * @returns {boolean} True if the element is active.
	 */
	export function isActive(element: any, stateMachineInstance: IActiveStateConfiguration): boolean {
		if (element instanceof State) {
			return element.region ? (isActive(element.region, stateMachineInstance) && (stateMachineInstance.getCurrent(element.region) === element)) : true;
		} else if (element instanceof Region) {
			return isActive(element.state, stateMachineInstance);
		}
	}
}