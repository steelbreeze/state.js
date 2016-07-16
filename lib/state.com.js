/*
 * Finite state machine library
 * Copyright (c) 2014-6 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An enumeration used to dictate the behavior of instances of the [[PseudoState]] class.
 *
 * Use these constants as the `kind` parameter when creating new [[PseudoState]] instances to define their behavior (see the description of each member).
 */
(function (PseudoStateKind) {
    /**
     * Enables a dynamic conditional branches; within a compound [[Transition]].
     *
     * All outbound transition guards from a [[Choice]] [[PseudoState]] are evaluated upon entering the [[PseudoState]]:
     * if a single [[Transition]] is found, it will be traversed;
     * if many are found, an arbitary one will be selected and traversed;
     * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     */
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    /**
     * As per [[ShallowHistory]], but the history semantic cascades through all child regions irrespective of their history semantics.
     */
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    /**
     * Defines the [[PseudoState]] that will be the initial staring point when entering its enclosing [[Region]].
     */
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    /**
     * Enables a static conditional branches; within a compound [[Transition]].
     * All outbound transition guards from a [[Junction]] [[PseudoState]] are evaluated upon entering the [[PseudoState]]:
     * if a single [[Transition]] is found, it will be traversed;
     * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     */
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    /**
     * Ensures that re-entry of the enclosing [[Region]] will start at the last known active state configuration.
     *
     */
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
    /**
     * Entering a terminate [[PseudoState]] implies that the execution of [[StateMachine]] is terminated and will not respond to any more messages.
     */
    PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
})(exports.PseudoStateKind || (exports.PseudoStateKind = {}));
var PseudoStateKind = exports.PseudoStateKind;
/**
 * An enumeration of that dictates the precise behavior of a [[Transition]] instance.
 *
 * Use these constants as the `kind` parameter when creating new [[Transition]] instances to define their behavior (see the description of each member).
 * @note Within the [[Transition]] constructor the `kind` parameter will be validated and adjusted as necessary.
 */
(function (TransitionKind) {
    /**
     * The [[Transition]], if triggered, will exit the source [[Vertex]] and enter the target [[Vertex]] irrespective of the proximity of source and terget in terms of their enclosing [[Region]].
     */
    TransitionKind[TransitionKind["External"] = 0] = "External";
    /**
     * The [[Transition]], if triggered, occurs without exiting or entering the source [[State]];
     * it does not cause a state therefore no [[State]] exit or entry [[Action]]s will be invoked, only [[Transition]] [[Action]]s.
     */
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    /**
     * The [[Transition]], if triggered, will not exit the source [[State]] as the terget [[Vertex]] is a child of the source [[State]]. No exit [[Action]]s are invoked from the source [[State]], but [[Transition]] and entry [[Action]]s will be invoked as required.
     */
    TransitionKind[TransitionKind["Local"] = 2] = "Local";
})(exports.TransitionKind || (exports.TransitionKind = {}));
var TransitionKind = exports.TransitionKind;
/**
 * An abstract class used as the base for the [[Region]] and [[Vertex]] classes.
 * An element is a node within the tree structure that represents a state machine model.
 */
var Element = (function () {
    /**
     * Creates a new instance of the [[Element]] class.
     * @param name The name of the element.
     * @param parent The parent [[Element]] of this [[Element]]
     */
    /*internal*/ function Element(name, parent) {
        this.name = name;
        this.qualifiedName = parent ? (parent.qualifiedName + Element.namespaceSeparator + name) : name;
    }
    /**
     * Returns the [[Element]] [[name]] as a namespace delimited by [[namespaceSeparator]].
     */
    Element.prototype.toString = function () {
        return this.qualifiedName;
    };
    /**
     * The symbol used to separate [[Element]] names within a [[qualifiedName]].
     * Change this static member to create different styles of [[qualifiedName]] generated by the [[toString]] method.
     */
    Element.namespaceSeparator = ".";
    return Element;
}());
exports.Element = Element;
/**
 * An [[Element]] within a [[StateMachine]] model that is a container (parent) of [[Vertex]] instances; a [[Region]] will be the child of a composite [[State]].
 *
 * @note A [[Region]] is implicitly inserted into a composite [[State]] if not explicitly defined.
 */
