"use strict";
var state = require("../../lib/state.com");
var JSONInstance = (function () {
    function JSONInstance(name) {
        this.name = name;
        this.isTerminated = false;
    }
    JSONInstance.prototype.setCurrent = function (region, state) {
        this.findRegionNode(region).lastKnownState = state.name;
    };
    JSONInstance.prototype.getCurrent = function (region) {
        var lastKnownState = this.findRegionNode(region).lastKnownState;
        return region.vertices.reduce(function (result, item) { return item instanceof state.State && item.name === lastKnownState ? item : result; }, undefined);
    };
    JSONInstance.prototype.findRegionNode = function (region) {
        var stateNode = this.findStateNode(region.parent);
        var regionNode = stateNode.regions.reduce(function (result, item) { return item.name === region.name ? item : result; }, undefined);
        if (!regionNode) {
            stateNode.regions.push(regionNode = { "name": region.name, "states": [] });
        }
        return regionNode;
    };
    JSONInstance.prototype.findStateNode = function (state) {
        if (state.parent) {
            var regionNode = this.findRegionNode(state.parent);
            var stateNode = regionNode.states.reduce(function (result, item) { return item.name === state.name ? item : result; }, undefined);
            if (!stateNode) {
                regionNode.states.push(stateNode = { "name": state.name, "regions": [] });
            }
            return stateNode;
        }
        else {
            if (!this.data) {
                this.data = { "name": state.name, "regions": [] };
            }
            return this.data;
        }
    };
    JSONInstance.prototype.toJSON = function () {
        return JSON.stringify(this.data);
    };
    JSONInstance.prototype.fromJSON = function (json) {
        return this.data = JSON.parse(json);
    };
    JSONInstance.prototype.toString = function () {
        return this.name;
    };
    return JSONInstance;
}());
exports.JSONInstance = JSONInstance;
