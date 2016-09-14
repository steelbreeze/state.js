"use strict";
var state = require("../../lib/state.com");
var JSONInstance = (function () {
    function JSONInstance(name) {
        this.name = name;
        this.isTerminated = false;
    }
    JSONInstance.prototype.setCurrent = function (region, state) {
        this.getNode(region).lastKnown = state.name;
    };
    JSONInstance.prototype.getCurrent = function (region) {
        var lastKnown = this.getNode(region).lastKnown;
        return region.vertices.reduce(function (result, item) { return item instanceof state.State && item.name === lastKnown ? item : result; }, undefined);
    };
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