var Region = (function (_super) {
    __extends(Region, _super);
    /**
     * Creates a new instance of the [[Region]] class.
     * @param {string} name The name of the [[Region]].
     * @param {State} state The parent [[State]] that this [[Region]] will be a child of.
     */
    function Region(name, state) {
        _super.call(this, name, state);
        /**
         * The [[Vertex]] instances that are children of this [[Region]].
         */
        this.vertices = new Array();
        this.state = state;
        this.state.regions.push(this);
        this.state.getRoot().clean = false;
    }
    /**
     * Removes this [[Region]] instance from the [[StateMachine]] model
     */
    Region.prototype.remove = function () {
        for (var _i = 0, _a = this.vertices; _i < _a.length; _i++) {
            var vertex = _a[_i];
            vertex.remove();
        }
        this.state.regions.splice(this.state.regions.indexOf(this), 1);
        exports.console.log("remove " + this);
        this.state.getRoot().clean = false;
    };
    /**
     * Returns the root [[StateMachine]] instance that this [[Region]] instance is a part of.
     */
    Region.prototype.getRoot = function () {
        return this.state.getRoot();
    };
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitRegion]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param {Visitor<TArg1>} visitor The [[Visitor]] instance.
     * @param {TArg1} arg1 An optional argument to pass into the [[Visitor]].
     * @param {any} arg2 An optional argument to pass into the [[Visitor]].
     * @param {any} arg3 An optional argument to pass into the [[Visitor]].
     */
    Region.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitRegion(this, arg1, arg2, arg3);
    };
    /**
     * The name given to [[Region]] instances implicitly created (when a [[State]] instance is passed to a [[Vertex]] constructor as it's parent.
     */
    Region.defaultName = "default";
    return Region;
}(Element));
exports.Region = Region;
/**
 * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
 *
 * Vertex extends the Element class and inherits its public interface.
 */
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    /**
     * Creates a new instance of the Vertex class.
     * @param {string} name The name of the vertex.
     * @param {Region | State} parent The parent region or state.
     */
    function Vertex(name, parent) {
        _super.call(this, name, State.parent(parent));
        /**
         * The set of transitions originating from this vertex.
         */
        this.outgoing = new Array();
        /**
         * The set of transitions targeting this vertex.
         */
        this.incoming = new Array();
        this.region = State.parent(parent);
        if (this.region) {
            this.region.vertices.push(this);
            this.region.getRoot().clean = false;
        }
    }
    // resolve the vertices parent region for either states or regions
    Vertex.parent = function (parent) {
        return parent instanceof State ? parent.defaultRegion() : parent;
    };
    /**
     * Returns the ancestry of a Vertex, form the root state machine to this vertex.
     */
    Vertex.prototype.ancestry = function () {
        return (this.region ? this.region.state.ancestry() : new Array()).concat(this);
    };
    /**
     * Returns the root element within the state machine model.
     */
    Vertex.prototype.getRoot = function () {
        return this.region.getRoot();
    };
    /**
     * Removes the vertex from the state machine model
     */
    Vertex.prototype.remove = function () {
        for (var _i = 0, _a = this.outgoing; _i < _a.length; _i++) {
            var transition = _a[_i];
            transition.remove();
        }
        for (var _b = 0, _c = this.incoming; _b < _c.length; _b++) {
            var transition = _c[_b];
            transition.remove();
        }
        this.region.vertices.splice(this.region.vertices.indexOf(this), 1);
        exports.console.log("remove " + this);
        this.region.getRoot().clean = false;
    };
    /**
     * Creates a new transition from this vertex.
     * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
     * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
     * @param {Vertex} target The destination of the transition; omit for internal transitions.
     * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
     */
    Vertex.prototype.to = function (target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        return new Transition(this, target, kind);
    };
    return Vertex;
}(Element));
exports.Vertex = Vertex;
/**
 * An [[Element]] within a [[StateMachine]] model that represents an transitory [[Vertex]].
 *
 * [[PseudoState]]s are required in state machine models to define the default stating state of a [[Region]].
 * [[PseudoState]]s are also used for defining history semantics or to facilitate more complex transitions.
 * A [[Terminate]] [[PseudoState]] kind is also available to immediately terminate processing within the entire state machine instance.
 */
var PseudoState = (function (_super) {
    __extends(PseudoState, _super);
    /**
     * Creates a new instance of the [[PseudoState]] class.
     * @param {string} name The name of the [[PseudoState]].
     * @param {Region | State} parent The parent [[Element]] that this [[PseudoState]] will be a child of.
     * @param {PseudoStateKind} kind Determines the behavior of the [[PseudoState]].
     */
    function PseudoState(name, parent, kind) {
        if (kind === void 0) { kind = PseudoStateKind.Initial; }
        _super.call(this, name, parent);
        this.kind = kind;
    }
    /**
     * Tests a [[PseudoState]] to determine if it is a history [[PseudoState]].
     * History [[PseudoState]]s are of kind: [[ShallowHistory]] or [[DeepHistory]].
     */
    PseudoState.prototype.isHistory = function () {
        return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
    };
    /**
     * Tests a [[PseudoState]] to determine if it is an initial [[PseudoState]].
     * Initial [[PseudoState]]s are of kind: [[Initial]], [[ShallowHistory]], or [[DeepHistory]].
     */
    PseudoState.prototype.isInitial = function () {
        return this.kind === PseudoStateKind.Initial || this.isHistory();
    };
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitPseudoState]] method on it.
     * @param {Visitor<TArg1>} visitor The [[Visitor]] instance.
     * @param {TArg1} arg1 An optional argument to pass into the [[Visitor]].
     * @param {any} arg2 An optional argument to pass into the [[Visitor]].
     * @param {any} arg3 An optional argument to pass into the [[Visitor]].
     */
    PseudoState.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitPseudoState(this, arg1, arg2, arg3);
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
/**
 * An [[Vertex]] within a [[StateMachine]] model that represents an invariant condition within the life of the state machine instance.
 *
 * [[State]] instances are one of the fundamental building blocks of the [[StateMachine]] model; they typically represent conditions where the machine is awaiting an eveny to trigger a [[Transition]].
 * User-defined [[Action]]s can be defined for both [[State]] entry and [[State]] exit.
 */
