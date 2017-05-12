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
/**
 * Creates a delegate for one or more functions that can be called as one.
 * @param delegates The set of functions to aggregate into a single delegate.
 * @return Returns a delegate that when called calls the other functions provided.
 */
function delegate() {
    var delegates = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        delegates[_i] = arguments[_i];
    }
    return delegates.length === 0 ? empty : function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return delegates.map(function (f) { return f.apply(void 0, args); });
    };
}
exports.delegate = delegate;
/***
 * Null delegate (for comparison purposes)
 * @hidden
 */
var empty = function () { return []; };
