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
 * An enumeration of static constants that dictates the precise behavior of pseudo states.
 *
 * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
 * @class PseudoStateKind
 */
(function (PseudoStateKind) {
    /**
     * Used for pseudo states that are always the staring point when entering their parent region.
     * @member {PseudoStateKind} Initial
     */
    PseudoStateKind[PseudoStateKind["Initial"] = 0] = "Initial";
    /**
     * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
     * @member {PseudoStateKind} ShallowHistory
     */
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 1] = "ShallowHistory";
    /**
     * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
     * @member {PseudoStateKind} DeepHistory
     */
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 2] = "DeepHistory";
    /**
     * Enables a dynamic conditional branches; within a compound transition.
     * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
     * if a single transition is found, it will be traversed;
     * if many transitions are found, an arbitary one will be selected and traversed;
     * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     * @member {PseudoStateKind} Choice
     */
    PseudoStateKind[PseudoStateKind["Choice"] = 3] = "Choice";
    /**
     * Enables a static conditional branches; within a compound transition.
     * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
     * if a single transition is found, it will be traversed;
     * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     * @member {PseudoStateKind} Junction
     */
    PseudoStateKind[PseudoStateKind["Junction"] = 4] = "Junction";
    /**
     * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
     * @member {PseudoStateKind} Terminate
     */
    PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
})(exports.PseudoStateKind || (exports.PseudoStateKind = {}));
var PseudoStateKind = exports.PseudoStateKind;
/**
 * An enumeration of static constants that dictates the precise behavior of transitions.
 *
 * Use these constants as the `kind` parameter when creating new `Transition` instances.
 * @class TransitionKind
 */
(function (TransitionKind) {
    /**
     * The transition, if triggered, occurs without exiting or entering the source state.
     * Thus, it does not cause a state change. This means that the entry or exit condition of the source state will not be invoked.
     * An internal transition can be taken even if the state machine is in one or more regions nested within this state.
     * @member {TransitionKind} Internal
     */
    TransitionKind[TransitionKind["Internal"] = 0] = "Internal";
    /**
     * The transition, if triggered, will not exit the composite (source) state, but will enter the non-active target vertex ancestry.
     * @member {TransitionKind} Local
     */
    TransitionKind[TransitionKind["Local"] = 1] = "Local";
    /**
     * The transition, if triggered, will exit the source vertex.
     * @member {TransitionKind} External
     */
    TransitionKind[TransitionKind["External"] = 2] = "External";
})(exports.TransitionKind || (exports.TransitionKind = {}));
var TransitionKind = exports.TransitionKind;
var Actions = (function (_super) {
    __extends(Actions, _super);
    function Actions() {
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i - 0] = arguments[_i];
        }
        _super.call(this);
        this.apply(actions);
    }
    Actions.prototype.pushh = function () {
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i - 0] = arguments[_i];
        }
        this.apply(actions);
    };
    Actions.prototype.apply = function (actions) {
        for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
            var set = actions_1[_i];
            for (var _a = 0, set_1 = set; _a < set_1.length; _a++) {
                var action = set_1[_a];
                this.push(action);
            }
        }
    };
    Actions.prototype.invoke = function (message, instance, history) {
        if (history === void 0) { history = false; }
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var action = _a[_i];
            action(message, instance, history);
        }
    };
    return Actions;
}(Array));
exports.Actions = Actions;
/**
 * An abstract class used as the base for the Region and Vertex classes.
 * An element is a node within the tree structure that represents a composite state machine model.
 * @class Element
 */