var State = (function (_super) {
    __extends(State, _super);
    /**
     * Creates a new instance of the [[State]] class.
     * @param {string} name The name of the [[State]].
     * @param {Region | State} parent The parent [[Region]] or [[State]] that this [[State is a child of]].
     * @note When a [[State]] is passed as the parent parameter, a default [[Region]] is created and subsiquently accessible via the [[defaultRegion]] method.
     */
    function State(name, parent) {
        _super.call(this, name, parent);
        /**
         * The user-defined behavior (built up via calls to the [[exit]] method).
         * @private
         */
        this.exitBehavior = new Array();
        /**
         * The user-defined behavior (built up via calls to the [[entry]] method).
         * @private
         */
        this.entryBehavior = new Array();
        /**
         * The  [[Region]] instances that are a child of  this [[State]].
         */
        this.regions = new Array();
    }
    /**
     * Returns the default [[Region]] for the state.
     * @note A default [[Region]] is created on demand if the [[State]] is passed into a child [[Vertex]] constructor..
     */
    State.prototype.defaultRegion = function () {
        return this.regions.reduce(function (result, region) { return region.name === Region.defaultName ? region : result; }, undefined) || new Region(Region.defaultName, this);
    };
    /**
     * Tests the [[State]] to see if it is a [[FinalState]]; a [[FinalState]] is either defined by creating an instance of the [[FinalState]] class or any other [[State]] instance that has no outbound transitions.
     */
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    /**
     * Tests the [[State]] to see if it is a simple [[State]]; a simple [[State]] is one that has no child [[Region]]s.
     */
    State.prototype.isSimple = function () {
        return this.regions.length === 0;
    };
    /**
     * Tests the [[State]] to see if it is a composite [[State]]; a composite [[State]] is one that has one or more child [[Region]]s.
     */
    State.prototype.isComposite = function () {
        return this.regions.length > 0;
    };
    /**
     * Tests the [[State]] to see if it is an orthogonal [[State]]; an orthogonal [[State]] is one that has more than one child [[Region]]s.
     */
    State.prototype.isOrthogonal = function () {
        return this.regions.length > 1;
    };
    /**
     * Removes this [[State]] instance from the [[StateMachine]] model
     */
    State.prototype.remove = function () {
        for (var _i = 0, _a = this.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.remove();
        }
        _super.prototype.remove.call(this);
    };
    /**
     * Adds an [[Action]] that is executed each time the [[State]] instance is exited due to a [[Transition]].
     * @param {Action} exitAction The [[Action]] to add to the [[State]] instance exit behavior.
     */
    State.prototype.exit = function (exitAction) {
        this.exitBehavior.push(exitAction);
        this.getRoot().clean = false;
        return this;
    };
    /**
     * Adds and [[Action]] that is executed each time the [[State]] instance is entered due to a [[Transition]].
     * @param {Action} entryAction The [[Action]] to add to the [[State]] instance entry behavior.
     */
    State.prototype.entry = function (entryAction) {
        this.entryBehavior.push(entryAction);
        this.getRoot().clean = false;
        return this;
    };
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitState]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param {Visitor<TArg1>} visitor The [[Visitor]] instance.
     * @param {TArg1} arg1 An optional argument to pass into the [[Visitor]].
     * @param {any} arg2 An optional argument to pass into the [[Visitor]].
     * @param {any} arg3 An optional argument to pass into the [[Visitor]].
     */
    State.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitState(this, arg1, arg2, arg3);
    };
    return State;
}(Vertex));
exports.State = State;
/**
 * A [[State]] within a [[StateMachine]] model that represents completion of the life of the containing [[Region]] for the state machine instance.
 *
 * @note A [[FinalState]] cannot have outbound transitions.
 */
var FinalState = (function (_super) {
    __extends(FinalState, _super);
    /**
     * Creates a new instance of the [[FinalState]] class.
     * @param {string} name The name of the [[FinalState]].
     * @param {Region | State} parent The parent [[Element]] that owns the [[FinalState]].
     */
    function FinalState(name, parent) {
        _super.call(this, name, parent);
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitFinalState]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param {Visitor<TArg1>} visitor The [[Visitor]] instance.
     * @param {TArg1} arg1 An optional argument to pass into the [[Visitor]].
     * @param {any} arg2 An optional argument to pass into the [[Visitor]].
     * @param {any} arg3 An optional argument to pass into the [[Visitor]].
     */
    FinalState.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitFinalState(this, arg1, arg2, arg3);
    };
    return FinalState;
}(State));
exports.FinalState = FinalState;
/**
 * A [[State]] within a that represents the root [[Element]] of the [[StateMachine]] model.
 */
