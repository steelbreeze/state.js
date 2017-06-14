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
export declare function isCallable(delegate: Delegate): boolean;
/**
 * Creates a [delegate]{@link Delegate} for one or more [delegates]{@link Delegate} (functions) that can be called as one.
 * @param delegates The set of [delegates]{@link Delegate} (functions) to aggregate into a single [delegate]{@link Delegate}.
 * @return Returns a [delegate]{@link Delegate} that when called calls the other [delegates]{@link Delegate} provided.
 */
export declare function create(...delegates: Delegate[]): Delegate;
