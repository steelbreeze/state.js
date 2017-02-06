"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/** The object used for log, warning and error messages. By default, log messages are ignored and errors throw exceptions. */
exports.console = {
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
 * Replace the default console object to implement custom logging.
 * @param newConsole An object to send log, warning and error messages to. THis must implement log and error methods as per the global console object.
 */
function setConsole(newConsole) {
    exports.console = newConsole;
}
exports.setConsole = setConsole;
/**Random number generation method. */
exports.random = function (max) { return Math.floor(Math.random() * max); };
/**
 * Sets the  random number generation method.
 * @param value A methos to generate random numbers.
 */
function setRandom(value) {
    exports.random = value;
}
exports.setRandom = setRandom;
/** Flag to control completion transition behaviour of internal transitions. */
exports.internalTransitionsTriggerCompletion = false;
/**
 * Change completion transition behaviour of internal transitions.
 * @param value True to have internal transitions triggering completin transitions.
 */
function setInternalTransitionsTriggerCompletion(value) {
    exports.internalTransitionsTriggerCompletion = value;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
/** Class that the behavior built up for state transitions. */
var Action = (function () {
    /**
     * Creates a new instance of the Action class.
     */
    function Action(actions) {
        this.actions = [];
        if (actions) {
            this.push(actions);
        }
    }
    Action.prototype.push = function (actions) {
        for (var _i = 0, _a = actions instanceof Action ? actions.actions : actions; _i < _a.length; _i++) {
            var action = _a[_i];
            this.actions.push(action);
        }
    };
    Action.prototype.invoke = function (message, instance, deepHistory) {
        for (var _i = 0, _a = this.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(message, instance, deepHistory);
        }
    };
    return Action;
}());
exports.Action = Action;
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
var NamedElement = (function () {
    function NamedElement(name, parent) {
        this.name = name;
        this.parent = parent;
        this.qualifiedName = parent ? parent.toString() + NamedElement.namespaceSeparator + name : name;
    }
    NamedElement.prototype.getAncestors = function () {
        return this.parent.getAncestors().concat(this);
    };
    NamedElement.prototype.getRoot = function () {
        return this.parent.getRoot();
    };
    NamedElement.prototype.isActive = function (instance) {
        return this.parent.isActive(instance);
    };
    NamedElement.prototype.accept = function (visitor, arg) {
        visitor.visitElement(this, arg);
    };
    NamedElement.prototype.toString = function () {
        return this.qualifiedName;
    };
    return NamedElement;
}());
NamedElement.namespaceSeparator = ".";
exports.NamedElement = NamedElement;
var Region = (function (_super) {
    __extends(Region, _super);
    function Region(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        _this.vertices = new Array();
        _this.parent.regions.push(_this);
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
}(NamedElement));
Region.defaultName = "default";
exports.Region = Region;
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    function Vertex(name, parent) {
        var _this = _super.call(this, name, parent instanceof Region ? parent : parent.getDefaultRegion()) || this;
        _this.outgoing = new Array();
        _this.incoming = new Array();
        _this.parent.vertices.push(_this);
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
}(NamedElement));
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
    PseudoState.prototype.selectTransition = function (instance, message) {
        var transitions = this.outgoing.filter(function (transition) { return transition.guard(message, instance); });
        if (this.kind === PseudoStateKind.Choice) {
            return transitions.length !== 0 ? transitions[exports.random(transitions.length)] : this.findElse();
        }
        if (transitions.length > 1) {
            exports.console.error("Multiple outbound transition guards returned true at " + this + " for " + message);
        }
        return transitions[0] || this.findElse();
    };
    PseudoState.prototype.findElse = function () {
        return this.outgoing.filter(function (transition) { return transition.guard === Transition.Else; })[0];
    };
    PseudoState.prototype.accept = function (visitor, arg) {
        visitor.visitPseudoState(this, arg);
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
var State = (function (_super) {
    __extends(State, _super);
    function State(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        _this.regions = new Array();
        _this.entryBehavior = new Array();
        _this.exitBehavior = new Array();
        return _this;
    }
    State.prototype.getDefaultRegion = function () {
        return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
    };
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    State.prototype.isSimple = function () {
        return this.regions.length === 0;
    };
    State.prototype.isComposite = function () {
        return this.regions.length > 0;
    };
    State.prototype.isOrthogonal = function () {
        return this.regions.length > 1;
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
    State.prototype.isActive = function (instance) {
        return _super.prototype.isActive.call(this, instance) && instance.getLastKnownState(this.parent) === this;
    };
    State.prototype.isComplete = function (instance) {
        return this.regions.every(function (region) { return region.isComplete(instance); });
    };
    State.prototype.evaluateState = function (instance, message) {
        var _this = this;
        var result = false;
        // delegate to child regions first if a non-continuation
        if (message !== this) {
            this.regions.every(function (region) {
                var currentState = instance.getLastKnownState(region);
                if (currentState && currentState.evaluateState(instance, message)) {
                    result = true;
                    return _this.isActive(instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
                }
                return true; // NOTE: this just controls the every loop
            });
        }
        // if a transition occured in a child region, check for completions
        if (result) {
            if ((message !== this) && this.isComplete(instance)) {
                this.evaluateState(instance, this);
            }
        }
        else {
            // otherwise look for a transition from this state
            var transitions = this.outgoing.filter(function (transition) { return transition.guard(message, instance); });
            if (transitions.length === 1) {
                // execute if a single transition was found
                result = transitions[0].traverse(instance, message);
            }
            else if (transitions.length > 1) {
                // error if multiple transitions evaluated true
                exports.console.error(this + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
        return result;
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
        this.regions = new Array();
        this.defaultRegion = undefined;
        this.clean = false;
        this.onInitialise = new Action();
    }
    StateMachine.prototype.getDefaultRegion = function () {
        return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
    };
    StateMachine.prototype.getAncestors = function () {
        return [this];
    };
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
        return this.regions.every(function (region) { return region.isComplete(instance); });
    };
    StateMachine.prototype.initialise = function (instance, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        if (instance) {
            if (autoInitialiseModel && this.clean === false) {
                this.initialise();
            }
            exports.console.log("initialise " + instance);
            this.onInitialise.invoke(undefined, instance, false);
        }
        else {
            exports.console.log("initialise " + this);
            this.accept(new InitialiseStateMachine());
            this.clean = true;
        }
    };
    StateMachine.prototype.evaluate = function (instance, message, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        // initialise the state machine model if necessary
        if (autoInitialiseModel && this.clean === false) {
            this.initialise();
        }
        exports.console.log(instance + " evaluate message: " + message);
        return this.evaluateState(instance, message);
    };
    StateMachine.prototype.evaluateState = function (instance, message) {
        var _this = this;
        var result = false;
        // delegate to child regions first if a non-continuation
        this.regions.every(function (region) {
            var currentState = instance.getLastKnownState(region);
            if (currentState && currentState.evaluateState(instance, message)) {
                result = true;
                return _this.isActive(instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
            }
            return true; // NOTE: this just controls the every loop
        });
        return result;
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
        this.onTraverse = new Action();
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
    Transition.prototype.traverse = function (instance, message) {
        var onTraverse = new Action(this.onTraverse);
        var transition = this;
        // process static conditional branches - build up all the transition actions prior to executing
        while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
            // proceed to the next transition
            transition = transition.target.selectTransition(instance, message);
            // concatenate actions before and after junctions
            onTraverse.push(transition.onTraverse);
        }
        // execute the transition actions
        onTraverse.invoke(message, instance, false);
        if (transition.target) {
            // process dynamic conditional branches if required
            if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
                transition.target.selectTransition(instance, message).traverse(instance, message);
            }
            else if (transition.target instanceof State && transition.target.isComplete(instance)) {
                transition.target.evaluateState(instance, transition.target);
            }
        }
        return true;
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
        for (var _i = 0, _a = region.vertices; _i < _a.length; _i++) {
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
        for (var _i = 0, _a = state.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, arg);
        }
        this.visitVertex(state, arg);
    };
    Visitor.prototype.visitStateMachine = function (stateMachine, arg) {
        for (var _i = 0, _a = stateMachine.regions; _i < _a.length; _i++) {
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
var InitialiseStateMachine = (function (_super) {
    __extends(InitialiseStateMachine, _super);
    function InitialiseStateMachine() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.elementActions = {};
        _this.transitions = new Array();
        return _this;
    }
    InitialiseStateMachine.prototype.getActions = function (elemenet) {
        return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = { leave: new Action(), beginEnter: new Action(), endEnter: new Action() });
    };
    InitialiseStateMachine.prototype.visitElement = function (element, deepHistoryAbove) {
        this.getActions(element).leave.push([function (message, instance) { return exports.console.log(instance + " leave " + element); }]); // TODO: remove square braces
        this.getActions(element).beginEnter.push([function (message, instance) { return exports.console.log(instance + " enter " + element); }]); // TODO: remove square braces
    };
    InitialiseStateMachine.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        // find the initial pseudo state of this region
        var regionInitial = region.vertices.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result; }, undefined);
        // leave the curent active child state when exiting the region
        this.getActions(region).leave.push([function (message, instance) {
                var currentState = instance.getCurrent(region);
                if (currentState) {
                    _this.getActions(currentState).leave.invoke(message, instance, false);
                }
            }]);
        // cascade to child vertices
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        // enter the appropriate child vertex when entering the region
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.getActions(region).endEnter.push([function (message, instance, deepHistory) {
                    var actions = _this.getActions((deepHistory || regionInitial.isHistory()) ? instance.getLastKnownState(region) || regionInitial : regionInitial);
                    var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                    actions.beginEnter.invoke(message, instance, history);
                    actions.endEnter.invoke(message, instance, history);
                }]);
        }
        else {
            // TODO: validate initial region
            this.getActions(region).endEnter.push(this.getActions(regionInitial).beginEnter);
            this.getActions(region).endEnter.push(this.getActions(regionInitial).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        _super.prototype.visitVertex.call(this, vertex, deepHistoryAbove);
        // update the parent regions current state
        this.getActions(vertex).beginEnter.push([function (message, instance) {
                instance.setCurrent(vertex.parent, vertex);
            }]);
    };
    InitialiseStateMachine.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        if (pseudoState.isInitial()) {
            this.getActions(pseudoState).endEnter.push([function (message, instance, deepHistory) {
                    if (instance.getLastKnownState(pseudoState.parent)) {
                        _this.getActions(pseudoState).leave.invoke(message, instance, false);
                        var currentState = instance.getLastKnownState(pseudoState.parent);
                        if (currentState) {
                            _this.getActions(currentState).beginEnter.invoke(message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                            _this.getActions(currentState).endEnter.invoke(message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                        }
                    }
                    else {
                        pseudoState.outgoing[0].traverse(instance);
                    }
                }]);
        }
    };
    InitialiseStateMachine.prototype.visitState = function (state, deepHistoryAbove) {
        // NOTE: manually iterate over the child regions to control the sequence of initialisation
        for (var _i = 0, _a = state.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            this.getActions(state).leave.push(this.getActions(region).leave);
            this.getActions(state).endEnter.push(this.getActions(region).beginEnter);
            this.getActions(state).endEnter.push(this.getActions(region).endEnter);
        }
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behavior when entering and exiting states
        this.getActions(state).leave.push(state.exitBehavior);
        this.getActions(state).beginEnter.push(state.entryBehavior);
    };
    InitialiseStateMachine.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
        // initialise the transitions only once all elemenets have been initialised
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
        // enter each child region on state machine entry
        for (var _b = 0, _c = stateMachine.regions; _b < _c.length; _b++) {
            var region = _c[_b];
            stateMachine.onInitialise.push(this.getActions(region).beginEnter);
            stateMachine.onInitialise.push(this.getActions(region).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    InitialiseStateMachine.prototype.visitInternalTransition = function (transition) {
        // perform the transition behavior
        transition.onTraverse.push(transition.effectBehavior);
        // add a test for completion
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push([function (message, instance) {
                    if (transition.source instanceof State && transition.source.isComplete(instance)) {
                        transition.source.evaluateState(instance, transition.source);
                    }
                }]);
        }
    };
    InitialiseStateMachine.prototype.visitLocalTransition = function (transition) {
        var _this = this;
        transition.onTraverse.push([function (message, instance, deepHistory) {
                var targetAncestors = transition.target.getAncestors(); // local transitions will have a target
                var i = 0;
                // find the first inactive element in the target ancestry
                while (targetAncestors[i].isActive(instance)) {
                    i++;
                }
                // TODO: create a test to see if we need region logic
                if (targetAncestors[i] instanceof Region) {
                    throw "Need to implement Region logic";
                }
                var firstToEnter = targetAncestors[i];
                var firstToExit = instance.getCurrent(firstToEnter.parent);
                // exit the source state
                _this.getActions(firstToExit).leave.invoke(message, instance, false);
                // perform the transition behavior;
                for (var _i = 0, _a = transition.effectBehavior; _i < _a.length; _i++) {
                    var action = _a[_i];
                    action(message, instance);
                }
                // enter the target ancestry
                while (i < targetAncestors.length) {
                    _this.getActions(targetAncestors[i++]).beginEnter.invoke(message, instance, false);
                }
                // trigger cascade
                _this.getActions(transition.target).endEnter.invoke(message, instance, false);
            }]);
    };
    InitialiseStateMachine.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = transition.source.getAncestors(), targetAncestors = transition.target.getAncestors(); // external transtions always have a target
        var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
        // find the first uncommon ancestors
        while (sourceAncestors[i] !== targetAncestors[i]) {
            i -= 1;
        }
        if (sourceAncestors[i] instanceof Region) {
            i += 1;
        }
        // leave source ancestry and perform the transition behavior
        transition.onTraverse.push(this.getActions(sourceAncestors[i]).leave);
        transition.onTraverse.push(transition.effectBehavior);
        // enter the target ancestry
        while (i < targetAncestors.length) {
            transition.onTraverse.push(this.getActions(targetAncestors[i++]).beginEnter);
        }
        // trigger cascade
        transition.onTraverse.push(this.getActions(transition.target).endEnter);
    };
    return InitialiseStateMachine;
}(Visitor));