var StateMachine = (function (_super) {
    __extends(StateMachine, _super);
    /**
     * Creates a new instance of the [[StateMachine]] class.
     * @param {string} name The name of the [[StateMachine]].
     */
    function StateMachine(name) {
        _super.call(this, name, undefined);
        /**
         * Internal flag: false if the state machine model requires recompilation.
         * @private
         */
        this.clean = false;
    }
    /**
     * Returns the root [[StateMachine]].
     * @note that if this [[StateMachine]] is embeded within another, the ultimate root will be returned.
     */
    StateMachine.prototype.getRoot = function () {
        return this.region ? this.region.getRoot() : this;
    };
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitStateMachine]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param {Visitor<TArg1>} visitor The [[Visitor]] instance.
     * @param {TArg1} arg1 An optional argument to pass into the [[Visitor]].
     * @param {any} arg2 An optional argument to pass into the [[Visitor]].
     * @param {any} arg3 An optional argument to pass into the [[Visitor]].
     */
    StateMachine.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitStateMachine(this, arg1, arg2, arg3);
    };
    return StateMachine;
}(State));
exports.StateMachine = StateMachine;
/**
 * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
 *
 * Transitions come in a variety of types:
 * internal transitions respond to messages but do not cause a state transition, they only have behavior;
 * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
 * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
 *
 * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
 */
var Transition = (function () {
    /**
     * Creates a new instance of the Transition class.
     * @param {Vertex} source The source of the transition.
     * @param {Vertex} source The target of the transition; this is an optional parameter, omitting it will create an Internal transition.
     * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
     */
    function Transition(source, target, kind) {
        var _this = this;
        if (kind === void 0) { kind = TransitionKind.External; }
        // user defined behavior (via effect) executed when traversing this transition.
        /*internal*/ this.transitionBehavior = new Array();
        this.source = source;
        this.target = target;
        this.kind = target ? kind : TransitionKind.Internal;
        this.guard = source instanceof PseudoState ? Transition.TrueGuard : (function (message) { return message === _this.source; });
        this.source.outgoing.push(this);
        if (this.target) {
            this.target.incoming.push(this);
        }
        this.source.getRoot().clean = false;
    }
    /**
     * Turns a transition into an else transition.
     *
     * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
     */
    Transition.prototype.else = function () {
        this.guard = Transition.FalseGuard;
        return this;
    };
    /**
     * Defines the guard condition for the transition.
     * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed.
     */
    Transition.prototype.when = function (guard) {
        this.guard = guard;
        return this;
    };
    /**
     * Add behavior to a transition.
     * @param {Action} transitionAction The action to add to the transitions traversal behavior.
     */
    Transition.prototype.effect = function (transitionAction) {
        this.transitionBehavior.push(transitionAction);
        this.source.getRoot().clean = false;
        return this;
    };
    /**
     * Removes the transition from the state machine model
     */
    Transition.prototype.remove = function () {
        this.source.outgoing.splice(this.source.outgoing.indexOf(this), 1);
        if (this.target) {
            this.target.incoming.splice(this.target.incoming.indexOf(this), 1);
        }
        exports.console.log("remove " + this);
        this.source.getRoot().clean = false;
    };
    /**
     * Accepts an instance of a visitor and calls the visitTransition method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     */
    Transition.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitTransition(this, arg1, arg2, arg3);
    };
    /**
     * Returns a the transition name.
     */
    Transition.prototype.toString = function () {
        return "[ " + (this.target ? (this.source + " -> " + this.target) : this.source) + "]";
    };
    // the default guard condition for pseudo states
    /*internal*/ Transition.TrueGuard = function () { return true; };
    // used as the guard condition for else tranitions
    /*internal*/ Transition.FalseGuard = function () { return false; };
    return Transition;
}());
exports.Transition = Transition;
/**
 * A working implementation of the [[IInstance]] interface.
 * @note It is possible to create other custom state machine instance classes in other ways (e.g. as serialisable JSON); just implement the same members and methods as this class.
 */
var StateMachineInstance = (function () {
    /**
     * Creates a new instance of the [[StateMachineInstance]] class.
     * @param {string} name The optional name of the [[StateMachineInstance]].
     */
    function StateMachineInstance(name) {
        if (name === void 0) { name = "unnamed"; }
        /**
         * The last known state of any [[Region]] instance.
         */
        this.last = {};
        /**
         * Indicates that the [[StateMachine]] instance reached was terminated by reaching a [[Terminate]] [[PseudoState]].
         */
        this.isTerminated = false;
        this.name = name;
    }
    // Updates the last known state for a given region.
    /*internal*/ StateMachineInstance.prototype.setCurrent = function (region, state) {
        this.last[region.qualifiedName] = state;
    };
    // Returns the last known state for a given region.
    StateMachineInstance.prototype.getCurrent = function (region) {
        return this.last[region.qualifiedName];
    };
    /**
     * Returns the name of the state machine instance.
     */
    StateMachineInstance.prototype.toString = function () {
        return this.name;
    };
    return StateMachineInstance;
}());
exports.StateMachineInstance = StateMachineInstance;
/**
 * Implementation of a visitor pattern.
 * @param TArg1 The type of the first optional parameter in the visit methods.
 */
