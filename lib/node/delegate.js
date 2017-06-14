"use strict";
/**
 * @module delegate
 *
 * Multicast delegate for TypeScript
 *
 * @copyright (c) 2017 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
exports.__esModule = true;
/***
 * A function that does nothing and returns nothing; this is returned from the [[create]] function if no [callable]{@link isCallable} delegates are passed in.
 * @hidden
 */
var noop = function () { };
/**
 * Tests a [delegate]{@link Delegate} to see if is contains callable behavior.
 * @param delegate The [delegate]{@link Delegate} to test.
 * @return Returns true if the [delegate]{@link Delegate} contains callable behavior.
 */
function isCallable(delegate) {
    return delegate !== noop && delegate !== undefined && delegate !== null;
}
exports.isCallable = isCallable;
/**
 * Creates a [delegate]{@link Delegate} for one or more [delegates]{@link Delegate} (functions) that can be called as one.
 * @param delegates The set of [delegates]{@link Delegate} (functions) to aggregate into a single [delegate]{@link Delegate}.
 * @return Returns a [delegate]{@link Delegate} that when called calls the other [delegates]{@link Delegate} provided.
 */
function create() {
    var delegates = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        delegates[_i] = arguments[_i];
    }
    // filter non-callable entries from the passed parameters.
    var callable = delegates.filter(isCallable);
    if (callable.length !== 0) {
        // create a new delegate that calls all the passed delegates and returns their results as an array.
        var delegate = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return callable.map(function (f) { return f.apply(void 0, args); });
        };
        return delegate;
    }
    else {
        // as there is nothing to call, return the noop.
        return noop;
    }
}
exports.create = create;
