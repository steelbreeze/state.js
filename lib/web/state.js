(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return delegates.map(function (f) { return f.apply(void 0, args); });
    };
}
exports.delegate = delegate;

},{}],2:[function(require,module,exports){
"use strict";
/**
 * @module state
 *
 * a finite state machine library
 *
 * @copyright (c) 2014-7 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
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
/** Import other packages */
var Tree = require("./tree");
var delegate_1 = require("./delegate");
/**
 * Default logger implementation.
 * @hidden
 */
var logger = {
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
/**
 * Overrides the current logging object.
 * @param value An object to pass log and error messages to.
 * @returns Returns the previous logging object in use.
 */
function setLogger(value) {
    var result = logger;
    logger = value;
    return result;
}
exports.setLogger = setLogger;
/**
 * Default random number implementation.
 * @hidden
 */
var random = function (max) { return Math.floor(Math.random() * max); };
/**
 * Sets a custom random number generator for state.js.
 *
 * The default implementation uses [Math.floor(Math.random() * max)]{@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random}.
 * @param value The new method to generate random numbers.
 * @return Returns the previous random number generator in use.
 */
function setRandom(value) {
    var result = random;
    random = value;
    return result;
}
exports.setRandom = setRandom;
/**
 * Default setting for completion transition behavior.
 * @hidden
 */
var internalTransitionsTriggerCompletion = false;
/**
 * Sets a flag controlling completion transition behavior for internal transitions.
 * @param value True to have internal transitions trigger completion transitions.
 * @return Returns the previous setting in use.
 */
function setInternalTransitionsTriggerCompletion(value) {
    var result = internalTransitionsTriggerCompletion;
    internalTransitionsTriggerCompletion = value;
    return result;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
var namespaceSeparator = ".";
/**
 * Sets the symbol used as the delimiter in fully qualified element names.
 * @param value The symbol used as the delimiter in fully qualified element names.
 * @return Returns the previous symbol used as the delimiter in fully qualified element names.
 */
function setNamespaceSeparator(value) {
    var result = namespaceSeparator;
    namespaceSeparator = value;
    return result;
}
exports.setNamespaceSeparator = setNamespaceSeparator;
/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
var defaultRegionName = "default";
/**
 * Sets the default name to use when implicitly creating regions.
 * @param value The new default region name.
 * @return Returns the previous default region name.
 */
function setDefaultRegionName(value) {
    var result = defaultRegionName;
    defaultRegionName = value;
    return result;
}
exports.setDefaultRegionName = setDefaultRegionName;
/**
 * Enumeration used to define the semantics of [pseudo states]{@link PseudoState}.
 */
var PseudoStateKind;
(function (PseudoStateKind) {
    /*** Turns the [pseudo state]{@link PseudoState} into a dynamic conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated after the transition into the [pseudo state]{@link PseudoState} is traversed. */
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    /** Turns on deep history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will cascade through all child [regions]{@link Region}. */
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    /*** Turns the [pseudo state]{@link PseudoState} into an initial [vertex]{@link Vertex}, meaning is is the default point when the parent [region]{@link Region} is entered. */
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    /*** Turns the [pseudo state]{@link PseudoState} into a static conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated before the transition into the [pseudo state]{@link PseudoState} is traversed. */
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    /** Turns on shallow history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will only apply to the parent [region]{@link Region}. */
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
})(PseudoStateKind = exports.PseudoStateKind || (exports.PseudoStateKind = {}));
/**
 * Enumeration used to define the semantics of [transitions]{@link Transition}.
 */
var TransitionKind;
(function (TransitionKind) {
    /** An external [transition]{@link Transition} is the default transition type; the source [vertex]{@link Vertex} is exited, [transition]{@link Transition} behavior called and target [vertex]{@link Vertex} entered. Where the source and target [vertices]{@link Vertex} are in different parent [regions]{@link Region} the source ancestry is exited up to but not including the least common ancestor; likewise the targe ancestry is enterd. */
    TransitionKind[TransitionKind["External"] = 0] = "External";
    /**
     * An internal [transition]{@link Transition} executes without exiting or entering the [state]{@link State} in which it is defined.
     * @note The target vertex of an internal [transition]{@link Transition} must be undefined.
     */
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    /** A local [transition]{@link Transition} is one where the target [vertex]{@link Vertex} is a child of the source [vertex]{@link Vertex}; the source [vertex]{@link Vertex} is not exited. */
    TransitionKind[TransitionKind["Local"] = 2] = "Local";
})(TransitionKind = exports.TransitionKind || (exports.TransitionKind = {}));
/**
 * Common base class for [regions]{@link Region} and [vertices]{@link Vertex} within a [state machine model]{@link StateMachine}.
 * @param TParent The type of the element's parent.
 */
var Element = (function () {
    /**
     * Creates a new instance of the [[Element]] class.
     * @param name The name of this [element]{@link Element}.
     * @param parent The parent [element]{@link Element} of this [element]{@link Element}.
     */
    function Element(name, parent) {
        this.name = name;
        this.parent = parent;
        this.qualifiedName = parent ? parent.toString() + namespaceSeparator + name : name;
        this.invalidate();
    }
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    Element.prototype.invalidate = function () {
        this.parent.invalidate();
    };
    /** Returns the fully qualified name of the [element]{@link Element}. */
    Element.prototype.toString = function () {
        return this.qualifiedName;
    };
    return Element;
}());
exports.Element = Element;
/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex} and has no behavior associated with it. */
var Region = (function (_super) {
    __extends(Region, _super);
    /**
     * Creates a new instance of the [[Region]] class.
     * @param name The name of this [element]{@link Element}.
     * @param parent The parent [element]{@link Element} of this [element]{@link Element}.
     */
    function Region(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        /** The child [vertices]{@link Vertex} of this [region]{@link Region}. */
        _this.children = new Array();
        _this.parent.children.push(_this);
        return _this;
    }
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is active. A [region]{@link Region} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    Region.prototype.isActive = function (instance) {
        return this.parent.isActive(instance);
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is complete. A [region]{@link Region} is complete when it's current active [state]{@link State} is a [final state]{@link State.isFinal} (one that has no outbound [transitions]{@link Transition}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    Region.prototype.isComplete = function (instance) {
        var currentState = instance.getLastKnownState(this);
        return currentState !== undefined && currentState.isFinal();
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    Region.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitRegion.apply(visitor, [this].concat(args));
    };
    return Region;
}(Element));
exports.Region = Region;
/** The source or target of a [transition]{@link Transition} within a [state machine model]{@link StateMachine}. A vertex can be either a [[State]] or a [[PseudoState]]. */
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    /**
     * Creates a new instance of the [[Vertex]] class.
     * @param name The name of this [vertex]{@link Vertex}.
     * @param parent The parent [element]{@link Element} of this [vertex]{@link Vertex}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    function Vertex(name, parent) {
        var _this = _super.call(this, name, parent instanceof Region ? parent : parent.defaultRegion() || new Region(defaultRegionName, parent)) || this;
        /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the source of. */
        _this.outgoing = new Array();
        /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the target of. */
        _this.incoming = new Array();
        _this.parent.children.push(_this);
        return _this;
    }
    /**
     * Creates a new [transition]{@link Transition} from this [vertex]{@link Vertex}.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    Vertex.prototype.to = function (target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        return new Transition(this, target, kind);
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    Vertex.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitVertex.apply(visitor, [this].concat(args));
    };
    return Vertex;
}(Element));
exports.Vertex = Vertex;
/** A [vertex]{@link Vertex} in a [state machine model]{@link StateMachine} that has the form of a [state]{@link State} but does not behave as a full [state]{@link State}; it is always transient; it may be the source or target of [transitions]{@link Transition} but has no entry or exit behavior. */
var PseudoState = (function (_super) {
    __extends(PseudoState, _super);
    /**
     * Creates a new instance of the [[PseudoState]] class.
     * @param name The name of this [pseudo state]{@link PseudoState}.
     * @param parent The parent [element]{@link Element} of this [pseudo state]{@link PseudoState}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     * @param kind The semantics of this [pseudo state]{@link PseudoState}; see the members of the [pseudo state kind enumeration]{@link PseudoStateKind} for details.
     */
    function PseudoState(name, parent, kind) {
        if (kind === void 0) { kind = PseudoStateKind.Initial; }
        var _this = _super.call(this, name, parent) || this;
        _this.kind = kind;
        return _this;
    }
    /**
     * Tests the [pseudo state]{@link PseudoState} to see if it is a history [pseudo state]{@link PseudoState}, one who's [kind]{@link PseudoStateKind} is [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}.
     * @returns Returns true if the [pseudo state]{@link PseudoState} to see if it is a history state.
     */
    PseudoState.prototype.isHistory = function () {
        return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
    };
    /**
     * Tests the [pseudo state]{@link PseudoState} to see if it is an initial [pseudo state]{@link PseudoState}, one who's [kind]{@link PseudoStateKind} is [Initial]{@link PseudoStateKind.Initial}, [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}.
     * @returns Returns true if the [pseudo state]{@link PseudoState} to see if it is an initial state.
     */
    PseudoState.prototype.isInitial = function () {
        return this.kind === PseudoStateKind.Initial || this.isHistory();
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    PseudoState.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitPseudoState.apply(visitor, [this].concat(args));
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
/** A condition or situation during the life of an object, represented by a [state machine model]{@link StateMachine}, during which it satisfies some condition, performs some activity, or waits for some event. */
var State = (function (_super) {
    __extends(State, _super);
    /**
     * Creates a new instance of the [[State]] class.
     * @param name The name of this [state]{@link State}.
     * @param parent The parent [element]{@link Element} of this [state]{@link State}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    function State(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        /** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
        _this.children = new Array(); // TODO: pull out some commonality from state and state machine
        /**
         * The state's entry behavior as defined by the user.
         * @hidden
         */
        _this.entryBehavior = delegate_1.delegate();
        /**
         * The state's exit behavior as defined by the user.
         * @hidden
         */
        _this.exitBehavior = delegate_1.delegate();
        return _this;
    }
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    State.prototype.defaultRegion = function () {
        return this.children.filter(function (region) { return region.name === defaultRegionName; })[0];
    };
    /**
     * Tests the [state]{@link State} to to see if it is a final state. Final states have no [outgoing]{@link State.outgoing} [transitions]{@link Transition} and cause their parent [region]{@link Region} to be considered [complete]{@link Region.isComplete}.
     * @return Returns true if the [state]{@link State} is a final state.
     */
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is a simple state. Simple states have no child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a simple state.
     */
    State.prototype.isSimple = function () {
        return this.children.length === 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is a composite state. Composite states have one or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a composite state.
     */
    State.prototype.isComposite = function () {
        return this.children.length > 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is an orthogonal state. Orthogonal states have two or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is an orthogonal state.
     */
    State.prototype.isOrthogonal = function () {
        return this.children.length > 1;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is active. A [state]{@link State} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    State.prototype.isActive = function (instance) {
        return this.parent.isActive(instance) && instance.getLastKnownState(this.parent) === this;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    State.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is exited.
     * @param action The behavior to call upon [state]{@link State} exit. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    State.prototype.exit = function (action) {
        this.exitBehavior = delegate_1.delegate(this.exitBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.invalidate();
        return this;
    };
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is entered.
     * @param action The behavior to call upon [state]{@link State} entry. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    State.prototype.entry = function (action) {
        this.entryBehavior = delegate_1.delegate(this.entryBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.invalidate();
        return this;
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    State.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitState.apply(visitor, [this].concat(args));
    };
    return State;
}(Vertex));
exports.State = State;
/** A specification of the sequences of [states]{@link State} that an object goes through in response to events during its life, together with its responsive actions. */
var StateMachine = (function () {
    /**
     * Creates a new instance of the [[StateMachine]] class.
     * @param name The name of the [state machine]{@link StateMachine}.
     */
    function StateMachine(name) {
        this.name = name;
        /**
         * The parent element of the state machine; always undefined.
         * @hidden
         */
        this.parent = undefined;
        /** The child [region(s)]{@link Region} if this [state machine]{@link StateMachine}. */
        this.children = new Array();
        /**
         * A flag to denote that the state machine model required recompilation.
         * @hidden
         */
        this.clean = false;
    }
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    StateMachine.prototype.invalidate = function () {
        this.clean = false;
    };
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state machine]{@link StateMachine} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    StateMachine.prototype.defaultRegion = function () {
        return this.children.filter(function (region) { return region.name === defaultRegionName; })[0];
    };
    /**
     * Tests the [state machine instance]{@link IInstance} to see if it is active. As a [state machine]{@link StateMachine} is the root of the model, it will always be active.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @returns Always returns true.
     */
    StateMachine.prototype.isActive = function (instance) {
        return true;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if it is complete. A [state machine]{@link StateMachine} is complete when all its [child]{@link StateMachine.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @return Returns true if the [state machine instance]{@link IInstance} is complete.
     */
    StateMachine.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    /**
     * Initialises a [state machine model]{@link StateMachine} or a [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to initialise; if omitted, the [state machine model]{@link StateMachine} is initialised.
     */
    StateMachine.prototype.initialise = function (instance) {
        if (instance) {
            if (this.clean === false) {
                this.initialise();
            }
            logger.log("initialise " + instance);
            this.onInitialise(instance, false, undefined);
        }
        else {
            logger.log("initialise " + this);
            this.onInitialise = this.accept(new InitialiseStateMachine(), false, this.onInitialise);
            this.clean = true;
        }
    };
    /**
     * Passes a message to the [state machine model]{@link StateMachine} for evaluation within the context of a specific [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message. These will be passed to the [guard conditions]{@link Guard} of the appropriate [transitions]{@link Transition} and if a state transition occurs, to the behaviour specified on [states]{@link State} and [transitions]{@link Transition}.
     */
    StateMachine.prototype.evaluate = function (instance) {
        var message = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            message[_i - 1] = arguments[_i];
        }
        if (this.clean === false) {
            this.initialise();
        }
        logger.log(instance + " evaluate message: " + message);
        return evaluate.apply(void 0, [this, instance].concat(message));
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    StateMachine.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitStateMachine.apply(visitor, [this].concat(args));
    };
    /** Returns the fully name of the [state machine]{@link StateMachine}. */
    StateMachine.prototype.toString = function () {
        return this.name;
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;
/** A relationship within a [state machine model]{@link StateMachine} between two [vertices]{@link Vertex} that will effect a state transition in response to an event when its [guard condition]{@link Transition.when} is satisfied. */
var Transition = (function () {
    /**
     * Creates an instance of the [[Transition]] class.
     * @param source The [vertex]{@link Vertex} to [transition]{@link Transition} from.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    function Transition(source, target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        var _this = this;
        this.source = source;
        this.target = target;
        this.kind = kind;
        /**
         * The transition's behavior as defined by the user.
         * @hidden
         */
        this.effectBehavior = delegate_1.delegate();
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
        // validate and repair if necessary the user supplied transition kind
        if (this.target) {
            this.target.incoming.push(this);
            if (this.kind === TransitionKind.Local) {
                if (!Tree.isChild(this.target, this.source)) {
                    this.kind = TransitionKind.External;
                }
            }
        }
        else {
            this.kind = TransitionKind.Internal;
        }
        this.source.invalidate();
    }
    /**
     * Tests the [transition]{@link Transition} to see if it is an [else transition]{@link Transition.else}.
     * @return Returns true if the [transition]{@link Transition} is an [else transition]{@link Transition.else}.
     */
    Transition.prototype.isElse = function () {
        return this.guard === Transition.Else;
    };
    /**
     * Turns the [transition]{@link Transition} into an [else transition]{@link Transition.isElse}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype["else"] = function () {
        // TODO: validate that the source is a choice or junction.
        this.guard = Transition.Else;
        return this;
    };
    /**
     * Create a user defined [guard condition]{@link Guard} for the [transition]{@link Transition}.
     * @param guard The new [guard condition]{@link Guard}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype.when = function (guard) {
        this.guard = guard;
        return this;
    };
    /**
     * Sets user-definable behavior to execute every time the [transition]{@link Transition} is traversed.
     * @param action The behavior to call upon [transition]{@link Transition} traversal. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype.effect = function (action) {
        this.effectBehavior = delegate_1.delegate(this.effectBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            action.apply(void 0, [instance].concat(message));
        });
        this.source.invalidate();
        return this;
    };
    /**
     * Evaulates the [transitions]{@link Transition} guard condition.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message.
     * @hidden
     */
    Transition.prototype.evaluate = function (instance) {
        var message = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            message[_i - 1] = arguments[_i];
        }
        return this.guard.apply(this, [instance].concat(message));
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    Transition.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitTransition.apply(visitor, [this].concat(args));
    };
    return Transition;
}());
Transition.Else = function () { return false; };
exports.Transition = Transition;
/** Base class for vistors that will walk the [state machine model]{@link StateMachine}; used in conjunction with the [accept]{@linkcode StateMachine.accept} methods on all [elements]{@link Element}. Visitor is an mplementation of the [visitor pattern]{@link https://en.wikipedia.org/wiki/Visitor_pattern}. */
var Visitor = (function () {
    function Visitor() {
    }
    /**
     * Visits an [element]{@link Element} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [elements]{@link Element}.
     * @param element The [element]{@link Element} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitElement = function (element) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    /**
     * Visits a [region]{@link Region} within a [state machine model]{@link StateMachine}.
     * @param element The [reigon]{@link Region} being visited.
     * @param args The arguments passed to the initial accept call.
     */
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
    /**
     * Visits a [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [vertices]{@link Vertex}.
     * @param element The [element]{@link Element} being visited.
     * @param args The arguments passed to the initial accept call.
     */
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
    /**
     * Visits a [pseudo state]{@link PseudoState} within a [state machine model]{@link StateMachine}.
     * @param element The [pseudo state]{@link PseudoState} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitPseudoState = function (pseudoState) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.visitVertex.apply(this, [pseudoState].concat(args));
    };
    /**
     * Visits a [state]{@link State} within a [state machine model]{@link StateMachine}.
     * @param element The [state]{@link State} being visited.
     * @param args The arguments passed to the initial accept call.
     */
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
    /**
     * Visits a [state machine]{@link StateMachine} within a [state machine model]{@link StateMachine}.
     * @param element The [state machine]{@link StateMachine} being visited.
     * @param args The arguments passed to the initial accept call.
     */
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
    /**
     * Visits a [transition]{@link Transition} within a [state machine model]{@link StateMachine}.
     * @param element The [transition]{@link Transition} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitTransition = function (transition) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    return Visitor;
}());
exports.Visitor = Visitor;
/** Simple implementation of [[IInstance]]; manages the active state configuration in a dictionary. */
var DictionaryInstance = (function () {
    function DictionaryInstance(name) {
        this.name = name;
        this.asc = {};
    }
    DictionaryInstance.prototype.find = function (region) {
        var asc = this.asc[region.qualifiedName];
        if (!asc) {
            asc = { currentVertex: undefined, lastKnownState: undefined };
            this.asc[region.qualifiedName] = asc;
        }
        return asc;
    };
    DictionaryInstance.prototype.setCurrent = function (vertex) {
        var asc = this.find(vertex.parent);
        asc.currentVertex = vertex;
        if (vertex instanceof State) {
            asc.lastKnownState = vertex;
        }
    };
    DictionaryInstance.prototype.getCurrent = function (region) {
        return this.find(region).currentVertex;
    };
    DictionaryInstance.prototype.getLastKnownState = function (region) {
        return this.find(region).lastKnownState;
    };
    DictionaryInstance.prototype.toString = function () {
        return this.name;
    };
    return DictionaryInstance;
}());
exports.DictionaryInstance = DictionaryInstance;
/** @hidden */
var ElementActions = (function () {
    function ElementActions() {
        this.leave = delegate_1.delegate();
        this.beginEnter = delegate_1.delegate();
        this.endEnter = delegate_1.delegate();
    }
    return ElementActions;
}());
/** @hidden */
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
        this.getActions(element).leave = delegate_1.delegate(this.getActions(element).leave, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return logger.log(instance + " leave " + element);
        });
        this.getActions(element).beginEnter = delegate_1.delegate(this.getActions(element).beginEnter, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return logger.log(instance + " enter " + element);
        });
    };
    InitialiseStateMachine.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionInitial = region.children.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result; }, undefined);
        this.getActions(region).leave = delegate_1.delegate(this.getActions(region).leave, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            var currentState = instance.getCurrent(region);
            if (currentState) {
                (_a = _this.getActions(currentState)).leave.apply(_a, [instance, false].concat(message));
            }
            var _a;
        });
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.getActions(region).endEnter = delegate_1.delegate(this.getActions(region).endEnter, function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                var actions = _this.getActions((deepHistory || regionInitial.isHistory()) ? instance.getLastKnownState(region) || regionInitial : regionInitial);
                var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                actions.beginEnter.apply(actions, [instance, history].concat(message));
                actions.endEnter.apply(actions, [instance, history].concat(message));
            });
        }
        else {
            this.getActions(region).endEnter = delegate_1.delegate(this.getActions(region).endEnter, this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        _super.prototype.visitVertex.call(this, vertex, deepHistoryAbove);
        this.getActions(vertex).beginEnter = delegate_1.delegate(this.getActions(vertex).beginEnter, function (instance) {
            instance.setCurrent(vertex);
        });
    };
    InitialiseStateMachine.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        if (pseudoState.isInitial()) {
            this.getActions(pseudoState).endEnter = delegate_1.delegate(this.getActions(pseudoState).endEnter, function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                if (instance.getLastKnownState(pseudoState.parent)) {
                    (_a = _this.getActions(pseudoState)).leave.apply(_a, [instance, false].concat(message));
                    var currentState = instance.getLastKnownState(pseudoState.parent);
                    if (currentState) {
                        (_b = _this.getActions(currentState)).beginEnter.apply(_b, [instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                        (_c = _this.getActions(currentState)).endEnter.apply(_c, [instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                    }
                }
                else {
                    traverse(pseudoState.outgoing[0], instance, false);
                }
                var _a, _b, _c;
            });
        }
    };
    InitialiseStateMachine.prototype.visitState = function (state, deepHistoryAbove) {
        for (var _i = 0, _a = state.children; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            this.getActions(state).leave = delegate_1.delegate(this.getActions(state).leave, this.getActions(region).leave);
            this.getActions(state).endEnter = delegate_1.delegate(this.getActions(state).endEnter, this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
        this.visitVertex(state, deepHistoryAbove);
        this.getActions(state).leave = delegate_1.delegate(this.getActions(state).leave, state.exitBehavior);
        this.getActions(state).beginEnter = delegate_1.delegate(this.getActions(state).beginEnter, state.entryBehavior);
    };
    InitialiseStateMachine.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        var _this = this;
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
        return delegate_1.delegate.apply(void 0, stateMachine.children.map(function (region) { return delegate_1.delegate(_this.getActions(region).beginEnter, _this.getActions(region).endEnter); }));
    };
    InitialiseStateMachine.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    InitialiseStateMachine.prototype.visitInternalTransition = function (transition) {
        transition.onTraverse = delegate_1.delegate(transition.effectBehavior);
        if (internalTransitionsTriggerCompletion) {
            transition.onTraverse = delegate_1.delegate(transition.onTraverse, function (instance, deepHistory) {
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
        transition.onTraverse = delegate_1.delegate(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            var vertex = transition.target;
            var actions = delegate_1.delegate(_this.getActions(transition.target).endEnter);
            while (vertex !== transition.source) {
                actions = delegate_1.delegate(_this.getActions(vertex).beginEnter, actions);
                if (vertex.parent.parent === transition.source) {
                    actions = delegate_1.delegate(transition.effectBehavior, _this.getActions(instance.getCurrent(vertex.parent)).leave, actions);
                }
                else {
                    actions = delegate_1.delegate(_this.getActions(vertex.parent).beginEnter, actions); // TODO: validate this is the correct place for region entry
                }
                vertex = vertex.parent.parent;
            }
            actions.apply(void 0, [instance, deepHistory].concat(message));
        });
    };
    InitialiseStateMachine.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = Tree.ancestors(transition.source);
        var targetAncestors = Tree.ancestors(transition.target);
        var i = Tree.lowestCommonAncestorIndex(sourceAncestors, targetAncestors);
        if (sourceAncestors[i] instanceof Region) {
            i += 1;
        }
        transition.onTraverse = delegate_1.delegate(this.getActions(sourceAncestors[i]).leave, transition.effectBehavior);
        while (i < targetAncestors.length) {
            transition.onTraverse = delegate_1.delegate(transition.onTraverse, this.getActions(targetAncestors[i++]).beginEnter);
        }
        transition.onTraverse = delegate_1.delegate(transition.onTraverse, this.getActions(transition.target).endEnter);
    };
    return InitialiseStateMachine;
}(Visitor));
/** @hidden */
function findElse(pseudoState) {
    return pseudoState.outgoing.filter(function (transition) { return transition.isElse(); })[0];
}
/** @hidden */
function selectTransition(pseudoState, instance) {
    var message = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        message[_i - 2] = arguments[_i];
    }
    var transitions = pseudoState.outgoing.filter(function (transition) { return transition.evaluate.apply(transition, [instance].concat(message)); });
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return transitions.length !== 0 ? transitions[random(transitions.length)] : findElse(pseudoState);
    }
    if (transitions.length > 1) {
        logger.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
    }
    return transitions[0] || findElse(pseudoState);
}
/**
 * Logic to
 * @hidden
 */
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
            var transitions = state.outgoing.filter(function (transition) { return transition.evaluate.apply(transition, [instance].concat(message)); });
            if (transitions.length === 1) {
                traverse.apply(void 0, [transitions[0], instance].concat(message));
                result = true;
            }
            else if (transitions.length > 1) {
                logger.error(state + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
    }
    return result;
}
/**
 * Logic to perform transition traversal; includes static (with its composite transition) and dynamic conditional branch processing for Junction and Choice pseudo states respectively.
 * @hidden
 */
function traverse(transition, instance) {
    var message = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        message[_i - 2] = arguments[_i];
    }
    var onTraverse = delegate_1.delegate(transition.onTraverse);
    // create the compound transition while the target is a junction pseudo state (static conditional branch)
    while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
        transition = selectTransition.apply(void 0, [transition.target, instance].concat(message));
        onTraverse = delegate_1.delegate(onTraverse, transition.onTraverse);
    }
    // call the transition behavior.
    onTraverse.apply(void 0, [instance, false].concat(message));
    if (transition.target) {
        // recurse to perform outbound transitions when the target is a choice pseudo state (dynamic conditional branch)
        if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
            traverse.apply(void 0, [selectTransition.apply(void 0, [transition.target, instance].concat(message)), instance].concat(message));
        }
        else if (transition.target instanceof State && transition.target.isComplete(instance)) {
            evaluate(transition.target, instance, transition.target);
        }
    }
}

},{"./delegate":1,"./tree":3}],3:[function(require,module,exports){
"use strict";
/**
 * @module tree
 *
 * A small library of tree algorithms
 *
 * @copyright (c) 2017 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
exports.__esModule = true;
/**
 * Returns the ancestry of a node within a tree from the root as an array.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node The node to return the ancestry for.
 */
function ancestors(node) {
    var result = node && node.parent ? ancestors(node.parent) : [];
    if (node) {
        result.push(node);
    }
    return result;
}
exports.ancestors = ancestors;
/**
 * Returns the index of the lowest/least common ancestor given a pair of ancestrys.
 * @param TNode A common type shared by all node instances within the tree.
 * @param ancestry1 The ancestry of a node within the tree.
 * @param ancestry2 The ancestry of a node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function lowestCommonAncestorIndex(ancestry1, ancestry2) {
    var result = 0;
    if (ancestry1 && ancestry2) {
        while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
            result++;
        }
    }
    return result - 1;
}
exports.lowestCommonAncestorIndex = lowestCommonAncestorIndex;
/**
 * Returns the lowest/least common ancestor given a pair of nodes.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node1 A node within the tree.
 * @param node2 A node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function lowestCommonAncestor(node1, node2) {
    var ancestry1 = ancestors(node1);
    var ancestry2 = ancestors(node2);
    var index = lowestCommonAncestorIndex(ancestry1, ancestry2);
    return index === -1 ? undefined : ancestry1[index];
}
exports.lowestCommonAncestor = lowestCommonAncestor;
/**
 * Tests a node to see if it is in the ancestry of another node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
function isChild(child, parent) {
    while (child) {
        if (child.parent === parent) {
            return true;
        }
        child = child.parent;
    }
    return false;
}
exports.isChild = isChild;
/**
 * Returns the depth (number of edges from a node to the root) of a node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The node to get the depth of.
 * @returns The number of edges between the node an the root node. Returns -1 an undefined node is passed.
 */
function depth(node) {
    var result = -1;
    while (node) {
        result++;
        node = node.parent;
    }
    return result;
}
exports.depth = depth;

},{}],4:[function(require,module,exports){
/*
 * Finite state machine library
 * Copyright (c) 2014-7 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */

// bind the API to a global variable defined by the target attribute of the script element
window[((document.currentScript || document.getElementsByTagName("script")[scripts.length - 1]).attributes.target || { textContent: "fsm" }).textContent] = require("../lib/node/state.js");
},{"../lib/node/state.js":2}]},{},[4]);