var Visitor = (function () {
    function Visitor() {
    }
    /**
     * Visits an element within a state machine model.
     * @param {Element} element the element being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitElement = function (element, arg1, arg2, arg3) {
    };
    /**
     * Visits a region within a state machine model.
     * @param {Region} region The region being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitRegion = function (region, arg1, arg2, arg3) {
        var result = this.visitElement(region, arg1, arg2, arg3);
        for (var _i = 0, _a = region.vertices; _i < _a.length; _i++) {
            var vertex = _a[_i];
            vertex.accept(this, arg1, arg2, arg3);
        }
        return result;
    };
    /**
     * Visits a vertex within a state machine model.
     * @param {Vertex} vertex The vertex being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitVertex = function (vertex, arg1, arg2, arg3) {
        var result = this.visitElement(vertex, arg1, arg2, arg3);
        for (var _i = 0, _a = vertex.outgoing; _i < _a.length; _i++) {
            var transition = _a[_i];
            transition.accept(this, arg1, arg2, arg3);
        }
        return result;
    };
    /**
     * @param {PseudoState} pseudoState The pseudo state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitPseudoState = function (pseudoState, arg1, arg2, arg3) {
        return this.visitVertex(pseudoState, arg1, arg2, arg3);
    };
    /**
     * Visits a state within a state machine model.
     * @param {State} state The state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitState = function (state, arg1, arg2, arg3) {
        var result = this.visitVertex(state, arg1, arg2, arg3);
        for (var _i = 0, _a = state.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, arg1, arg2, arg3);
        }
        return result;
    };
    /**
     * Visits a final state within a state machine model.
     * @param {FinalState} finalState The final state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitFinalState = function (finalState, arg1, arg2, arg3) {
        return this.visitState(finalState, arg1, arg2, arg3);
    };
    /**
     * Visits a state machine within a state machine model.
     * @param {StateMachine} state machine The state machine being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitStateMachine = function (model, arg1, arg2, arg3) {
        return this.visitState(model, arg1, arg2, arg3);
    };
    /**
     * Visits a transition within a state machine model.
     * @param {Transition} transition The transition being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     */
    Visitor.prototype.visitTransition = function (transition, arg1, arg2, arg3) {
    };
    return Visitor;
}());
exports.Visitor = Visitor;
/**
 * Determines if a vertex is currently active; that it has been entered but not yet exited.
 * @param {Vertex} vertex The vertex to test.
 * @param {IInstance} instance The instance of the state machine model.
 */
function isActive(vertex, instance) {
    return vertex.region ? (isActive(vertex.region.state, instance) && (instance.getCurrent(vertex.region) === vertex)) : true;
}
exports.isActive = isActive;
/**
 * Tests an element within a state machine instance to see if its lifecycle is complete.
 * @param {Region | State} element The element to test.
 * @param {IInstance} instance The instance of the state machine model to test for completeness.
 */
function isComplete(element, instance) {
    if (element instanceof Region) {
        return instance.getCurrent(element).isFinal();
    }
    else {
        return element.regions.every(function (region) { return isComplete(region, instance); });
    }
}
exports.isComplete = isComplete;
// the default method used to produce a random number; defaulting to simplified implementation seen in Mozilla Math.random() page; may be overriden for testing
var defaultRandom = function (max) {
    return Math.floor(Math.random() * max);
};
/**
 * concatenates arrays containing transition behavior.
 * @private
 */
function push(to) {
    var actions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        actions[_i - 1] = arguments[_i];
    }
    for (var _a = 0, actions_1 = actions; _a < actions_1.length; _a++) {
        var set = actions_1[_a];
        for (var _b = 0, set_1 = set; _b < set_1.length; _b++) {
            var action = set_1[_b];
            to.push(action);
        }
    }
}
// invokes transition behavior
function invoke(to, message, instance, deepHistory) {
    if (deepHistory === void 0) { deepHistory = false; }
    for (var _i = 0, to_1 = to; _i < to_1.length; _i++) {
        var action = to_1[_i];
        action(message, instance, deepHistory);
    }
}
/**
 * The function used for to generate random numbers; may be overriden for testing purposes.
 */
exports.random = defaultRandom;
/**
 * Initialises a state machine and/or state machine model.
 *
 * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
 * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param {IInstance} instance The optional state machine instance to initialise.
 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 */
function initialise(model, instance, autoInitialiseModel) {
    if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
    if (instance) {
        // initialise the state machine model if necessary
        if (autoInitialiseModel && model.clean === false) {
            initialise(model);
        }
        // log as required
        exports.console.log("initialise " + instance);
        // enter the state machine instance for the first time
        invoke(model.onInitialise, undefined, instance);
    }
    else {
        // log as required
        exports.console.log("initialise " + model.name);
        // initialise the state machine model
        model.accept(new InitialiseElements(), false);
        model.clean = true;
    }
}
exports.initialise = initialise;
/**
 * Passes a message to a state machine for evaluation; messages trigger state transitions.
 * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param {IInstance} instance The instance of the state machine model to evaluate the message against.
 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 */