var Element = (function () {
    /**
     * Creates a new instance of the element class.
     * @param {string} name The name of the element.
     */
    function Element(name, parent) {
        this.name = name;
        this.qualifiedName = parent ? (parent.qualifiedName + Element.namespaceSeparator + name) : name;
    }
    /**
     * Returns a the element name as a fully qualified namespace.
     * @method toString
     * @returns {string}
     */
    Element.prototype.toString = function () {
        return this.qualifiedName;
    };
    /**
     * The symbol used to separate element names within a fully qualified name.
     * Change this static member to create different styles of qualified name generated by the toString method.
     * @member {string}
     */
    Element.namespaceSeparator = ".";
    return Element;
}());
exports.Element = Element;
/**
 * An element within a state machine model that is a container of Vertices.
 *
 * Regions are implicitly inserted into composite state machines as a container for vertices.
 * They only need to be explicitly defined if orthogonal states are required.
 *
 * Region extends the Element class and inherits its public interface.
 * @class Region
 * @augments Element
 */
var Region = (function (_super) {
    __extends(Region, _super);
    /**
     * Creates a new instance of the Region class.
     * @param {string} name The name of the region.
     * @param {State} state The parent state that this region will be a child of.
     */
    function Region(name, state) {
        _super.call(this, name, state);
        /**
         * The set of vertices that are children of the region.
         * @member {Array<Vertex>}
         */
        this.vertices = new Array();
        this.state = state;
        this.state.regions.push(this);
        this.state.getRoot().clean = false;
    }
    /**
     * Removes the state from the state machine model
     * @method remove
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
     * Returns the root element within the state machine model.
     * @method getRoot
     * @returns {StateMachine} The root state machine element.
     */
    Region.prototype.getRoot = function () {
        return this.state.getRoot();
    };
    /**
     * Accepts an instance of a visitor and calls the visitRegion method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    Region.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitRegion(this, arg1, arg2, arg3);
    };
    /**
     * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
     * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
     * Update this static member to use a different name for default regions.
     * @member {string}
     */
    Region.defaultName = "default";
    return Region;
}(Element));
exports.Region = Region;
/**
 * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
 *
 * Vertex extends the Element class and inherits its public interface.
 * @class Vertex
 * @augments Element
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
         * @member {Array<Transition>}
         */
        this.outgoing = new Array();
        /**
         * The set of transitions targeting this vertex.
         * @member {Array<Transition>}
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
    // returns the ancestry of this vertex
    /*internal*/ Vertex.prototype.ancestry = function () {
        return (this.region ? this.region.state.ancestry() : new Array()).concat(this);
    };
    /**
     * Returns the root element within the state machine model.
     * @method getRoot
     * @returns {StateMachine} The root state machine element.
     */
    Vertex.prototype.getRoot = function () {
        return this.region.getRoot();
    };
    /**
     * Removes the vertex from the state machine model
     * @method remove
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
     * @method to
     * @param {Vertex} target The destination of the transition; omit for internal transitions.
     * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
     * @returns {Transition} The new transition object.
     */
    Vertex.prototype.to = function (target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        return new Transition(this, target, kind);
    };
    return Vertex;
}(Element));
exports.Vertex = Vertex;
/**
 * An element within a state machine model that represents an transitory Vertex within the state machine model.
 *
 * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
 * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
 * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
 *
 * PseudoState extends the Vertex class and inherits its public interface.
 * @class PseudoState
 * @augments Vertex
 */
