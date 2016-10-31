"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// push any number of arrays into a target array
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
exports.random = function (max) { return Math.floor(Math.random() * max); };
function setRandom(value) {
    exports.random = value;
}
exports.setRandom = setRandom;
function invoke(actions, message, instance, deepHistory) {
    for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
        var action = actions_1[_i];
        action(message, instance, deepHistory);
    }
}
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
        console.log("created " + this);
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
    StateMachine.prototype.toString = function () {
        return this.name;
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;
var Transition = (function () {
    // private onTraverse = new Array<Action>();
    function Transition(source, target, kind) {
        var _this = this;
        if (kind === void 0) { kind = TransitionKind.External; }
        this.source = source;
        this.target = target;
        this.kind = kind;
        this.effectBehavior = new Array();
        this.guard = source instanceof PseudoState ? function () { return true; } : function (message) { return message === _this.source; };
        this.source.outgoing.push(this);
        this.source.getRoot().clean = false;
        if (this.target) {
            this.target.incoming.push(this);
        }
        else {
            this.kind = TransitionKind.Internal;
        }
        console.log("created transition from " + source + " to " + target);
    }
    Transition.prototype.else = function () {
        this.guard = function () { return false; };
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
exports.Transition = Transition;
var Visitor = (function () {
    function Visitor() {
    }
    Visitor.prototype.visitElement = function (element, arg) {
        console.log("visiting " + element.toString());
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
        console.log("visiting " + transition);
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
        _super.apply(this, arguments);
        this.elementActions = {};
        this.transitions = new Array();
    }
    InitialiseStateMachine.prototype.getActions = function (elemenet) {
        return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = new ElementActions());
    };
    InitialiseStateMachine.prototype.visitElement = function (element, deepHistory) {
        this.getActions(element).leave.push(function (message, instance) { return console.log(instance + " leave " + element); });
        this.getActions(element).beginEnter.push(function (message, instance) { return console.log(instance + " enter " + element); });
    };
    InitialiseStateMachine.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    InitialiseStateMachine.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
        // initialise the transitions only once all elemenets have been initialised
        for (var _i = 0, _a = this.transitions; _i < _a.length; _i++) {
            var transition = _a[_i];
            console.log("init trans: " + transition);
        }
        // enter each child region on state machine entry
        for (var _b = 0, _c = stateMachine.regions; _b < _c.length; _b++) {
            var region = _c[_b];
            pushh(stateMachine.onInitialise, this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
    };
    return InitialiseStateMachine;
}(Visitor));
