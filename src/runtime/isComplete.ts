/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Tests a vertex within a state machine instance to see if its lifecycle is complete.
	 * @function isComplete
	 * @param {Vertex} vertex The vertex to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the vertex is complete.
	 */
	export function isComplete(vertex: Vertex, instance: IActiveStateConfiguration): boolean;

	/**
	 * Tests a region within a state machine instance to see if its lifecycle is complete.
	 * @function isComplete
	 * @param {Region} region The region to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the region is complete.
	 */
	export function isComplete(region: Region, instance: IActiveStateConfiguration): boolean;

	/**
	 * Tests an element within a state machine instance to see if its lifecycle is complete.
	 * @function isComplete
	 * @param {Element} element The element to test.
	 * @param {IActiveStateConfiguration} instance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the element is complete.
	 */
	export function isComplete(element: Element, instance: IActiveStateConfiguration): boolean {
		if (element instanceof Vertex) {
			return element instanceof State ? element.regions.every(region => { return isComplete(region, instance); }) : true;
		} else if (element instanceof Region) {
			return instance.getCurrent(element).isFinal();
		}
	}
}