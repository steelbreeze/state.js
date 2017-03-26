(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Tree = require("./tree");
exports.logger = {
    log: function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
    },
    error: function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        throw message;
    }
};
function setLogger(newLogger) {
    var result = exports.logger;
    exports.logger = newLogger;
    return result;
}
exports.setLogger = setLogger;
exports.random = function (max) { return Math.floor(Math.random() * max); };
function setRandom(newRandom) {
    var result = exports.random;
    exports.random = newRandom;
    return result;
}
exports.setRandom = setRandom;
exports.internalTransitionsTriggerCompletion = false;
function setInternalTransitionsTriggerCompletion(value) {
    exports.internalTransitionsTriggerCompletion = value;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
function invoke(actions, message, instance, deepHistory) {
    for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
        var action = actions_1[_i];
        action(message, instance, deepHistory);
    }
}
var PseudoStateKind;
(function (PseudoStateKind) {
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
})(PseudoStateKind = exports.PseudoStateKind || (exports.PseudoStateKind = {}));
var TransitionKind;
(function (TransitionKind) {
    TransitionKind[TransitionKind["External"] = 0] = "External";
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    TransitionKind[TransitionKind["Local"] = 2] = "Local";
})(TransitionKind = exports.TransitionKind || (exports.TransitionKind = {}));
var Element = (function () {
    function Element(name, parent) {
        this.name = name;
        this.parent = parent;
        this.children = new Array();
        this.qualifiedName = parent ? parent.toString() + Element.namespaceSeparator + name : name;
    }
    Element.prototype.getRoot = function () {
        return this.parent.getRoot();
    };
    Element.prototype.isActive = function (instance) {
        return this.parent.isActive(instance); // TODO: remove from here
    };
    Element.prototype.accept = function (visitor, arg) {
        visitor.visitElement(this, arg);
    };
    Element.prototype.toString = function () {
        return this.qualifiedName;
    };
    return Element;
}());
Element.namespaceSeparator = ".";
exports.Element = Element;
var Region = (function (_super) {
    __extends(Region, _super);
    function Region(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        _this.parent.children.push(_this);
        _this.getRoot().clean = false;
        return _this;
    }
    Region.prototype.isComplete = function (instance) {
        var currentState = instance.getLastKnownState(this);
        return currentState !== undefined && currentState.isFinal();
    };
    Region.prototype.accept = function (visitor, arg) {
        visitor.visitRegion(this, arg);
    };
    return Region;
}(Element));
Region.defaultName = "default";
exports.Region = Region;
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    function Vertex(name, parent) {
        var _this = _super.call(this, name, parent instanceof Region ? parent : State.defaultRegion(parent)) || this;
        _this.outgoing = new Array();
        _this.incoming = new Array();
        _this.parent.children.push(_this);
        _this.getRoot().clean = false;
        return _this;
    }
    Vertex.prototype.to = function (target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        return new Transition(this, target, kind);
    };
    Vertex.prototype.accept = function (visitor, arg) {
        visitor.visitVertex(this, arg);
    };
    return Vertex;
}(Element));
exports.Vertex = Vertex;
var PseudoState = (function (_super) {
    __extends(PseudoState, _super);
    function PseudoState(name, parent, kind) {
        if (kind === void 0) { kind = PseudoStateKind.Initial; }
        var _this = _super.call(this, name, parent) || this;
        _this.kind = kind;
        return _this;
    }
    PseudoState.prototype.isHistory = function () {
        return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
    };
    PseudoState.prototype.isInitial = function () {
        return this.kind === PseudoStateKind.Initial || this.isHistory();
    };
    PseudoState.prototype.accept = function (visitor, arg) {
        visitor.visitPseudoState(this, arg);
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
var State = (function (_super) {
    __extends(State, _super);
    function State() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.entryBehavior = new Array();
        _this.exitBehavior = new Array();
        return _this;
    }
    State.defaultRegion = function (state) {
        for (var _i = 0, _a = state.children; _i < _a.length; _i++) {
            var region = _a[_i];
            if (region.name === Region.defaultName) {
                return region;
            }
        }
        return new Region(Region.defaultName, state);
    };
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    State.prototype.isSimple = function () {
        return this.children.length === 0;
    };
    State.prototype.isComposite = function () {
        return this.children.length > 0;
    };
    State.prototype.isOrthogonal = function () {
        return this.children.length > 1;
    };
    State.prototype.isActive = function (instance) {
        return _super.prototype.isActive.call(this, instance) && instance.getLastKnownState(this.parent) === this;
    };
    State.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    State.prototype.exit = function (action) {
        this.exitBehavior.push(action);
        this.getRoot().clean = false;
        return this;
    };
    State.prototype.entry = function (action) {
        this.entryBehavior.push(action);
        this.getRoot().clean = false;
        return this;
    };
    State.prototype.accept = function (visitor, arg) {
        visitor.visitState(this, arg);
    };
    return State;
}(Vertex));
exports.State = State;
var StateMachine = (function () {
    function StateMachine(name) {
        this.name = name;
        this.children = new Array();
        this.clean = false;
        this.onInitialise = new Array();
        this.parent = undefined;
    }
    StateMachine.prototype.getRoot = function () {
        return this;
    };
    StateMachine.prototype.accept = function (visitor, arg) {
        visitor.visitStateMachine(this, arg);
    };
    StateMachine.prototype.isActive = function (instance) {
        return true;
    };
    StateMachine.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    StateMachine.prototype.initialise = function (instance, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        if (instance) {
            if (autoInitialiseModel && this.clean === false) {
                this.initialise();
            }
            exports.logger.log("initialise " + instance);
            invoke(this.onInitialise, undefined, instance, false);
        }
        else {
            exports.logger.log("initialise " + this);
            this.accept(new InitialiseStateMachine());
            this.clean = true;
        }
    };
    StateMachine.prototype.evaluate = function (instance, message, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        if (autoInitialiseModel && this.clean === false) {
            this.initialise();
        }
        exports.logger.log(instance + " evaluate message: " + message);
        return evaluate(this, instance, message);
    };
    StateMachine.prototype.toString = function () {
        return this.name;
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;
var Transition = (function () {
    function Transition(source, target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        var _this = this;
        this.source = source;
        this.target = target;
        this.kind = kind;
        this.effectBehavior = new Array();
        this.onTraverse = new Array();
        this.guard = source instanceof PseudoState ? function () { return true; } : function (message) { return message === _this.source; };
        this.source.outgoing.push(this);
        this.source.getRoot().clean = false;
        if (this.target) {
            this.target.incoming.push(this);
        }
        else {
            this.kind = TransitionKind.Internal;
        }
    }
    Transition.prototype["else"] = function () {
        this.guard = Transition.Else;
        return this;
    };
    Transition.prototype.when = function (guard) {
        this.guard = guard;
        return this;
    };
    Transition.prototype.effect = function (action) {
        this.effectBehavior.push(action);
        this.source.getRoot().clean = false;
        return this;
    };
    Transition.prototype.accept = function (visitor, arg) {
        visitor.visitTransition(this, arg);
    };
    Transition.prototype.toString = function () {
        return TransitionKind[this.kind] + "(" + (this.kind === TransitionKind.Internal ? this.source : (this.source + " -> " + this.target)) + ")";
    };
    return Transition;
}());
Transition.Else = function (message, instance) { return false; };
exports.Transition = Transition;
var Visitor = (function () {
    function Visitor() {
    }
    Visitor.prototype.visitElement = function (element, arg) {
    };
    Visitor.prototype.visitRegion = function (region, arg) {
        for (var _i = 0, _a = region.children; _i < _a.length; _i++) {
            var vertex = _a[_i];
            vertex.accept(this, arg);
        }
        this.visitElement(region, arg);
    };
    Visitor.prototype.visitVertex = function (vertex, arg) {
        for (var _i = 0, _a = vertex.outgoing; _i < _a.length; _i++) {
            var transition = _a[_i];
            transition.accept(this, arg);
        }
        this.visitElement(vertex, arg);
    };
    Visitor.prototype.visitPseudoState = function (pseudoState, arg) {
        this.visitVertex(pseudoState, arg);
    };
    Visitor.prototype.visitState = function (state, arg) {
        for (var _i = 0, _a = state.children; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, arg);
        }
        this.visitVertex(state, arg);
    };
    Visitor.prototype.visitStateMachine = function (stateMachine, arg) {
        for (var _i = 0, _a = stateMachine.children; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, arg);
        }
        this.visitElement(stateMachine, arg);
    };
    Visitor.prototype.visitTransition = function (transition, arg) {
    };
    return Visitor;
}());
exports.Visitor = Visitor;
var DictionaryInstance = (function () {
    function DictionaryInstance(name) {
        this.name = name;
        this.current = {};
        this.activeStateConfiguration = {};
    }
    DictionaryInstance.prototype.setCurrent = function (region, vertex) {
        this.current[region.qualifiedName] = vertex;
        if (vertex instanceof State) {
            this.activeStateConfiguration[region.qualifiedName] = vertex;
        }
    };
    DictionaryInstance.prototype.getCurrent = function (region) {
        return this.current[region.qualifiedName];
    };
    DictionaryInstance.prototype.getLastKnownState = function (region) {
        return this.activeStateConfiguration[region.qualifiedName];
    };
    DictionaryInstance.prototype.toString = function () {
        return this.name;
    };
    return DictionaryInstance;
}());
exports.DictionaryInstance = DictionaryInstance;
var ElementActions = (function () {
    function ElementActions() {
        this.leave = new Array();
        this.beginEnter = new Array();
        this.endEnter = new Array();
    }
    return ElementActions;
}());
var InitialiseStateMachine = (function (_super) {
    __extends(InitialiseStateMachine, _super);
    function InitialiseStateMachine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.elementActions = {};
        _this.transitions = new Array();
        return _this;
    }
    InitialiseStateMachine.prototype.getActions = function (elemenet) {
        return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = new ElementActions());
    };
    InitialiseStateMachine.prototype.visitElement = function (element, deepHistoryAbove) {
        this.getActions(element).leave.push(function (message, instance) { return exports.logger.log(instance + " leave " + element); });
        this.getActions(element).beginEnter.push(function (message, instance) { return exports.logger.log(instance + " enter " + element); });
    };
    InitialiseStateMachine.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionInitial = region.children.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result; }, undefined);
        this.getActions(region).leave.push(function (message, instance) {
            var currentState = instance.getCurrent(region);
            if (currentState) {
                invoke(_this.getActions(currentState).leave, message, instance, false);
            }
        });
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.getActions(region).endEnter.push(function (message, instance, deepHistory) {
                var actions = _this.getActions((deepHistory || regionInitial.isHistory()) ? instance.getLastKnownState(region) || regionInitial : regionInitial);
                var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                invoke(actions.beginEnter, message, instance, history);
                invoke(actions.endEnter, message, instance, history);
            });
        }
        else {
            this.getActions(region).endEnter = this.getActions(region).endEnter.concat(this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        _super.prototype.visitVertex.call(this, vertex, deepHistoryAbove);
        this.getActions(vertex).beginEnter.push(function (message, instance) {
            instance.setCurrent(vertex.parent, vertex);
        });
    };
    InitialiseStateMachine.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        if (pseudoState.isInitial()) {
            this.getActions(pseudoState).endEnter.push(function (message, instance, deepHistory) {
                if (instance.getLastKnownState(pseudoState.parent)) {
                    invoke(_this.getActions(pseudoState).leave, message, instance, false);
                    var currentState = instance.getLastKnownState(pseudoState.parent);
                    if (currentState) {
                        invoke(_this.getActions(currentState).beginEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                        invoke(_this.getActions(currentState).endEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                    }
                }
                else {
                    traverse(pseudoState.outgoing[0], instance);
                }
            });
        }
    };
    InitialiseStateMachine.prototype.visitState = function (state, deepHistoryAbove) {
        for (var _i = 0, _a = state.children; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            this.getActions(state).leave = this.getActions(state).leave.concat(this.getActions(region).leave);
            this.getActions(state).endEnter = this.getActions(state).endEnter.concat(this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
        this.visitVertex(state, deepHistoryAbove);
        this.getActions(state).leave = this.getActions(state).leave.concat(state.exitBehavior);
        this.getActions(state).beginEnter = this.getActions(state).beginEnter.concat(state.entryBehavior);
    };
    InitialiseStateMachine.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
        for (var _i = 0, _a = this.transitions; _i < _a.length; _i++) {
            var transition = _a[_i];
            switch (transition.kind) {
                case TransitionKind.Internal:
                    this.visitInternalTransition(transition);
                    break;
                case TransitionKind.Local:
                    this.visitLocalTransition(transition);
                    break;
                case TransitionKind.External:
                    this.visitExternalTransition(transition);
                    break;
            }
        }
        for (var _b = 0, _c = stateMachine.children; _b < _c.length; _b++) {
            var region = _c[_b];
            stateMachine.onInitialise = stateMachine.onInitialise.concat(this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    InitialiseStateMachine.prototype.visitInternalTransition = function (transition) {
        transition.onTraverse = transition.onTraverse.concat(transition.effectBehavior);
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push(function (message, instance) {
                if (transition.source instanceof State && transition.source.isComplete(instance)) {
                    evaluate(transition.source, instance, transition.source);
                }
            });
        }
    };
    InitialiseStateMachine.prototype.visitLocalTransition = function (transition) {
        var _this = this;
        transition.onTraverse.push(function (message, instance, deepHistory) {
            var targetAncestors = Tree.Ancestors(transition.target);
            var i = 0;
            while (targetAncestors[i].isActive(instance)) {
                i++;
            }
            if (targetAncestors[i] instanceof Region) {
                throw "Need to implement Region logic";
            }
            var firstToEnter = targetAncestors[i];
            var firstToExit = instance.getCurrent(firstToEnter.parent);
            invoke(_this.getActions(firstToExit).leave, message, instance, false);
            invoke(transition.effectBehavior, message, instance, false);
            while (i < targetAncestors.length) {
                invoke(_this.getActions(targetAncestors[i++]).beginEnter, message, instance, false);
            }
            invoke(_this.getActions(transition.target).endEnter, message, instance, false);
        });
    };
    InitialiseStateMachine.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = Tree.Ancestors(transition.source);
        var targetAncestors = Tree.Ancestors(transition.target);
        var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
        while (sourceAncestors[i] !== targetAncestors[i]) {
            i -= 1;
        }
        if (sourceAncestors[i] instanceof Region) {
            i += 1;
        }
        // TODO: merge
        transition.onTraverse = transition.onTraverse.concat(this.getActions(sourceAncestors[i]).leave);
        transition.onTraverse = transition.onTraverse.concat(transition.effectBehavior);
        while (i < targetAncestors.length) {
            transition.onTraverse = transition.onTraverse.concat(this.getActions(targetAncestors[i++]).beginEnter);
        }
        transition.onTraverse = transition.onTraverse.concat(this.getActions(transition.target).endEnter);
    };
    return InitialiseStateMachine;
}(Visitor));
function findElse(pseudoState) {
    return pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.Else; })[0];
}
function selectTransition(pseudoState, instance, message) {
    var transitions = pseudoState.outgoing.filter(function (transition) { return transition.guard(message, instance); });
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return transitions.length !== 0 ? transitions[exports.random(transitions.length)] : findElse(pseudoState);
    }
    if (transitions.length > 1) {
        exports.logger.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
    }
    return transitions[0] || findElse(pseudoState);
}
function evaluate(state, instance, message) {
    var result = false;
    if (message !== state) {
        state.children.every(function (region) {
            var currentState = instance.getLastKnownState(region);
            if (currentState && evaluate(currentState, instance, message)) {
                result = true;
                return state.isActive(instance);
            }
            return true;
        });
    }
    if (state instanceof State) {
        if (result) {
            if ((message !== state) && state.isComplete(instance)) {
                evaluate(state, instance, state);
            }
        }
        else {
            var transitions = state.outgoing.filter(function (transition) { return transition.guard(message, instance); });
            if (transitions.length === 1) {
                traverse(transitions[0], instance, message);
                result = true;
            }
            else if (transitions.length > 1) {
                exports.logger.error(state + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
    }
    return result;
}
function traverse(origin, instance, message) {
    var onTraverse = origin.onTraverse.slice();
    var transition = origin;
    while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
        transition = selectTransition(transition.target, instance, message);
        onTraverse = onTraverse.concat(transition.onTraverse);
    }
    invoke(onTraverse, message, instance, false);
    if (transition.target) {
        if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
            traverse(selectTransition(transition.target, instance, message), instance, message);
        }
        else if (transition.target instanceof State && transition.target.isComplete(instance)) {
            evaluate(transition.target, instance, transition.target);
        }
    }
}

},{"./tree":2}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TParent The type of the [[Node]]'s parent [[Node]].
 * @param node The [[Node]] to return the ancestry for.
 */
function Ancestors(node) {
    var result = node.parent ? Ancestors(node.parent) : new Array();
    result.push(node);
    return result;
}
exports.Ancestors = Ancestors;
function LCA(ancestry1, ancestry2) {
    var result = 0;
    while (ancestry1[result] === ancestry2[result]) {
        result++;
    }
    return result - 1;
}
exports.LCA = LCA;

},{}],3:[function(require,module,exports){
/*
 * Finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */

// bind the API to a global variable defined by the target attribute of the script element
window[((document.currentScript || document.getElementsByTagName("script")[scripts.length - 1]).attributes.target || { textContent: "fsm" }).textContent] = require("../lib/node/state.js");
},{"../lib/node/state.js":1}]},{},[3]);
