/**
 * @module delegate
 * 
 * Multicast delegate for TypeScript
 * 
 * @copyright (c) 2017 David Mesquita-Morris
 * 
 * Licensed under the MIT and GPL v3 licences
 */

/***
 * A function that does nothing and returns nothing; this is returned from the [[create]] function if no [callable]{@link isCallable} delegates are passed in.
 * @hidden
 */
const noop = (): void => { };

/**
 * Implementation of a multicast delegate to be used in conjunction with the [[create]] function.
 */
export interface Delegate {
	/**
	 * The a prototype for any callable function.
	 * @param args An arbitory number of parameters to pass to the function.
	 * @return An optional return from the function. If the delegate is a multicast delegate (one created from multiple other delegates) this will be in the form of an array.
	 */
	(...args: any[]): any;
}

/**
 * Tests a [delegate]{@link Delegate} to see if is contains callable behavior. 
 * @param delegate The [delegate]{@link Delegate} to test.
 * @return Returns true if the [delegate]{@link Delegate} contains callable behavior.
 */
export function isCallable(delegate: Delegate): boolean {
	return delegate !== noop && delegate !== undefined && delegate !== null;
}

/**
 * Creates a [delegate]{@link Delegate} for one or more [delegates]{@link Delegate} (functions) that can be called as one.
 * @param delegates The set of [delegates]{@link Delegate} (functions) to aggregate into a single [delegate]{@link Delegate}.
 * @return Returns a [delegate]{@link Delegate} that when called calls the other [delegates]{@link Delegate} provided.
 */
export function create(...delegates: Delegate[]): Delegate {
	// filter non-callable entries from the passed parameters.
	const callable = delegates.filter(isCallable);

	if (callable.length !== 0) {
		// create a new delegate that calls all the passed delegates and returns their results as an array.
		const delegate = (...args: any[]) => callable.map(f => f(...args));

		return delegate;
	} else {
		// as there is nothing to call, return the noop.
		return noop;
	}
}