function evaluate(model, instance, message, autoInitialiseModel) {
    if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
    // initialise the state machine model if necessary
    // TODO: take this out
    if (autoInitialiseModel && model.clean === false) {
        initialise(model);
    }
    // log as required
    exports.console.log(instance + " evaluate " + message);
    // terminated state machine instances will not evaluate messages
    if (instance.isTerminated) {
        return false;
    }
    return evaluateState(model, instance, message);
}
exports.evaluate = evaluate;
/**
 * Evaluates messages against a state, executing transitions as appropriate.
 * @private
 */
function evaluateState(state, instance, message) {
    var result = false;
    // delegate to child regions first if a non-continuation
    if (message !== state) {
        state.regions.every(function (region) {
            if (evaluateState(instance.getCurrent(region), instance, message)) {
                result = true;
                return isActive(state, instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
            }
            return true; // NOTE: this just controls the every loop
        });
    }
    // if a transition occured in a child region, check for completions
    if (result) {
        if ((message !== state) && isComplete(state, instance)) {
            evaluateState(state, instance, state);
        }
    }
    else {
        // otherwise look for a transition from this state
        var transitions = state.outgoing.filter(function (transition) { return transition.guard(message, instance); });
        if (transitions.length === 1) {
            // execute if a single transition was found
            result = traverse(transitions[0], instance, message);
        }
        else if (transitions.length > 1) {
            // error if multiple transitions evaluated true
            exports.console.error(state + ": multiple outbound transitions evaluated true for message " + message);
        }
    }
    return result;
}
/**
 * Traverses a transition.
 * @private
 */
function traverse(transition, instance, message) {
    var tran = transition;
    var target = tran.target;
    var onTraverse = new Array();
    push(onTraverse, tran.onTraverse);
    // process static conditional branches - build up all the transition behavior prior to executing
    while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
        // proceed to the next transition
        tran = selectTransition(target, instance, message);
        target = tran.target;
        // concatenate behavior before and after junctions
        push(onTraverse, tran.onTraverse);
    }
    // execute the transition behavior
    invoke(onTraverse, message, instance);
    if (target) {
        // process dynamic conditional branches as required
        if (target instanceof PseudoState && target.kind === PseudoStateKind.Choice) {
            traverse(selectTransition(target, instance, message), instance, message);
        }
        else if (target instanceof State && isComplete(target, instance)) {
            evaluateState(target, instance, target);
        }
    }
    return true;
}
/**
 * Select next leg of composite transitions after choice and junction pseudo states.
 * @private
 */
function selectTransition(pseudoState, instance, message) {
    var results = pseudoState.outgoing.filter(function (transition) { return transition.guard(message, instance); });
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return results.length !== 0 ? results[exports.random(results.length)] : findElse(pseudoState);
    }
    else {
        if (results.length > 1) {
            exports.console.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
        }
        else {
            return results[0] || findElse(pseudoState);
        }
    }
}
/**
 * Look for else transitions from a junction or choice.
 * @private
 */
function findElse(pseudoState) {
    return pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.FalseGuard; })[0];
}
/**
 * Interface used to temporarily hold element behavior during [[StateMachine]] initialisation.
 * @private
 */
var ElementBehavior = (function () {
    function ElementBehavior() {
        /**
         * The [[Action]]s to execute when leaving an [[Element]] during a state transition (including and cascaded [[Action]]s).
         */
        this.leave = new Array();
        /**
         * The initial [[Action]]s to execute when entering an [[Element]] during a state transition
         */
        this.beginEnter = new Array();
        /**
         * The follow-on [[Action]]s to execute when entering an [[Element]] during a state transition (including and cascaded [[Action]]s).
         */
        this.endEnter = new Array();
    }
    /**
     * The full set of [[Action]]s to execute when entering an [[Element]] during a state transition (including and cascaded [[Action]]s).
     */
    ElementBehavior.prototype.enter = function () {
        var result = new Array();
        push(result, this.beginEnter, this.endEnter);
        return result;
    };
    return ElementBehavior;
}());
/**
 * Initialises the transitions within a [[StateMachine]].
 * @private
 */
