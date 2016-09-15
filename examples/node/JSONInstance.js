"use strict";
var state = require("../../lib/state.com");
/** Manages the active state configuration of a state machine instance using a serializable JSON structure. */
var JSONInstance = (function () {
    /** Creates a new instance of the JSONInstance class. */
    function JSONInstance(name) {
        this.name = name;
        /** Indicates that the state machine instance has reached a [[PseudoStateKind.Terminate]] [[PseudoState]] and therfore will no longer respond to messages. */
        this.isTerminated = false;
    }
    /** Sets the current State for a given Region. */
    JSONInstance.prototype.setCurrent = function (region, state) {
        this.getNode(region).lastKnown = state.name;
    };
    /** Returns the current State for a given Region. */
    JSONInstance.prototype.getCurrent = function (region) {
        var lastKnown = this.getNode(region).lastKnown;
        return region.vertices.reduce(function (result, item) { return item instanceof state.State && item.name === lastKnown ? item : result; }, undefined);
    };
    /** Finds a node within the active state configuration for a given Region. */
    JSONInstance.prototype.getNode = function (state) {
        if (state.parent) {
            var parentNode = this.getNode(state.parent);
            var node = parentNode.children.reduce(function (result, item) { return item.name === state.name ? item : result; }, undefined);
            if (!node) {
                node = { "name": state.name, "children": [] };
                parentNode.children.push(node);
            }
            return node;
        }
        else {
            if (!this.activeStateConfiguration) {
                this.activeStateConfiguration = { "name": state.name, "children": [] };
            }
            return this.activeStateConfiguration;
        }
    };
    /** Returns the Ac */
    JSONInstance.prototype.toJSON = function () {
        return JSON.stringify(this.activeStateConfiguration);
    };
    JSONInstance.prototype.fromJSON = function (json) {
        return this.activeStateConfiguration = JSON.parse(json);
    };
    JSONInstance.prototype.toString = function () {
        return this.name;
    };
    return JSONInstance;
}());
exports.JSONInstance = JSONInstance;