var PseudoState = (function (_super) {
    __extends(PseudoState, _super);
    /**
     * Creates a new instance of the PseudoState class.
     * @param {string} name The name of the pseudo state.
     * @param {Region | State} parent The parent element that this pseudo state will be a child of.
     * @param {PseudoStateKind} kind Determines the behavior of the PseudoState.
     */
    function PseudoState(name, parent, kind) {
        if (kind === void 0) { kind = PseudoStateKind.Initial; }
        _super.call(this, name, parent);
        this.kind = kind;
    }
    /**
     * Tests a pseudo state to determine if it is a history pseudo state.
     * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
     * @method isHistory
     * @returns {boolean} True if the pseudo state is a history pseudo state.
     */
    PseudoState.prototype.isHistory = function () {
        return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
    };
    /**
     * Tests a pseudo state to determine if it is an initial pseudo state.
     * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
     * @method isInitial
     * @returns {boolean} True if the pseudo state is an initial pseudo state.
     */
    PseudoState.prototype.isInitial = function () {
        return this.kind === PseudoStateKind.Initial || this.isHistory();
    };
    /**
     * Accepts an instance of a visitor and calls the visitPseudoState method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    PseudoState.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitPseudoState(this, arg1, arg2, arg3);
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
/**
 * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
 *
 * States are one of the fundamental building blocks of the state machine model.
 * Behavior can be defined for both state entry and state exit.
 *
 * State extends the Vertex class and inherits its public interface.
 * @class State
 * @augments Vertex
 */
var State = (function (_super) {
    __extends(State, _super);
    /**
     * Creates a new instance of the State class.
     * @param {string} name The name of the state.
     * @param {Region | State} parent The parent state that owns the state.
     */
    function State(name, parent) {
        _super.call(this, name, parent);
        // user defined behavior (via exit method) to execute when exiting a state.
        /* internal */ this.exitBehavior = new Actions();
        // user defined behavior (via entry method) to execute when entering a state.
        /* internal */ this.entryBehavior = new Actions();
        /**
         * The set of regions under this state.
         * @member {Array<Region>}
         */
        this.regions = new Array();
    }
    /**
     * Returns the default region for the state.
     * Note, this will create the default region if it does not already exist.
     * @method defaultRegion
     * @returns {Region} The default region.
     */
    State.prototype.defaultRegion = function () {
        return this.regions.reduce(function (result, region) { return region.name === Region.defaultName ? region : result; }, undefined) || new Region(Region.defaultName, this);
    };
    /**
     * Tests the state to see if it is a final state;
     * a final state is one that has no outbound transitions.
     * @method isFinal
     * @returns {boolean} True if the state is a final state.
     */
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    /**
     * Tests the state to see if it is a simple state;
     * a simple state is one that has no child regions.
     * @method isSimple
     * @returns {boolean} True if the state is a simple state.
     */
    State.prototype.isSimple = function () {
        return this.regions.length === 0;
    };
    /**
     * Tests the state to see if it is a composite state;
     * a composite state is one that has one or more child regions.
     * @method isComposite
     * @returns {boolean} True if the state is a composite state.
     */
    State.prototype.isComposite = function () {
        return this.regions.length > 0;
    };
    /**
     * Tests the state to see if it is an orthogonal state;
     * an orthogonal state is one that has two or more child regions.
     * @method isOrthogonal
     * @returns {boolean} True if the state is an orthogonal state.
     */
    State.prototype.isOrthogonal = function () {
        return this.regions.length > 1;
    };
    /**
     * Removes the state from the state machine model
     * @method remove
     */
    State.prototype.remove = function () {
        for (var _i = 0, _a = this.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.remove();
        }
        _super.prototype.remove.call(this);
    };
    /**
     * Adds behavior to a state that is executed each time the state is exited.
     * @method exit
     * @param {(message?: any, instance?: IInstance, history?: boolean) => any} exitAction The action to add to the state's exit behavior.
     * @returns {State} Returns the state to allow a fluent style API.
     */
    State.prototype.exit = function (exitAction) {
        this.exitBehavior.push(exitAction);
        this.getRoot().clean = false;
        return this;
    };
    /**
     * Adds behavior to a state that is executed each time the state is entered.
     * @method entry
     * @param {(message?: any, instance?: IInstance, history?: boolean) => any} entryAction The action to add to the state's entry behavior.
     * @returns {State} Returns the state to allow a fluent style API.
     */
    State.prototype.entry = function (entryAction) {
        this.entryBehavior.push(entryAction);
        this.getRoot().clean = false;
        return this;
    };
    /**
     * Accepts an instance of a visitor and calls the visitState method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    State.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitState(this, arg1, arg2, arg3);
    };
    return State;
}(Vertex));
exports.State = State;
/**
 * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
 *
 * A final state cannot have outbound transitions.
 *
 * FinalState extends the State class and inherits its public interface.
 * @class FinalState
 * @augments State
 */
var FinalState = (function (_super) {
    __extends(FinalState, _super);
    /**
     * Creates a new instance of the FinalState class.
     * @param {string} name The name of the final state.
     * @param {Region | State} parent The parent element that owns the final state.
     */
    function FinalState(name, parent) {
        _super.call(this, name, parent);
    }
    /**
     * Accepts an instance of a visitor and calls the visitFinalState method on it.
     * @method accept
     * @param {Visitor<TArg>} visitor The visitor instance.
     * @param {TArg} arg An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    FinalState.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitFinalState(this, arg1, arg2, arg3);
    };
    return FinalState;
}(State));
exports.FinalState = FinalState;
/**
 * An element within a state machine model that represents the root of the state machine model.
 *
 * StateMachine extends the State class and inherits its public interface.
 * @class StateMachine
 * @augments State
 */
var StateMachine = (function (_super) {
    __extends(StateMachine, _super);
    /**
     * Creates a new instance of the StateMachine class.
     * @param {string} name The name of the state machine.
     */
    function StateMachine(name) {
        _super.call(this, name, undefined);
        // flag used to indicate that the state machine model has has structural changes and therefore requires initialising.
        /*internal*/ this.clean = false;
    }
    /**
     * Returns the root element within the state machine model.
     * Note that if this state machine is embeded within another state machine, the ultimate root element will be returned.
     * @method getRoot
     * @returns {StateMachine} The root state machine element.
     */
    StateMachine.prototype.getRoot = function () {
        return this.region ? this.region.getRoot() : this;
    };
    /**
     * Accepts an instance of a visitor and calls the visitStateMachine method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
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
 * @class Transition
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
        /*internal*/ this.transitionBehavior = new Actions();
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
     * @method else
     * @returns {Transition} Returns the transition object to enable the fluent API.
     */
    Transition.prototype.else = function () {
        this.guard = Transition.FalseGuard;
        return this;
    };
    /**
     * Defines the guard condition for the transition.
     * @method when
     * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed.
     * @returns {Transition} Returns the transition object to enable the fluent API.
     */
    Transition.prototype.when = function (guard) {
        this.guard = guard;
        return this;
    };
    /**
     * Add behavior to a transition.
     * @method effect
     * @param {(message?: any, instance?: IInstance, history?: boolean) => any} transitionAction The action to add to the transitions traversal behavior.
     * @returns {Transition} Returns the transition object to enable the fluent API.
     */
    Transition.prototype.effect = function (transitionAction) {
        this.transitionBehavior.push(transitionAction);
        this.source.getRoot().clean = false;
        return this;
    };
    /**
     * Removes the transition from the state machine model
     * @method remove
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
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    Transition.prototype.accept = function (visitor, arg1, arg2, arg3) {
        return visitor.visitTransition(this, arg1, arg2, arg3);
    };
    /**
     * Returns a the transition name.
     * @method toString
     * @returns {string}
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
 * Default working implementation of a state machine instance class.
 *
 * Implements the `IInstance` interface.
 * It is possible to create other custom instance classes to manage state machine state in other ways (e.g. as serialisable JSON); just implement the same members and methods as this class.
 * @class StateMachineInstance
 * @implements IInstance
 */
var StateMachineInstance = (function () {
    /**
     * Creates a new instance of the state machine instance class.
     * @param {string} name The optional name of the state machine instance.
     */
    function StateMachineInstance(name) {
        if (name === void 0) { name = "unnamed"; }
        this.last = [];
        /**
         * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
         * @member isTerminated
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
     * @method toString
     * @returns {string} The name of the state machine instance.
     */
    StateMachineInstance.prototype.toString = function () {
        return this.name;
    };
    return StateMachineInstance;
}());
exports.StateMachineInstance = StateMachineInstance;
/**
 * Implementation of a visitor pattern.
 * @class Visitor
 */
var Visitor = (function () {
    function Visitor() {
    }
    /**
     * Visits an element within a state machine model.
     * @method visitElement
     * @param {Element} element the element being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitElement = function (element, arg1, arg2, arg3) {
    };
    /**
     * Visits a region within a state machine model.
     * @method visitRegion
     * @param {Region} region The region being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
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
     * @method visitVertex
     * @param {Vertex} vertex The vertex being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
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
     * Visits a pseudo state within a state machine model.
     * @method visitPseudoState
     * @param {PseudoState} pseudoState The pseudo state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitPseudoState = function (pseudoState, arg1, arg2, arg3) {
        return this.visitVertex(pseudoState, arg1, arg2, arg3);
    };
    /**
     * Visits a state within a state machine model.
     * @method visitState
     * @param {State} state The state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
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
     * @method visitFinal
     * @param {FinalState} finalState The final state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitFinalState = function (finalState, arg1, arg2, arg3) {
        return this.visitState(finalState, arg1, arg2, arg3);
    };
    /**
     * Visits a state machine within a state machine model.
     * @method visitVertex
     * @param {StateMachine} state machine The state machine being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitStateMachine = function (model, arg1, arg2, arg3) {
        return this.visitState(model, arg1, arg2, arg3);
    };
    /**
     * Visits a transition within a state machine model.
     * @method visitTransition
     * @param {Transition} transition The transition being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitTransition = function (transition, arg1, arg2, arg3) {
    };
    return Visitor;
}());
exports.Visitor = Visitor;
/**
 * Determines if a vertex is currently active; that it has been entered but not yet exited.
 * @function isActive
 * @param {Vertex} vertex The vertex to test.
 * @param {IInstance} instance The instance of the state machine model.
 * @returns {boolean} True if the vertex is active.
 */
function isActive(vertex, instance) {
    return vertex.region ? (isActive(vertex.region.state, instance) && (instance.getCurrent(vertex.region) === vertex)) : true;
}
exports.isActive = isActive;
/**
 * Tests an element within a state machine instance to see if its lifecycle is complete.
 * @function isComplete
 * @param {Region | State} element The element to test.
 * @param {IInstance} instance The instance of the state machine model to test for completeness.
 * @returns {boolean} True if the element is complete.
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
/**
 * Sets a method to select an integer random number less than the max value passed as a parameter.
 *
 * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
 * @function setRandom
 * @param {function} generator A function that takes a max value and returns a random number between 0 and max - 1.
 * @returns A random number between 0 and max - 1
 */
function setRandom(generator) {
    random = generator;
}
exports.setRandom = setRandom;
/**
 * Returns the current method used to select an integer random number less than the max value passed as a parameter.
 *
 * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
 * @function getRandom
 * @returns {function} The function that takes a max value and returns a random number between 0 and max - 1.
 */
function getRandom() {
    return random;
}
exports.getRandom = getRandom;
// the default method used to produce a random number; defaulting to simplified implementation seen in Mozilla Math.random() page; may be overriden for testing
var random = function (max) {
    return Math.floor(Math.random() * max);
};
/**
 * Initialises a state machine and/or state machine model.
 *
 * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
 * @function initialise
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
        model.onInitialise.invoke(undefined, instance);
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
 * @function evaluate
 * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param {IInstance} instance The instance of the state machine model to evaluate the message against.
 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 * @returns {boolean} True if the message triggered a state transition.
 */
function evaluate(model, instance, message, autoInitialiseModel) {
    if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
    // initialise the state machine model if necessary
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
// evaluates messages against a state, executing transitions as appropriate
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
// traverses a transition
function traverse(transition, instance, message) {
    var tran = transition;
    var target = tran.target;
    var onTraverse = new Actions(tran.onTraverse);
    // process static conditional branches - build up all the transition behaviour prior to executing
    while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
        // proceed to the next transition
        tran = selectTransition(target, instance, message);
        target = tran.target;
        // concatenate behavior before and after junctions
        onTraverse.pushh(tran.onTraverse);
    }
    // execute the transition behavior
    onTraverse.invoke(message, instance);
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
// select next leg of composite transitions after choice and junction pseudo states
function selectTransition(pseudoState, instance, message) {
    var results = pseudoState.outgoing.filter(function (transition) { return transition.guard(message, instance); });
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return results.length !== 0 ? results[getRandom()(results.length)] : findElse(pseudoState);
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
// look for else transitions from a junction or choice
function findElse(pseudoState) {
    return pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.FalseGuard; })[0];
}
// interfaces to manage element behavior
var ElementBehavior = (function () {
    function ElementBehavior() {
        this.leave = new Actions();
        this.beginEnter = new Actions();
        this.endEnter = new Actions();
    }
    ElementBehavior.prototype.enter = function () {
        return new Actions(this.beginEnter, this.endEnter);
    };
    return ElementBehavior;
}());
// determine the type of transition and use the appropriate initiliasition method
var InitialiseTransitions = (function (_super) {
    __extends(InitialiseTransitions, _super);
    function InitialiseTransitions() {
        _super.apply(this, arguments);
    }
    InitialiseTransitions.prototype.visitTransition = function (transition, behavior) {
        // reset transition behavior
        transition.onTraverse = new Actions();
        // initialise transition behaviour based on transition kind
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
        transition.onTraverse.pushh(transition.transitionBehavior);
        // add a test for completion
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push(function (message, instance, history) {
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
            behavior(instance.getCurrent(targetAncestors[i].region)).leave.invoke(message, instance);
            // perform the transition action;
            transition.transitionBehavior.invoke(message, instance);
            // enter the target ancestry
            while (i < targetAncestors.length) {
                _this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], function (behavior) { return behavior.invoke(message, instance); });
            }
            // trigger cascade
            behavior(transition.target).endEnter.invoke(message, instance);
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
        transition.onTraverse.pushh(behavior(sourceAncestors[i]).leave, transition.transitionBehavior);
        // enter the target ancestry
        while (i < targetAncestors.length) {
            this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], function (behavior) { return transition.onTraverse.pushh(behavior); });
        }
        // trigger cascade
        transition.onTraverse.pushh(behavior(transition.target).endEnter);
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
// bootstraps all the elements within a state machine model
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
        this.behavior(region).leave.push(function (message, instance) { return _this.behavior(instance.getCurrent(region)).leave.invoke(message, instance); });
        // enter the appropriate child vertex when entering the region
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.behavior(region).endEnter.push(function (message, instance, history) { return (_this.behavior((history || regionInitial.isHistory()) ? instance.getCurrent(region) || regionInitial : regionInitial)).enter().invoke(message, instance, history || regionInitial.kind === PseudoStateKind.DeepHistory); });
        }
        else {
            this.behavior(region).endEnter.pushh(this.behavior(regionInitial).enter());
        }
        this.visitElement(region, deepHistoryAbove);
    };
    InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        if (pseudoState.isInitial()) {
            this.behavior(pseudoState).endEnter.push(function (message, instance, history) {
                if (instance.getCurrent(pseudoState.region)) {
                    _this.behavior(pseudoState).leave.invoke(message, instance);
                    _this.behavior(instance.getCurrent(pseudoState.region)).enter().invoke(message, instance, history || pseudoState.kind === PseudoStateKind.DeepHistory);
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
            this.behavior(state).leave.pushh(this.behavior(region).leave);
            this.behavior(state).endEnter.pushh(this.behavior(region).enter());
        }
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behavior when entering and exiting states
        this.behavior(state).leave.pushh(state.exitBehavior);
        this.behavior(state).beginEnter.pushh(state.entryBehavior);
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
 * @member {IConsole}
 */
exports.console = defaultConsole;
/**
 * Flag to trigger internal transitions to trigger completion events for state they are in
 * @member {Boolean}
 */
exports.internalTransitionsTriggerCompletion = false;
/**
 * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
 * @function validate
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
