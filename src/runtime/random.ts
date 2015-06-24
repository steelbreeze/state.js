/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Sets a method to select an integer random number less than the max value passed as a parameter.
	 * 
	 * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
	 * @function setRandom
	 * @param {function} generator A function that takes a max value and returns a random number between 0 and max - 1.
	 * @returns A random number between 0 and max - 1
	 */
	export function setRandom(generator: (max: number) => number): void {
		random = generator;
	}

	/**
	 * Returns the current method used to select an integer random number less than the max value passed as a parameter.
	 * 
	 * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
	 * @function getRandom
	 * @returns {function} The function that takes a max value and returns a random number between 0 and max - 1.
	 */
	export function getRandom(): (max: number) => number {
		return random;
	}

	// the default method used to produce a random number; defaulting to simplified implementation seen in Mozilla Math.random() page; may be overriden for testing
	var random = function(max: number): number {
		return Math.floor(Math.random() * max);
	}
}