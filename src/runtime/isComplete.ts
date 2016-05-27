/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
namespace StateJS {
	/**
	 * Tests an element within a state machine instance to see if its lifecycle is complete.
	 * @function isComplete
	 * @param {Element} element The element to test.
	 * @param {IInstance} instance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the element is complete.
	 */
	export function isComplete(element: Element, instance: IInstance): boolean {
		if (element instanceof Region) {
			return instance.getCurrent(element).isFinal();
		} else if (element instanceof State) {
			return element.regions.every(region => { return isComplete(region, instance); });
		}

		return true;
	}
}