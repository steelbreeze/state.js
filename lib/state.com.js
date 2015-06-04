/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 *
 * This source file is designed to transpile into a CommonJS module for use in Node.js applications using TypeScript's tsc.
 * The build process will also convert to a regular JavaScript file for use in web browsers using browserify.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * An enumeration of static constants that dictates the precise behaviour of pseudo states.
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
 * An abstract class used as the base for the Region and Vertex classes.
 * An element is any part of the tree structure that represents a composite state machine model.
 * @class Element
 */
var Element = (function () {
    /**
     * Creates a new instance of the element class.
     * @param {string} name The name of the element.
     */
    function Element(name) {
        this.name = name;
    }
    /**
     * Returns the parent element of this element.
     * @method getParent
     * @returns {Element} The parent element of the element.
     */
    Element.prototype.getParent = function () {
        return;
    };
    /**
     * Returns the root element within the state machine model.
     * @method getRoot
     * @returns {StateMachine} The root state machine element.
     */
    Element.prototype.getRoot = function () {
        return this.getParent().getRoot();
    };
    // The ancestors are returned as an array of elements, staring with the root element and ending with this elemenet.
    Element.prototype.ancestors = function () {
        return (this.getParent() ? this.getParent().ancestors() : []).concat(this);
    };
    /**
     * Accepts an instance of a visitor.
     * @method accept
     * @param {Visitor<TArg>} visitor The visitor instance.
     * @param {TArg} arg An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    Element.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) { };
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
})();
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
        _super.call(this, name);
        /**
         * The set of vertices that are children of the region.
         * @member {Array<Vertex>}
         */
        this.vertices = [];
        this.state = state;
        this.state.regions.push(this);
        this.state.getRoot().clean = false;
    }
    /**
     * Returns the parent element of this region.
     * @method getParent
     * @returns {Element} The parent element of the region.
     */
    Region.prototype.getParent = function () {
        return this.state;
    };
    /**
     * Accepts an instance of a visitor and calls the visitRegion method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @param {any} arg4 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    Region.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitRegion(this, arg1, arg2, arg3, arg4);
    };
    /**
     * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
     * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
     * Update this static member to use a different name for default regions.
     * @member {string}
     */
    Region.defaultName = "default";
    return Region;
})(Element);
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
     * @param {Region|State} parent The parent region or state.
     */
    function Vertex(name, parent) {
        _super.call(this, name);
        /**
         * The set of transitions from this vertex.
         * @member {Array<Transition>}
         */
        this.transitions = [];
        if (parent instanceof Region) {
            this.region = parent;
        }
        else if (parent instanceof State) {
            this.region = parent.defaultRegion();
        }
        if (this.region) {
            this.region.vertices.push(this);
            this.region.getRoot().clean = false;
        }
    }
    /**
     * Returns the parent element of this vertex.
     * @method getParent
     * @returns {Element} The parent element of the vertex.
     */
    Vertex.prototype.getParent = function () {
        return this.region;
    };
    /**
     * Creates a new transition from this vertex.
     * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
     * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
     * @method to
     * @param {Vertex} target The destination of the transition; omit for internal transitions.
     * @returns {Transition} The new transition object.
     */
    Vertex.prototype.to = function (target) {
        var transition = new Transition(this, target);
        this.transitions.push(transition);
        this.getRoot().clean = false;
        return transition;
    };
    return Vertex;
})(Element);
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
     * @param {Element} parent The parent element that this pseudo state will be a child of.
     * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
     */
    function PseudoState(name, parent, kind) {
        _super.call(this, name, parent);
        this.kind = kind;
        if (this.isInitial()) {
            this.region.initial = this;
        }
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
     * @param {any} arg4 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    PseudoState.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitPseudoState(this, arg1, arg2, arg3, arg4);
    };
    return PseudoState;
})(Vertex);
exports.PseudoState = PseudoState;
/**
 * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
 *
 * States are one of the fundamental building blocks of the state machine model.
 * Behaviour can be defined for both state entry and state exit.
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
     * @param {Element} parent The parent state that owns the state.
     */
    function State(name, parent) {
        _super.call(this, name, parent);
        // user defined behaviour (via exit method) to execute when exiting a state.
        this.exitBehavior = [];
        // user defined behaviour (via entry method) to execute when entering a state.
        this.entryBehavior = [];
        /**
         * The set of regions under this state.
         * @member {Array<Region>}
         */
        this.regions = [];
    }
    /**
     * Returns the default region for the state.
     * Note, this will create the default region if it does not already exist.
     * @method defaultRegion
     * @returns {Region} The default region.
     */
    State.prototype.defaultRegion = function () {
        var region;
        this.regions.forEach(function (r) { if (r.name === Region.defaultName) {
            region = r;
        } });
        if (!region) {
            region = new Region(Region.defaultName, this);
        }
        return region;
    };
    /**
     * Tests the state to see if it is a final state;
     * a final state is one that has no outbound transitions.
     * @method isFinal
     * @returns {boolean} True if the state is a final state.
     */
    State.prototype.isFinal = function () {
        return this.transitions.length === 0;
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
     * Adds behaviour to a state that is executed each time the state is exited.
     * @method exit
     * @param {Action} exitAction The action to add to the state's exit behaviour.
     * @returns {State} Returns the state to allow a fluent style API.
     */
    State.prototype.exit = function (exitAction) {
        this.exitBehavior.push(exitAction);
        this.getRoot().clean = false;
        return this;
    };
    /**
     * Adds behaviour to a state that is executed each time the state is entered.
     * @method entry
     * @param {Action} entryAction The action to add to the state's entry behaviour.
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
     * @param {any} arg4 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    State.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitState(this, arg1, arg2, arg3, arg4);
    };
    return State;
})(Vertex);
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
     * @param {Element} parent The parent element that owns the final state.
     */
    function FinalState(name, parent) {
        _super.call(this, name, parent);
    }
    // override Vertex.to to throw an exception when trying to create a transition from a final state.
    FinalState.prototype.to = function (target) {
        throw "A FinalState cannot be the source of a transition.";
    };
    /**
     * Accepts an instance of a visitor and calls the visitFinalState method on it.
     * @method accept
     * @param {Visitor<TArg>} visitor The visitor instance.
     * @param {TArg} arg An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    FinalState.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitFinalState(this, arg1, arg2, arg3, arg4);
    };
    return FinalState;
})(State);
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
        this.clean = false;
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
     * Instructs the state machine model to log activity to an object supporting the Console interface.
     * @method setLogger
     * @param {Console} value Pass in console to log to the console, or any other object supporting the .log method.
     * @returns {StateMachine} Returns the state machine to enable fluent style API.
     */
    StateMachine.prototype.setLogger = function (value) {
        if (value === void 0) { value = undefined; }
        this.logger = value;
        this.clean = false;
        return this;
    };
    /**
     * Accepts an instance of a visitor and calls the visitStateMachine method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @param {any} arg4 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    StateMachine.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitStateMachine(this, arg1, arg2, arg3, arg4);
    };
    return StateMachine;
})(State);
exports.StateMachine = StateMachine;
/**
 * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
 *
 * Transitions come in a variety of types:
 * internal transitions respond to messages but do not cause a state transition, they only have behaviour;
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
     * @param {Vertex} source The target of the transition.
     */
    function Transition(source, target) {
        var _this = this;
        this.source = source;
        this.target = target;
        // user defined behaviour (via effect) executed when traversing this transition.
        this.transitionBehavior = [];
        // the collected actions to perform when traversing the transition (includes exiting states, traversal, and state entry)
        this.traverse = [];
        this.guard = function (message) { return message === _this.source; };
    }
    /**
     * Turns a transition into an else transition.
     *
     * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
     * @method else
     * @returns {Transition} Returns the transition object to enable the fluent API.
     */
    Transition.prototype.else = function () {
        this.guard = Transition.isElse;
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
     * Add behaviour to a transition.
     * @method effect
     * @param {Action} transitionAction The action to add to the transitions traversal behaviour.
     * @returns {Transition} Returns the transition object to enable the fluent API.
     */
    Transition.prototype.effect = function (transitionAction) {
        this.transitionBehavior.push(transitionAction);
        this.source.getRoot().clean = false;
        return this;
    };
    /**
     * Accepts an instance of a visitor and calls the visitTransition method on it.
     * @method accept
     * @param {Visitor<TArg1>} visitor The visitor instance.
     * @param {TArg1} arg1 An optional argument to pass into the visitor.
     * @param {any} arg2 An optional argument to pass into the visitor.
     * @param {any} arg3 An optional argument to pass into the visitor.
     * @param {any} arg4 An optional argument to pass into the visitor.
     * @returns {any} Any value can be returned by the visitor.
     */
    Transition.prototype.accept = function (visitor, arg1, arg2, arg3, arg4) {
        return visitor.visitTransition(this, arg1, arg2, arg3, arg4);
    };
    // used as the guard condition for else tranitions
    Transition.isElse = function () { return false; };
    return Transition;
})();
exports.Transition = Transition;
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
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitElement = function (element, arg1, arg2, arg3, arg4) {
        return;
    };
    /**
     * Visits a region within a state machine model.
     * @method visitRegion
     * @param {Region} region The region being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitRegion = function (region, arg1, arg2, arg3, arg4) {
        var _this = this;
        var result = this.visitElement(region, arg1, arg2, arg3, arg4);
        region.vertices.forEach(function (vertex) { vertex.accept(_this, arg1, arg2, arg3, arg4); });
        return result;
    };
    /**
     * Visits a vertex within a state machine model.
     * @method visitVertex
     * @param {Vertex} vertex The vertex being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitVertex = function (vertex, arg1, arg2, arg3, arg4) {
        var _this = this;
        var result = this.visitElement(vertex, arg1, arg2, arg3, arg4);
        vertex.transitions.forEach(function (transition) { transition.accept(_this, arg1, arg2, arg3, arg4); });
        return result;
    };
    /**
     * Visits a pseudo state within a state machine model.
     * @method visitPseudoState
     * @param {PseudoState} pseudoState The pseudo state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitPseudoState = function (pseudoState, arg1, arg2, arg3, arg4) {
        return this.visitVertex(pseudoState, arg1, arg2, arg3, arg4);
    };
    /**
     * Visits a state within a state machine model.
     * @method visitState
     * @param {State} state The state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitState = function (state, arg1, arg2, arg3, arg4) {
        var _this = this;
        var result = this.visitVertex(state, arg1, arg2, arg3, arg4);
        state.regions.forEach(function (region) { region.accept(_this, arg1, arg2, arg3, arg4); });
        return result;
    };
    /**
     * Visits a final state within a state machine model.
     * @method visitFinal
     * @param {FinalState} finalState The final state being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitFinalState = function (finalState, arg1, arg2, arg3, arg4) {
        return this.visitState(finalState, arg1, arg2, arg3, arg4);
    };
    /**
     * Visits a state machine within a state machine model.
     * @method visitVertex
     * @param {StateMachine} state machine The state machine being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitStateMachine = function (stateMachine, arg1, arg2, arg3, arg4) {
        return this.visitState(stateMachine, arg1, arg2, arg3, arg4);
    };
    /**
     * Visits a transition within a state machine model.
     * @method visitTransition
     * @param {Transition} transition The transition being visited.
     * @param {TArg1} arg1 An optional parameter passed into the accept method.
     * @param {any} arg2 An optional parameter passed into the accept method.
     * @param {any} arg3 An optional parameter passed into the accept method.
     * @param {any} arg4 An optional parameter passed into the accept method.
     * @returns {any} Any value may be returned when visiting an element.
     */
    Visitor.prototype.visitTransition = function (transition, arg1, arg2, arg3, arg4) {
        return;
    };
    return Visitor;
})();
exports.Visitor = Visitor;
/**
 * Default working implementation of a state machine instance class.
 *
 * Implements the `IActiveStateConfiguration` interface.
 * It is possible to create other custom instance classes to manage state machine state in any way (e.g. as serialisable JSON); just implement the same members and methods as this class.
 * @class StateMachineInstance
 * @implements IActiveStateConfiguration
 */