var InitialiseTransitions = (function (_super) {
    __extends(InitialiseTransitions, _super);
    function InitialiseTransitions() {
        _super.apply(this, arguments);
    }
    InitialiseTransitions.prototype.visitTransition = function (transition, behavior) {
        // reset transition behavior
        transition.onTraverse = new Array();
        // initialise transition behavior based on transition kind
        switch (transition.kind) {
            case TransitionKind.Internal:
                this.visitInternalTransition(transition, behavior);
                break;
            case TransitionKind.Local:
                this.visitLocalTransition(transition, behavior);
                break;
            case TransitionKind.External:
                this.visitExternalTransition(transition, behavior);
                break;
        }
    };
    // initialise internal transitions: these do not leave the source state
    InitialiseTransitions.prototype.visitInternalTransition = function (transition, behavior) {
        // perform the transition behavior
        push(transition.onTraverse, transition.transitionBehavior);
        // add a test for completion
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push(function (message, instance) {
                var state = transition.source; // NOTE: internal transitions source
                // fire a completion transition
                if (isComplete(state, instance)) {
                    evaluateState(state, instance, state);
                }
            });
        }
    };
    // initialise transitions within the same region
    InitialiseTransitions.prototype.visitLocalTransition = function (transition, behavior) {
        var _this = this;
        transition.onTraverse.push(function (message, instance) {
            var targetAncestors = transition.target.ancestry();
            var i = 0;
            // find the first inactive element in the target ancestry
            while (isActive(targetAncestors[i], instance)) {
                ++i;
            }
            // exit the active sibling
            invoke(behavior(instance.getCurrent(targetAncestors[i].region)).leave, message, instance);
            // perform the transition action;
            invoke(transition.transitionBehavior, message, instance);
            // enter the target ancestry
            while (i < targetAncestors.length) {
                _this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], function (behavior) { return invoke(behavior, message, instance); });
            }
            // trigger cascade
            invoke(behavior(transition.target).endEnter, message, instance);
        });
    };
    // initialise external transitions: these are abritarily complex
    InitialiseTransitions.prototype.visitExternalTransition = function (transition, behavior) {
        var sourceAncestors = transition.source.ancestry(), targetAncestors = transition.target.ancestry();
        var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
        // find the index of the first uncommon ancestor (or for external transitions, the source)
        while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
            --i;
        }
        // leave source ancestry as required and perform the transition effect
        push(transition.onTraverse, behavior(sourceAncestors[i]).leave, transition.transitionBehavior);
        // enter the target ancestry
        while (i < targetAncestors.length) {
            this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], function (behavior) { return push(transition.onTraverse, behavior); });
        }
        // trigger cascade
        push(transition.onTraverse, behavior(transition.target).endEnter);
    };
    InitialiseTransitions.prototype.cascadeElementEntry = function (transition, behavior, element, next, task) {
        task(behavior(element).beginEnter);
        if (next && element instanceof State) {
            for (var _i = 0, _a = element.regions; _i < _a.length; _i++) {
                var region = _a[_i];
                task(behavior(region).beginEnter);
                if (region !== next.region) {
                    task(behavior(region).endEnter);
                }
            }
        }
    };
    return InitialiseTransitions;
}(Visitor));
/**
 * Bootstraps all the elements within a state machine model
 * @private
 */
