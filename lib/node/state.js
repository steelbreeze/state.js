"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/** Random number generation method. */
exports.random = function (max) { return Math.floor(Math.random() * max); };
/** Set a custom random number generation method. */
function setRandom(value) {
    exports.random = value;
}
exports.setRandom = setRandom;
function pushh(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    for (var _a = 0, sources_1 = sources; _a < sources_1.length; _a++) {
        var source = sources_1[_a];
        for (var _b = 0, source_1 = source; _b < source_1.length; _b++) {
            var item = source_1[_b];
            target.push(item);
        }
    }
}
function invoke(actions, message, instance, deepHistory) {
    for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
        var action = actions_1[_i];
        action(message, instance, deepHistory);
    }
}
var GuardElse = function (message, instance) { return false; };
(function (PseudoStateKind) {
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
})(exports.PseudoStateKind || (exports.PseudoStateKind = {}));
var PseudoStateKind = exports.PseudoStateKind;
(function (TransitionKind) {
    TransitionKind[TransitionKind["External"] = 0] = "External";
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    TransitionKind[TransitionKind["Local"] = 2] = "Local";
})(exports.TransitionKind || (exports.TransitionKind = {}));
var TransitionKind = exports.TransitionKind;
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
    NamedElement.namespaceSeparator = ".";
    return NamedElement;
}());
exports.NamedElement = NamedElement;
var Region = (function (_super) {
    __extends(Region, _super);
    function Region(name, parent) {
        _super.call(this, name, parent);
        this.vertices = new Array();
        this.parent.regions.push(this);
        this.getRoot().clean = false;
    }
    Region.prototype.isComplete = function (instance) {
        var currentState = instance.getCurrent(this);
        return currentState !== undefined && currentState.isFinal();
    };
    Region.prototype.accept = function (visitor, arg) {
        visitor.visitRegion(this, arg);
    };
    Region.defaultName = "default";
    return Region;
}(NamedElement));
exports.Region = Region;
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    function Vertex(name, parent) {
        _super.call(this, name, parent instanceof Region ? parent : parent.getDefaultRegion());
        this.outgoing = new Array();
        this.incoming = new Array();
        this.parent.vertices.push(this);
        this.getRoot().clean = false;
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
        _super.call(this, name, parent);
        this.kind = kind;
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
            console.error("Multiple outbound transition guards returned true at " + this + " for " + message);
        }
        return transitions[0] || this.findElse();
    };
    PseudoState.prototype.findElse = function () {
        return this.outgoing.filter(function (transition) { return transition.guard === GuardElse; })[0];
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
        _super.call(this, name, parent);
        this.regions = new Array();
        this.entryBehavior = new Array();
        this.exitBehavior = new Array();
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
    State.prototype.enter = function (action) {
        this.exitBehavior.push(action);
        this.getRoot().clean = false;
        return this;
    };
    State.prototype.isActive = function (instance) {
        return _super.prototype.isActive.call(this, instance) && instance.getCurrent(this.parent) === this;
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
                var currentState = instance.getCurrent(region);
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
                console.error(this + ": multiple outbound transitions evaluated true for message " + message);
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
        this.onInitialise = new Array(); // TODO: make private
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
            console.log("initialise " + instance);
            invoke(this.onInitialise, undefined, instance, false);
        }
        else {
            console.log("initialise " + this);
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
        console.log(instance + " evaluate " + message);
        return this.evaluateState(instance, message);
    };
    StateMachine.prototype.evaluateState = function (instance, message) {
        var _this = this;
        var result = false;
        // delegate to child regions first if a non-continuation
        this.regions.every(function (region) {
            var currentState = instance.getCurrent(region);
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
        var _this = this;
        if (kind === void 0) { kind = TransitionKind.External; }
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
    Transition.prototype.else = function () {
        this.guard = GuardElse;
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
        var onTraverse = this.onTraverse.slice(0);
        var transition = this;
        // process static conditional branches - build up all the transition behavior prior to executing
        while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
            // proceed to the next transition
            transition = transition.target.selectTransition(instance, message);
            // concatenate behavior before and after junctions
            pushh(onTraverse, transition.onTraverse);
        }
        // execute the transition behavior
        invoke(onTraverse, message, instance, false);
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
        this.activeStateConfiguration = {};
    }
    DictionaryInstance.prototype.setCurrent = function (region, state) {
        this.activeStateConfiguration[region.qualifiedName] = state;
    };
    DictionaryInstance.prototype.getCurrent = function (region) {
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
        _super.apply(this, arguments);
        this.elementActions = {};
        this.transitions = new Array();
    }
    InitialiseStateMachine.prototype.getActions = function (elemenet) {
        return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = { leave: [], beginEnter: [], endEnter: [] });
    };
    InitialiseStateMachine.prototype.visitElement = function (element, deepHistoryAbove) {
        this.getActions(element).leave.push(function (message, instance) { return console.log(instance + " leave " + element); });
        this.getActions(element).beginEnter.push(function (message, instance) { return console.log(instance + " enter " + element); });
    };
    InitialiseStateMachine.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        // find the initial pseudo state of this region
        var regionInitial = region.vertices.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result; }, undefined);
        // cascade to child vertices
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        // leave the curent active child state when exiting the region
        this.getActions(region).leave.push(function (message, instance) {
            var currentState = instance.getCurrent(region);
            if (currentState) {
                invoke(_this.getActions(currentState).leave, message, instance, false);
            }
        });
        // enter the appropriate child vertex when entering the region
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            this.getActions(region).endEnter.push(function (message, instance, deepHistory) {
                var actions = _this.getActions((deepHistory || regionInitial.isHistory()) ? instance.getCurrent(region) || regionInitial : regionInitial);
                var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                invoke(actions.beginEnter, message, instance, history);
                invoke(actions.endEnter, message, instance, history);
            });
        }
        else {
            // TODO: validate initial region
            pushh(this.getActions(region).endEnter, this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        if (pseudoState.isInitial()) {
            this.getActions(pseudoState).endEnter.push(function (message, instance, deepHistory) {
                if (instance.getCurrent(pseudoState.parent)) {
                    invoke(_this.getActions(pseudoState).leave, message, instance, false);
                    var currentState = instance.getCurrent(pseudoState.parent);
                    if (currentState) {
                        invoke(_this.getActions(currentState).beginEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                        invoke(_this.getActions(currentState).endEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                    }
                }
                else {
                    pseudoState.outgoing[0].traverse(instance);
                }
            });
        }
    };
    InitialiseStateMachine.prototype.visitState = function (state, deepHistoryAbove) {
        // NOTE: manually iterate over the child regions to control the sequence of behavior
        for (var _i = 0, _a = state.regions; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            pushh(this.getActions(state).leave, this.getActions(region).leave);
            pushh(this.getActions(state).endEnter, this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behavior when entering and exiting states
        pushh(this.getActions(state).leave, state.exitBehavior);
        pushh(this.getActions(state).beginEnter, state.entryBehavior);
        // update the parent regions current state
        this.getActions(state).beginEnter.push(function (message, instance) {
            instance.setCurrent(state.parent, state);
        });
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
            pushh(stateMachine.onInitialise, this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
    };
    InitialiseStateMachine.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    InitialiseStateMachine.prototype.visitInternalTransition = function (transition) {
        // perform the transition behavior
        pushh(transition.onTraverse, transition.effectBehavior);
        // add a test for completion
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push(function (message, instance) {
                if (transition.source instanceof State && transition.source.isComplete(instance)) {
                    transition.source.evaluateState(instance, transition.source);
                }
            });
        }
    };
    InitialiseStateMachine.prototype.visitLocalTransition = function (transition) {
    };
    InitialiseStateMachine.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = transition.source.getAncestors(), targetAncestors = transition.target.getAncestors(); // external transtions always have a target
        var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
        // find the index of the first uncommon ancestor (or for external transitions, the source)
        while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
            --i;
        }
        // leave source ancestry and perform the transition effect
        pushh(transition.onTraverse, this.getActions(sourceAncestors[i]).leave, transition.effectBehavior);
        // enter the target ancestry
        while (i < targetAncestors.length) {
            pushh(transition.onTraverse, this.getActions(targetAncestors[i++]).beginEnter);
        }
        // trigger cascade
        pushh(transition.onTraverse, this.getActions(transition.target).endEnter);
    };
    return InitialiseStateMachine;
}(Visitor));
exports.internalTransitionsTriggerCompletion = false;
function setInternalTransitionsTriggerCompletion(value) {
    exports.internalTransitionsTriggerCompletion = value;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