var StateMachineInstance = (function () {
    /**
     * Creates a new instance of the state machine instance class.
     * @param {string} name The optional name of the state machine instance.
     */
    function StateMachineInstance(name) {
        if (name === void 0) { name = "unnamed"; }
        this.name = name;
        this.last = {};
        /**
         * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
         * @member isTerminated
         */
        this.isTerminated = false;
    }
    // Updates the last known state for a given region.
    StateMachineInstance.prototype.setCurrent = function (region, state) {
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
})();
exports.StateMachineInstance = StateMachineInstance;
/**
 * Initialises a state machine and/or state machine model.
 *
 * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
 * @function initialise
 * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param {IActiveStateConfiguration} stateMachineInstance The optional state machine instance to initialise.
 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 */
function initialise(stateMachineModel, stateMachineInstance, autoInitialiseModel) {
    if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
    // initialise a state machine instance
    if (stateMachineInstance) {
        // initialise the state machine model if necessary
        if (autoInitialiseModel && stateMachineModel.clean === false) {
            initialise(stateMachineModel);
        }
        // log as required
        if (stateMachineModel.logger) {
            stateMachineModel.logger.log("initialising " + stateMachineInstance);
        }
        // enter the state machine instance for the first time
        invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);
    }
    else {
        // log as required
        if (stateMachineModel.logger) {
            stateMachineModel.logger.log("initialising " + stateMachineModel.name);
        }
        stateMachineModel.accept(new InitialiseElements(), false);
        stateMachineModel.clean = true;
    }
}
exports.initialise = initialise;
/**
 * Passes a message to a state machine for evaluation; messages trigger state transitions.
 * @function evaluate
 * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to evaluate the message against.
 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 * @returns {boolean} True if the message triggered a state transition.
 */