var InitialiseElements = (function (_super) {
    __extends(InitialiseElements, _super);
    function InitialiseElements() {
        _super.apply(this, arguments);
        this.behaviors = {};
    }
    InitialiseElements.prototype.behavior = function (element) {
        return this.behaviors[element.qualifiedName] || (this.behaviors[element.qualifiedName] = new ElementBehavior());
    };
    InitialiseElements.prototype.visitElement = function (element, deepHistoryAbove) {
        if (exports.console !== defaultConsole) {
            this.behavior(element).leave.push(function (message, instance) { return exports.console.log(instance + " enter " + element); });
            this.behavior(element).beginEnter.push(function (message, instance) { return exports.console.log(instance + " enter " + element); });
        }
    };
    InitialiseElements.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionInitial = region.vertices.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() ? vertex : result; }, undefined);
        for (var _i = 0, _a = region.vertices; _i < _a.length; _i++) {
            var vertex = _a[_i];
            vertex.accept(this, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory));
        }
        // leave the curent active child state when exiting the region
        this.behavior(region).leave.push(function (message, instance) { return invoke(_this.behavior(instance.getCurrent(region)).leave, message, instance); });
        // enter the appropriate child vertex when entering the region
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.behavior(region).endEnter.push(function (message, instance, deepHistory) { return invoke((_this.behavior((deepHistory || regionInitial.isHistory()) ? instance.getCurrent(region) || regionInitial : regionInitial)).enter(), message, instance, deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory); });
        }
        else {
            push(this.behavior(region).endEnter, this.behavior(regionInitial).enter());
        }
        this.visitElement(region, deepHistoryAbove);
    };
    InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        if (pseudoState.isInitial()) {
            this.behavior(pseudoState).endEnter.push(function (message, instance, deepHistory) {
                if (instance.getCurrent(pseudoState.region)) {
                    invoke(_this.behavior(pseudoState).leave, message, instance);
                    invoke(_this.behavior(instance.getCurrent(pseudoState.region)).enter(), message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                }
                else {
                    traverse(pseudoState.outgoing[0], instance);
                }
            });
        }
        else if (pseudoState.kind === PseudoStateKind.Terminate) {
            // terminate the state machine instance upon transition to a terminate pseudo state
            this.behavior(pseudoState).beginEnter.push(function (message, instance) { return instance.isTerminated = true; });
        }
    };
    InitialiseElements.prototype.visitState = function (state, deepHistoryAbove) {
        // NOTE: manually iterate over the child regions to control the sequence of behavior
        for (var _i = 0, _a = state.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            push(this.behavior(state).leave, this.behavior(region).leave);
            push(this.behavior(state).endEnter, this.behavior(region).enter());
        }
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behavior when entering and exiting states
        push(this.behavior(state).leave, state.exitBehavior);
        push(this.behavior(state).beginEnter, state.entryBehavior);
        // update the parent regions current state
        this.behavior(state).beginEnter.push(function (message, instance) {
            if (state.region) {
                instance.setCurrent(state.region, state);
            }
        });
    };
    InitialiseElements.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
        // initiaise all the transitions once all the elements have been initialised
        stateMachine.accept(new InitialiseTransitions(), function (element) { return _this.behavior(element); });
        // define the behavior for initialising a state machine instance
        stateMachine.onInitialise = this.behavior(stateMachine).enter();
    };
    return InitialiseElements;
}(Visitor));
// the default implemention of the console
var defaultConsole = {
    log: function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
    },
    warn: function (message) {
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
/**
 * The object used for log, warning and error messages
 */
exports.console = defaultConsole;
/**
 * Flag to trigger internal transitions to trigger completion events for state they are in
 */
exports.internalTransitionsTriggerCompletion = false;
/**
 * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
 * @param {StateMachine} model The state machine model to validate.
 */
function validate(model) {
    model.accept(new Validator());
}
exports.validate = validate;
var Validator = (function (_super) {
    __extends(Validator, _super);
    function Validator() {
        _super.apply(this, arguments);
    }
    Validator.prototype.visitPseudoState = function (pseudoState) {
        _super.prototype.visitPseudoState.call(this, pseudoState);
        if (pseudoState.kind === PseudoStateKind.Choice || pseudoState.kind === PseudoStateKind.Junction) {
            // [7] In a complete statemachine, a junction vertex must have at least one incoming and one outgoing transition.
            // [8] In a complete statemachine, a choice vertex must have at least one incoming and one outgoing transition.
            if (pseudoState.outgoing.length === 0) {
                exports.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states must have at least one outgoing transition.");
            }
            // choice and junction pseudo state can have at most one else transition
            if (pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.FalseGuard; }).length > 1) {
                exports.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have more than one Else transitions.");
            }
        }
        else {
            // non choice/junction pseudo state may not have else transitions
            if (pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.FalseGuard; }).length !== 0) {
                exports.console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have Else transitions.");
            }
            if (pseudoState.isInitial()) {
                if (pseudoState.outgoing.length > 1) {
                    // [1] An initial vertex can have at most one outgoing transition.
                    // [2] History vertices can have at most one outgoing transition.
                    exports.console.error(pseudoState + ": initial pseudo states must have no more than one outgoing transition.");
                }
                else if (pseudoState.outgoing.length === 1) {
                    // [9] The outgoing transition from an initial vertex may have a behavior, but not a trigger or guard.
                    if (pseudoState.outgoing[0].guard !== Transition.TrueGuard) {
                        exports.console.error(pseudoState + ": initial pseudo states cannot have a guard condition.");
                    }
                }
            }
        }
    };
    Validator.prototype.visitRegion = function (region) {
        _super.prototype.visitRegion.call(this, region);
        // [1] A region can have at most one initial vertex.
        // [2] A region can have at most one deep history vertex.
        // [3] A region can have at most one shallow history vertex.
        var initial = 0, deepHistory = 0, shallowHistory = 0;
        for (var _i = 0, _a = region.vertices; _i < _a.length; _i++) {
            var vertex = _a[_i];
            if (vertex instanceof PseudoState) {
                if (vertex.kind === PseudoStateKind.Initial) {
                    initial++;
                }
                else if (vertex.kind === PseudoStateKind.DeepHistory) {
                    deepHistory++;
                }
                else if (vertex.kind === PseudoStateKind.ShallowHistory) {
                    shallowHistory++;
                }
            }
        }
        if (initial > 1) {
            exports.console.error(region + ": regions may have at most one initial pseudo state.");
        }
        if (deepHistory > 1) {
            exports.console.error(region + ": regions may have at most one deep history pseudo state.");
        }
        if (shallowHistory > 1) {
            exports.console.error(region + ": regions may have at most one shallow history pseudo state.");
        }
    };
    Validator.prototype.visitState = function (state) {
        _super.prototype.visitState.call(this, state);
        if (state.regions.filter(function (region) { return region.name === Region.defaultName; }).length > 1) {
            exports.console.error(state + ": a state cannot have more than one region named " + Region.defaultName);
        }
    };
    Validator.prototype.visitFinalState = function (finalState) {
        _super.prototype.visitFinalState.call(this, finalState);
        // [1] A final state cannot have any outgoing transitions.
        if (finalState.outgoing.length !== 0) {
            exports.console.error(finalState + ": final states must not have outgoing transitions.");
        }
        // [2] A final state cannot have regions.
        if (finalState.regions.length !== 0) {
            exports.console.error(finalState + ": final states must not have child regions.");
        }
        // [4] A final state has no entry behavior.
        if (finalState.entryBehavior.length > 0) {
            exports.console.warn(finalState + ": final states may not have entry behavior.");
        }
        // [5] A final state has no exit behavior.
        if (finalState.exitBehavior.length > 0) {
            exports.console.warn(finalState + ": final states may not have exit behavior.");
        }
    };
    Validator.prototype.visitTransition = function (transition) {
        _super.prototype.visitTransition.call(this, transition);
        // Local transition target vertices must be a child of the source vertex
        if (transition.kind === TransitionKind.Local) {
            if (transition.target.ancestry().indexOf(transition.source) === -1) {
                exports.console.error(transition + ": local transition target vertices must be a child of the source composite sate.");
            }
        }
    };
    return Validator;
}(Visitor));
