/**
 * @module delegate
 *
 * multicast delegate for TypeScript
 *
 * @copyright (c) 2017 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
/**
 * The delegate type is a prototype for any function.
 * @param args An arbitory number of parameters to pass to the function.
 * @return An optional return from the function.
 */
export interface Delegate {
    (...args: any[]): any;
}
/***
 * A delegate that does nothing; this is always returned from create if no delegates are passed in. This can be used for comparison purposes.
 */
export declare const noop: Delegate;
/**
 * Creates a delegate for one or more functions that can be called as one.
 * @param delegates The set of functions to aggregate into a single delegate.
 * @return Returns a delegate that when called calls the other functions provided.
 */
export declare function create(...delegates: Delegate[]): Delegate;