function evaluate(stateMachineModel, stateMachineInstance, message, autoInitialiseModel) {
    if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
    // log as required
    if (stateMachineModel.logger) {
        stateMachineModel.logger.log(stateMachineInstance + " evaluating message " + message);
    }
    // initialise the state machine model if necessary
    if (autoInitialiseModel && stateMachineModel.clean === false) {
        initialise(stateMachineModel);
    }
    // terminated state machine instances will not evaluate messages
    if (stateMachineInstance.isTerminated) {
        return false;
    }
    // evaluate the message using the Evaluator visitor
    return stateMachineModel.accept(Evaluator.instance, stateMachineInstance, message);
}
exports.evaluate = evaluate;
/**
 * Tests a state machine instance to see if its lifecycle is complete. A state machine instance is complete if all regions belonging to the state machine root have curent states that are final states.
 * @function isComplete
 * @param {StateMachine} stateMachineModel The state machine model.
 * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to test for completeness.
 * @returns {boolean} True if the state machine instance is complete.
 */
function isComplete(vertex, stateMachineInstance) {
    if (vertex instanceof State) {
        return vertex.regions.every(function (region) { return stateMachineInstance.getCurrent(region).isFinal(); });
    }
    return true;
}
exports.isComplete = isComplete;
// Temporary structure to hold element behaviour during the bootstrap process
var ElementBehavior = (function () {
    function ElementBehavior() {
        this.leave = [];
        this.beginEnter = [];
        this.endEnter = [];
        this.enter = [];
    }
    return ElementBehavior;
})();
// invokes behaviour
function invoke(behavior, message, stateMachineInstance, history) {
    if (history === void 0) { history = false; }
    behavior.forEach(function (action) { action(message, stateMachineInstance, history); });
}
// determines if a state is currently active
function isActive(state, stateMachineInstance) {
    return state.region ? (isActive(state.region.state, stateMachineInstance) && (stateMachineInstance.getCurrent(state.region) === state)) : true;
}
// evaluates messages against a state machine, executing transitions as appropriate
var Evaluator = (function (_super) {
    __extends(Evaluator, _super);
    function Evaluator() {
        _super.apply(this, arguments);
    }
    Evaluator.prototype.visitRegion = function (region, stateMachineInstance, message) {
        return stateMachineInstance.getCurrent(region).accept(this, stateMachineInstance, message);
    };
    Evaluator.prototype.visitPseudoState = function (pseudoState, stateMachineInstance, message) {
        var _this = this;
        var transition;
        switch (pseudoState.kind) {
            case PseudoStateKind.Initial:
            case PseudoStateKind.DeepHistory:
            case PseudoStateKind.ShallowHistory:
                if (pseudoState.transitions.length === 1) {
                    transition = pseudoState.transitions[0];
                }
                else {
                    throw "Initial transition must have a single outbound transition from " + pseudoState;
                }
                break;
            case PseudoStateKind.Junction:
                var result, elseResult;
                pseudoState.transitions.forEach(function (t) {
                    if (t.guard === Transition.isElse) {
                        if (elseResult) {
                            throw "Multiple outbound transitions evaluated true";
                        }
                        elseResult = t;
                    }
                    else if (t.guard(message, stateMachineInstance)) {
                        if (result) {
                            throw "Multiple outbound transitions evaluated true";
                        }
                        result = t;
                    }
                });
                transition = result || elseResult;
                break;
            case PseudoStateKind.Choice:
                var results = [];
                pseudoState.transitions.forEach(function (t) {
                    if (t.guard === Transition.isElse) {
                        if (elseResult) {
                            throw "Multiple outbound else transitions found at " + _this + " for " + message;
                        }
                        elseResult = t;
                    }
                    else if (t.guard(message, stateMachineInstance)) {
                        results.push(t);
                    }
                });
                transition = results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;
                break;
        }
        if (!transition) {
            return false;
        }
        invoke(transition.traverse, message, stateMachineInstance);
        return true;
    };
    Evaluator.prototype.visitState = function (state, stateMachineInstance, message) {
        var result = false;
        // delegate to child regions first
        for (var i = 0, l = state.regions.length; i < l; i++) {
            if (state.regions[i].accept(this, stateMachineInstance, message)) {
                result = true;
                if (!isActive(state, stateMachineInstance)) {
                    break;
                }
            }
        }
        //if still unprocessed, try to find one here
        if (!result) {
            var transition;
            state.transitions.forEach(function (t) {
                if (t.guard(message, stateMachineInstance)) {
                    if (transition) {
                        throw new Error("Multiple outbound transitions evaluated true");
                    }
                    transition = t;
                }
            });
            if (transition) {
                invoke(transition.traverse, message, stateMachineInstance);
                result = true;
            }
        }
        // if a transition occured, check for completions
        if (result && (message !== state) && isComplete(state, stateMachineInstance)) {
            this.visitState(state, stateMachineInstance, state);
        }
        return result;
    };
    Evaluator.instance = new Evaluator();
    return Evaluator;
})(Visitor);
// Bootstraps transitions after all elements have been bootstrapped
var InitialiseTransitions = (function (_super) {
    __extends(InitialiseTransitions, _super);
    function InitialiseTransitions() {
        _super.apply(this, arguments);
    }
    InitialiseTransitions.prototype.visitTransition = function (transition, behaviour) {
        // internal transitions: just perform the actions; no exiting or entering states
        if (!transition.target) {
            transition.traverse = transition.transitionBehavior;
        }
        else if (transition.target.region === transition.source.region) {
            transition.traverse = behaviour(transition.source).leave.concat(transition.transitionBehavior).concat(behaviour(transition.target).enter);
        }
        else {
            var sourceAncestors = transition.source.ancestors();
            var targetAncestors = transition.target.ancestors();
            var sourceAncestorsLength = sourceAncestors.length;
            var targetAncestorsLength = targetAncestors.length;
            var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);
            // find the index of the first uncommon ancestor
            while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                i++;
            }
            // validate transition does not cross sibling regions boundaries
            if (sourceAncestors[i] instanceof Region) {
                throw "Transitions may not cross sibling orthogonal region boundaries";
            }
            // leave the first uncommon ancestor
            transition.traverse = behaviour(i < sourceAncestorsLength ? sourceAncestors[i] : transition.source).leave.slice(0);
            // perform the transition action
            transition.traverse = transition.traverse.concat(transition.transitionBehavior);
            if (i >= targetAncestorsLength) {
                transition.traverse = transition.traverse.concat(behaviour(transition.target).beginEnter);
            }
            // enter the target ancestry
            while (i < targetAncestorsLength) {
                var element = targetAncestors[i++];
                var next = i < targetAncestorsLength ? targetAncestors[i] : undefined;
                transition.traverse = transition.traverse.concat(behaviour(element).beginEnter);
                if (element instanceof State) {
                    var state = element;
                    if (state.isOrthogonal()) {
                        state.regions.forEach(function (region) { if (region !== next) {
                            transition.traverse = transition.traverse.concat(behaviour(region).enter);
                        } });
                    }
                }
            }
            // trigger cascade
            transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
        }
    };
    return InitialiseTransitions;
})(Visitor);
// bootstraps all the elements within a state machine model
var InitialiseElements = (function (_super) {
    __extends(InitialiseElements, _super);
    function InitialiseElements() {
        _super.apply(this, arguments);
        this.behaviours = {};
    }
    // returns the behavior for a given element; creates one if not present
    InitialiseElements.prototype.behaviour = function (element) {
        if (!element.qualifiedName) {
            element.qualifiedName = element.ancestors().map(function (e) { return e.name; }).join(Element.namespaceSeparator);
        }
        return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
    };
    // uncomment this method for debugging purposes
    InitialiseElements.prototype.visitElement = function (element, deepHistoryAbove) {
        if (element.getRoot().logger) {
            var elementBehaviour = this.behaviour(element);
            var logger = element.getRoot().logger;
            elementBehaviour.leave.push(function (message, instance) { logger.log(instance + " leave " + element); });
            elementBehaviour.beginEnter.push(function (message, instance) { logger.log(instance + " enter " + element); });
        }
    };
    InitialiseElements.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionBehaviour = this.behaviour(region);
        // chain initiaisation of child vertices
        region.vertices.forEach(function (vertex) { vertex.accept(_this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory)); });
        // leave the curent active child state when exiting the region
        regionBehaviour.leave.push(function (message, stateMachineInstance, history) {
            invoke(_this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance); // NOTE: current state needs to be evaluated at runtime
        });
        // enter the appropriate initial child vertex when entering the region
        if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
            regionBehaviour.endEnter.push(function (message, stateMachineInstance, history) {
                var initial = region.initial;
                if (history || region.initial.isHistory()) {
                    initial = stateMachineInstance.getCurrent(region) || region.initial;
                }
                invoke(_this.behaviour(initial).enter, message, stateMachineInstance, history || region.initial.kind === PseudoStateKind.DeepHistory);
            });
        }
        else {
            regionBehaviour.endEnter = regionBehaviour.endEnter.concat(this.behaviour(region.initial).enter);
        }
        // add element behaviour (debug)
        this.visitElement(region, deepHistoryAbove);
        // merge begin and end enter behaviour
        regionBehaviour.enter = regionBehaviour.beginEnter.concat(regionBehaviour.endEnter);
    };
    InitialiseElements.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        // add element behaviour (debug)
        this.visitElement(vertex, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        this.behaviour(vertex).endEnter.push(function (message, stateMachineInstance, history) {
            if (isComplete(vertex, stateMachineInstance)) {
                vertex.accept(Evaluator.instance, stateMachineInstance, vertex);
            }
        });
    };
    InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var pseudoStateBehaviour = this.behaviour(pseudoState);
        // add vertex behaviour (debug and testing completion transitions)
        this.visitVertex(pseudoState, deepHistoryAbove);
        // terminate the state machine instance upon transition to a terminate pseudo state
        if (pseudoState.kind === PseudoStateKind.Terminate) {
            pseudoStateBehaviour.enter.push(function (message, stateMachineInstance, history) {
                stateMachineInstance.isTerminated = true;
            });
        }
        // merge begin and end enter behaviour
        pseudoStateBehaviour.enter = pseudoStateBehaviour.beginEnter.concat(pseudoStateBehaviour.endEnter);
    };
    InitialiseElements.prototype.visitState = function (state, deepHistoryAbove) {
        var _this = this;
        var stateBehaviour = this.behaviour(state);
        state.regions.forEach(function (region) {
            var regionBehaviour = _this.behaviour(region);
            // chain initiaisation of child regions
            region.accept(_this, deepHistoryAbove);
            // leave child regions when leaving the state
            stateBehaviour.leave = stateBehaviour.leave.concat(regionBehaviour.leave);
            // enter child regions when entering the state
            stateBehaviour.endEnter = stateBehaviour.endEnter.concat(regionBehaviour.enter);
        });
        // add vertex behaviour (debug and testing completion transitions)
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behaviour when entering and exiting states
        stateBehaviour.leave = stateBehaviour.leave.concat(state.exitBehavior);
        stateBehaviour.beginEnter = stateBehaviour.beginEnter.concat(state.entryBehavior);
        // update the parent regions current state
        stateBehaviour.beginEnter.push(function (message, stateMachineInstance, history) {
            if (state.region) {
                stateMachineInstance.setCurrent(state.region, state);
            }
        });
        // merge begin and end enter behaviour
        stateBehaviour.enter = stateBehaviour.beginEnter.concat(stateBehaviour.endEnter);
    };
    InitialiseElements.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        var _this = this;
        this.visitState(stateMachine, deepHistoryAbove);
        // initiaise all the transitions once all the elements have been initialised
        stateMachine.accept(new InitialiseTransitions(), function (element) { return _this.behaviour(element); });
        // define the behaviour for initialising a state machine instance
        stateMachine.onInitialise = this.behaviour(stateMachine).enter;
    };
    return InitialiseElements;
})(Visitor);
