"use strict";
/**
 * @module delegate
 *
 * multicast delegate for TypeScript
 *
 * @copyright (c) 2017 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
exports.__esModule = true;
/***
 * A delegate that does nothing; this is always returned from create if no delegates are passed in. This can be used for comparison purposes.
 * @param args An arbitory number of parameters to pass to the function.
 */
exports.noop = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
};
/**
 * Creates a delegate for one or more functions that can be called as one.
 * @param delegates The set of functions to aggregate into a single delegate.
 * @return Returns a delegate that when called calls the other functions provided.
 */
function create() {
    var delegates = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        delegates[_i] = arguments[_i];
    }
    var callable = delegates.filter(function (f) { return f !== exports.noop && f !== undefined && f !== null; });
    if (callable.length !== 0) {
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
        return exports.noop;
    }
}
exports.create = create;
