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
    var result = exports.internalTransitionsTriggerCompletion;
    exports.internalTransitionsTriggerCompletion = value;
    return result;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
function invoke(actions, instance, deepHistory) {
    var message = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        message[_i - 3] = arguments[_i];
    }
    for (var _a = 0, actions_1 = actions; _a < actions_1.length; _a++) {
        var action = actions_1[_a];
        action.apply(void 0, [instance, deepHistory].concat(message));
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
    Element.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitElement.apply(visitor, [this].concat(args));
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
    Region.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitRegion.apply(visitor, [this].concat(args));
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
    Vertex.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitVertex.apply(visitor, [this].concat(args));
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
    PseudoState.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitPseudoState.apply(visitor, [this].concat(args));
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
var State = (function (_super) {
    __extends(State, _super);
    function State() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.entryBehavior = [];
        _this.exitBehavior = [];
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
        this.exitBehavior.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.getRoot().clean = false;
        return this;
    };
    State.prototype.entry = function (action) {
        this.entryBehavior.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.getRoot().clean = false;
        return this;
    };
    State.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitState.apply(visitor, [this].concat(args));
    };
    return State;
}(Vertex));
exports.State = State;
var StateMachine = (function () {
    function StateMachine(name) {
        this.name = name;
        this.children = new Array();
        this.clean = false;
        this.onInitialise = [];
        this.parent = undefined;
    }
    StateMachine.prototype.getRoot = function () {
        return this;
    };
    StateMachine.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitStateMachine.apply(visitor, [this].concat(args));
    };
    StateMachine.prototype.isActive = function (instance) {
        return true;
    };
    StateMachine.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    StateMachine.prototype.initialise = function (instance) {
        if (instance) {
            if (this.clean === false) {
                this.initialise();
            }
            exports.logger.log("initialise " + instance);
            invoke(this.onInitialise, instance, false, undefined);
        }
        else {
            exports.logger.log("initialise " + this);
            this.accept(new InitialiseStateMachine(), false);
            this.clean = true;
        }
    };
    StateMachine.prototype.evaluate = function (instance) {
        var message = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            message[_i - 1] = arguments[_i];
        }
        if (this.clean === false) {
            this.initialise();
        }
        exports.logger.log(instance + " evaluate message: " + message);
        return evaluate.apply(void 0, [this, instance].concat(message));
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
        this.effectBehavior = [];
        this.onTraverse = [];
        this.guard = source instanceof PseudoState ? function (instance) {
            var message = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                message[_i - 1] = arguments[_i];
            }
            return true;
        } : function (instance) {
            var message = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                message[_i - 1] = arguments[_i];
            }
            return message[0] === _this.source;
        };
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
        this.effectBehavior.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.source.getRoot().clean = false;
        return this;
    };
    Transition.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        visitor.visitTransition.apply(visitor, [this].concat(args));
    };
    Transition.prototype.toString = function () {
        return TransitionKind[this.kind] + "(" + (this.kind === TransitionKind.Internal ? this.source : (this.source + " -> " + this.target)) + ")";
    };
    return Transition;
}());
Transition.Else = function (instance) {
    var message = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        message[_i - 1] = arguments[_i];
    }
    return false;
};
exports.Transition = Transition;
var Visitor = (function () {
    function Visitor() {
    }
    Visitor.prototype.visitElement = function (element) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    Visitor.prototype.visitRegion = function (region) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = region.children; _a < _b.length; _a++) {
            var vertex = _b[_a];
            vertex.accept.apply(vertex, [this].concat(args));
        }
        this.visitElement.apply(this, [region].concat(args));
    };
    Visitor.prototype.visitVertex = function (vertex) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = vertex.outgoing; _a < _b.length; _a++) {
            var transition = _b[_a];
            transition.accept.apply(transition, [this].concat(args));
        }
        this.visitElement.apply(this, [vertex].concat(args));
    };
    Visitor.prototype.visitPseudoState = function (pseudoState) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.visitVertex.apply(this, [pseudoState].concat(args));
    };
    Visitor.prototype.visitState = function (state) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = state.children; _a < _b.length; _a++) {
            var region = _b[_a];
            region.accept.apply(region, [this].concat(args));
        }
        this.visitVertex.apply(this, [state].concat(args));
    };
    Visitor.prototype.visitStateMachine = function (stateMachine) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = stateMachine.children; _a < _b.length; _a++) {
            var region = _b[_a];
            region.accept.apply(region, [this].concat(args));
        }
        this.visitElement.apply(this, [stateMachine].concat(args));
    };
    Visitor.prototype.visitTransition = function (transition) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
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
        this.leave = [];
        this.beginEnter = [];
        this.endEnter = [];
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
        this.getActions(element).leave.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return exports.logger.log(instance + " leave " + element);
        });
        this.getActions(element).beginEnter.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return exports.logger.log(instance + " enter " + element);
        });
    };
    InitialiseStateMachine.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionInitial = region.children.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result; }, undefined);
        this.getActions(region).leave.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            var currentState = instance.getCurrent(region);
            if (currentState) {
                invoke.apply(void 0, [_this.getActions(currentState).leave, instance, false].concat(message));
            }
        });
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.getActions(region).endEnter.push(function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                var actions = _this.getActions((deepHistory || regionInitial.isHistory()) ? instance.getLastKnownState(region) || regionInitial : regionInitial);
                var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                invoke.apply(void 0, [actions.beginEnter, instance, history].concat(message));
                invoke.apply(void 0, [actions.endEnter, instance, history].concat(message));
            });
        }
        else {
            this.getActions(region).endEnter = this.getActions(region).endEnter.concat(this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        _super.prototype.visitVertex.call(this, vertex, deepHistoryAbove);
        this.getActions(vertex).beginEnter.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            instance.setCurrent(vertex.parent, vertex);
        });
    };
    InitialiseStateMachine.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        if (pseudoState.isInitial()) {
            this.getActions(pseudoState).endEnter.push(function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                if (instance.getLastKnownState(pseudoState.parent)) {
                    invoke.apply(void 0, [_this.getActions(pseudoState).leave, instance, false].concat(message));
                    var currentState = instance.getLastKnownState(pseudoState.parent);
                    if (currentState) {
                        invoke.apply(void 0, [_this.getActions(currentState).beginEnter, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                        invoke.apply(void 0, [_this.getActions(currentState).endEnter, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                    }
                }
                else {
                    traverse(pseudoState.outgoing[0], instance, false);
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
            transition.onTraverse.push(function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                if (transition.source instanceof State && transition.source.isComplete(instance)) {
                    evaluate(transition.source, instance, transition.source);
                }
            });
        }
    };
    InitialiseStateMachine.prototype.visitLocalTransition = function (transition) {
        var _this = this;
        transition.onTraverse.push(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
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
            invoke.apply(void 0, [_this.getActions(firstToExit).leave, instance, false].concat(message));
            invoke.apply(void 0, [transition.effectBehavior, instance, false].concat(message));
            while (i < targetAncestors.length) {
                invoke.apply(void 0, [_this.getActions(targetAncestors[i++]).beginEnter, instance, false].concat(message));
            }
            invoke.apply(void 0, [_this.getActions(transition.target).endEnter, instance, false].concat(message));
        });
    };
    InitialiseStateMachine.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = Tree.Ancestors(transition.source);
        var targetAncestors = Tree.Ancestors(transition.target);
        var i = Tree.LowestCommonAncestorIndex(sourceAncestors, targetAncestors);
        if (sourceAncestors[i] instanceof Region) {
            i += 1;
        }
        transition.onTraverse = transition.onTraverse.concat(this.getActions(sourceAncestors[i]).leave, transition.effectBehavior);
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
function selectTransition(pseudoState, instance) {
    var message = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        message[_i - 2] = arguments[_i];
    }
    var transitions = pseudoState.outgoing.filter(function (transition) { return transition.guard.apply(transition, [instance].concat(message)); });
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return transitions.length !== 0 ? transitions[exports.random(transitions.length)] : findElse(pseudoState);
    }
    if (transitions.length > 1) {
        exports.logger.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
    }
    return transitions[0] || findElse(pseudoState);
}
function evaluate(state, instance) {
    var message = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        message[_i - 2] = arguments[_i];
    }
    var result = false;
    if (message[0] !== state) {
        state.children.every(function (region) {
            var currentState = instance.getLastKnownState(region);
            if (currentState && evaluate.apply(void 0, [currentState, instance].concat(message))) {
                result = true;
                return state.isActive(instance);
            }
            return true;
        });
    }
    if (state instanceof State) {
        if (result) {
            if ((message[0] !== state) && state.isComplete(instance)) {
                evaluate(state, instance, state);
            }
        }
        else {
            var transitions = state.outgoing.filter(function (transition) { return transition.guard.apply(transition, [instance].concat(message)); });
            if (transitions.length === 1) {
                traverse.apply(void 0, [transitions[0], instance].concat(message));
                result = true;
            }
            else if (transitions.length > 1) {
                exports.logger.error(state + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
    }
    return result;
}
function traverse(origin, instance) {
    var message = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        message[_i - 2] = arguments[_i];
    }
    var onTraverse = origin.onTraverse.slice();
    var transition = origin;
    while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
        transition = selectTransition.apply(void 0, [transition.target, instance].concat(message));
        onTraverse = onTraverse.concat(transition.onTraverse);
    }
    invoke.apply(void 0, [onTraverse, instance, false].concat(message));
    if (transition.target) {
        if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
            traverse.apply(void 0, [selectTransition.apply(void 0, [transition.target, instance].concat(message)), instance].concat(message));
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
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param node The [[Node]] to return the ancestry for.
 */
function Ancestors(node) {
    var result = node.parent ? Ancestors(node.parent) : new Array();
    result.push(node);
    return result;
}
exports.Ancestors = Ancestors;
/**
 * Returns the index of the lowest/least common ancestor of a pair of nodes within a Tree.
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param ancestry1 A [[Node]] within the tree.
 * @param ancestry2 A [[Node]] within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function LowestCommonAncestorIndex(ancestry1, ancestry2) {
    var result = 0;
    while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
        result++;
    }
    return result - 1;
}
exports.LowestCommonAncestorIndex = LowestCommonAncestorIndex;

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
