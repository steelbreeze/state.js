/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    (function (PseudoStateKind) {
        PseudoStateKind[PseudoStateKind["Initial"] = 0] = "Initial";
        PseudoStateKind[PseudoStateKind["ShallowHistory"] = 1] = "ShallowHistory";
        PseudoStateKind[PseudoStateKind["DeepHistory"] = 2] = "DeepHistory";
        PseudoStateKind[PseudoStateKind["Choice"] = 3] = "Choice";
        PseudoStateKind[PseudoStateKind["Junction"] = 4] = "Junction";
        PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
    })(StateJS.PseudoStateKind || (StateJS.PseudoStateKind = {}));
    var PseudoStateKind = StateJS.PseudoStateKind;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var Element = (function () {
        function Element(name) {
            this.name = name;
        }
        Element.prototype.getParent = function () {
            return;
        };
        Element.prototype.getRoot = function () {
            return this.getParent().getRoot();
        };
        Element.prototype.ancestors = function () {
            return (this.getParent() ? this.getParent().ancestors() : []).concat(this);
        };
        Element.prototype.accept = function (visitor, arg1, arg2, arg3) { };
        Element.prototype.toString = function () {
            return this.qualifiedName;
        };
        Element.namespaceSeparator = ".";
        return Element;
    })();
    StateJS.Element = Element;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var StateJS;
(function (StateJS) {
    var Region = (function (_super) {
        __extends(Region, _super);
        function Region(name, state) {
            _super.call(this, name);
            this.vertices = [];
            this.state = state;
            this.state.regions.push(this);
            this.state.getRoot().clean = false;
        }
        Region.prototype.getParent = function () {
            return this.state;
        };
        Region.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitRegion(this, arg1, arg2, arg3);
        };
        Region.defaultName = "default";
        return Region;
    })(StateJS.Element);
    StateJS.Region = Region;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(name, parent) {
            _super.call(this, name);
            this.transitions = [];
            if (parent instanceof StateJS.Region) {
                this.region = parent;
            }
            else if (parent instanceof StateJS.State) {
                this.region = parent.defaultRegion();
            }
            if (this.region) {
                this.region.vertices.push(this);
                this.region.getRoot().clean = false;
            }
        }
        Vertex.prototype.getParent = function () {
            return this.region;
        };
        Vertex.prototype.to = function (target) {
            var transition = new StateJS.Transition(this, target);
            this.transitions.push(transition);
            this.getRoot().clean = false;
            return transition;
        };
        return Vertex;
    })(StateJS.Element);
    StateJS.Vertex = Vertex;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var PseudoState = (function (_super) {
        __extends(PseudoState, _super);
        function PseudoState(name, parent, kind) {
            _super.call(this, name, parent);
            this.kind = kind;
            if (this.isInitial()) {
                this.region.initial = this;
            }
        }
        PseudoState.prototype.isHistory = function () {
            return this.kind === StateJS.PseudoStateKind.DeepHistory || this.kind === StateJS.PseudoStateKind.ShallowHistory;
        };
        PseudoState.prototype.isInitial = function () {
            return this.kind === StateJS.PseudoStateKind.Initial || this.isHistory();
        };
        PseudoState.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitPseudoState(this, arg1, arg2, arg3);
        };
        return PseudoState;
    })(StateJS.Vertex);
    StateJS.PseudoState = PseudoState;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var State = (function (_super) {
        __extends(State, _super);
        function State(name, parent) {
            _super.call(this, name, parent);
            this.exitBehavior = [];
            this.entryBehavior = [];
            this.regions = [];
        }
        State.prototype.defaultRegion = function () {
            var region;
            this.regions.forEach(function (r) { if (r.name === StateJS.Region.defaultName) {
                region = r;
            } });
            if (!region) {
                region = new StateJS.Region(StateJS.Region.defaultName, this);
            }
            return region;
        };
        State.prototype.isFinal = function () {
            return this.transitions.length === 0;
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
        State.prototype.exit = function (exitAction) {
            this.exitBehavior.push(exitAction);
            this.getRoot().clean = false;
            return this;
        };
        State.prototype.entry = function (entryAction) {
            this.entryBehavior.push(entryAction);
            this.getRoot().clean = false;
            return this;
        };
        State.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitState(this, arg1, arg2, arg3);
        };
        return State;
    })(StateJS.Vertex);
    StateJS.State = State;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var FinalState = (function (_super) {
        __extends(FinalState, _super);
        function FinalState(name, parent) {
            _super.call(this, name, parent);
        }
        FinalState.prototype.to = function (target) {
            throw "A FinalState cannot be the source of a transition.";
        };
        FinalState.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitFinalState(this, arg1, arg2, arg3);
        };
        return FinalState;
    })(StateJS.State);
    StateJS.FinalState = FinalState;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var StateMachine = (function (_super) {
        __extends(StateMachine, _super);
        function StateMachine(name) {
            _super.call(this, name, undefined);
            this.clean = false;
        }
        StateMachine.prototype.getRoot = function () {
            return this.region ? this.region.getRoot() : this;
        };
        StateMachine.prototype.setLogger = function (value) {
            if (value === void 0) { value = undefined; }
            this.logger = value;
            this.clean = false;
            return this;
        };
        StateMachine.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitStateMachine(this, arg1, arg2, arg3);
        };
        return StateMachine;
    })(StateJS.State);
    StateJS.StateMachine = StateMachine;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var Transition = (function () {
        function Transition(source, target) {
            var _this = this;
            this.source = source;
            this.target = target;
            this.transitionBehavior = [];
            this.traverse = [];
            this.guard = function (message) { return message === _this.source; };
        }
        Transition.prototype.else = function () {
            this.guard = Transition.isElse;
            return this;
        };
        Transition.prototype.when = function (guard) {
            this.guard = guard;
            return this;
        };
        Transition.prototype.effect = function (transitionAction) {
            this.transitionBehavior.push(transitionAction);
            this.source.getRoot().clean = false;
            return this;
        };
        Transition.prototype.accept = function (visitor, arg1, arg2, arg3) {
            return visitor.visitTransition(this, arg1, arg2, arg3);
        };
        Transition.isElse = function () { return false; };
        return Transition;
    })();
    StateJS.Transition = Transition;
    var Visitor = (function () {
        function Visitor() {
        }
        Visitor.prototype.visitElement = function (element, arg1, arg2, arg3) {
            return;
        };
        Visitor.prototype.visitRegion = function (region, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitElement(region, arg1, arg2, arg3);
            region.vertices.forEach(function (vertex) { vertex.accept(_this, arg1, arg2, arg3); });
            return result;
        };
        Visitor.prototype.visitVertex = function (vertex, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitElement(vertex, arg1, arg2, arg3);
            vertex.transitions.forEach(function (transition) { transition.accept(_this, arg1, arg2, arg3); });
            return result;
        };
        Visitor.prototype.visitPseudoState = function (pseudoState, arg1, arg2, arg3) {
            return this.visitVertex(pseudoState, arg1, arg2, arg3);
        };
        Visitor.prototype.visitState = function (state, arg1, arg2, arg3) {
            var _this = this;
            var result = this.visitVertex(state, arg1, arg2, arg3);
            state.regions.forEach(function (region) { region.accept(_this, arg1, arg2, arg3); });
            return result;
        };
        Visitor.prototype.visitFinalState = function (finalState, arg1, arg2, arg3) {
            return this.visitState(finalState, arg1, arg2, arg3);
        };
        Visitor.prototype.visitStateMachine = function (stateMachine, arg1, arg2, arg3) {
            return this.visitState(stateMachine, arg1, arg2, arg3);
        };
        Visitor.prototype.visitTransition = function (transition, arg1, arg2, arg3) {
            return;
        };
        return Visitor;
    })();
    StateJS.Visitor = Visitor;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    var StateMachineInstance = (function () {
        function StateMachineInstance(name) {
            if (name === void 0) { name = "unnamed"; }
            this.name = name;
            this.last = {};
            this.isTerminated = false;
        }
        StateMachineInstance.prototype.setCurrent = function (region, state) {
            this.last[region.qualifiedName] = state;
        };
        StateMachineInstance.prototype.getCurrent = function (region) {
            return this.last[region.qualifiedName];
        };
        StateMachineInstance.prototype.toString = function () {
            return this.name;
        };
        return StateMachineInstance;
    })();
    StateJS.StateMachineInstance = StateMachineInstance;
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
    function initialise(stateMachineModel, stateMachineInstance, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        if (stateMachineInstance) {
            if (autoInitialiseModel && stateMachineModel.clean === false) {
                initialise(stateMachineModel);
            }
            if (stateMachineModel.logger) {
                stateMachineModel.logger.log("initialise " + stateMachineInstance);
            }
            invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);
        }
        else {
            if (stateMachineModel.logger) {
                stateMachineModel.logger.log("initialise " + stateMachineModel.name);
            }
            stateMachineModel.accept(new InitialiseElements(), false);
            stateMachineModel.clean = true;
        }
    }
    StateJS.initialise = initialise;
    function evaluate(stateMachineModel, stateMachineInstance, message, autoInitialiseModel) {
        if (autoInitialiseModel === void 0) { autoInitialiseModel = true; }
        if (stateMachineModel.logger) {
            stateMachineModel.logger.log(stateMachineInstance + " evaluate " + message);
        }
        if (autoInitialiseModel && stateMachineModel.clean === false) {
            initialise(stateMachineModel);
        }
        if (stateMachineInstance.isTerminated) {
            return false;
        }
        return stateMachineModel.accept(Evaluator.instance, stateMachineInstance, message);
    }
    StateJS.evaluate = evaluate;
    function isComplete(vertex, stateMachineInstance) {
        if (vertex instanceof StateJS.State) {
            return vertex.regions.every(function (region) { return stateMachineInstance.getCurrent(region).isFinal(); });
        }
        return true;
    }
    StateJS.isComplete = isComplete;
    var ElementBehavior = (function () {
        function ElementBehavior() {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        }
        return ElementBehavior;
    })();
    function invoke(behavior, message, stateMachineInstance, history) {
        if (history === void 0) { history = false; }
        behavior.forEach(function (action) { action(message, stateMachineInstance, history); });
    }
    function isActive(state, stateMachineInstance) {
        return state.region ? (isActive(state.region.state, stateMachineInstance) && (stateMachineInstance.getCurrent(state.region) === state)) : true;
    }
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
                case StateJS.PseudoStateKind.Initial:
                case StateJS.PseudoStateKind.DeepHistory:
                case StateJS.PseudoStateKind.ShallowHistory:
                    if (pseudoState.transitions.length === 1) {
                        transition = pseudoState.transitions[0];
                    }
                    else {
                        throw "Initial transition must have a single outbound transition from " + pseudoState;
                    }
                    break;
                case StateJS.PseudoStateKind.Junction:
                    var result, elseResult;
                    pseudoState.transitions.forEach(function (t) {
                        if (t.guard === StateJS.Transition.isElse) {
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
                case StateJS.PseudoStateKind.Choice:
                    var results = [];
                    pseudoState.transitions.forEach(function (t) {
                        if (t.guard === StateJS.Transition.isElse) {
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
            for (var i = 0, l = state.regions.length; i < l; i++) {
                if (state.regions[i].accept(this, stateMachineInstance, message)) {
                    result = true;
                    if (!isActive(state, stateMachineInstance)) {
                        break;
                    }
                }
            }
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
            if (result && (message !== state) && isComplete(state, stateMachineInstance)) {
                this.visitState(state, stateMachineInstance, state);
            }
            return result;
        };
        Evaluator.instance = new Evaluator();
        return Evaluator;
    })(StateJS.Visitor);
    var InitialiseTransitions = (function (_super) {
        __extends(InitialiseTransitions, _super);
        function InitialiseTransitions() {
            _super.apply(this, arguments);
        }
        InitialiseTransitions.prototype.visitTransition = function (transition, behaviour) {
            if (!transition.target) {
                this.visitInternalTransition(transition);
            }
            else if (transition.target.region === transition.source.region) {
                this.visitLocalTransition(transition, behaviour);
            }
            else {
                this.visitExternalTransition(transition, behaviour);
            }
        };
        InitialiseTransitions.prototype.visitInternalTransition = function (transition) {
            transition.traverse = transition.transitionBehavior;
        };
        InitialiseTransitions.prototype.visitLocalTransition = function (transition, behaviour) {
            transition.traverse = behaviour(transition.source).leave.concat(transition.transitionBehavior).concat(behaviour(transition.target).enter);
        };
        InitialiseTransitions.prototype.visitExternalTransition = function (transition, behaviour) {
            var sourceAncestors = transition.source.ancestors();
            var targetAncestors = transition.target.ancestors();
            var i = 0, l = Math.min(sourceAncestors.length, targetAncestors.length);
            while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                i++;
            }
            transition.traverse = behaviour(i < sourceAncestors.length ? sourceAncestors[i] : transition.source).leave.slice(0);
            transition.traverse = transition.traverse.concat(transition.transitionBehavior);
            if (i >= targetAncestors.length) {
                transition.traverse = transition.traverse.concat(behaviour(transition.target).beginEnter);
            }
            while (i < targetAncestors.length) {
                this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], i < targetAncestors.length ? targetAncestors[i] : undefined);
            }
            transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
        };
        InitialiseTransitions.prototype.cascadeElementEntry = function (transition, behaviour, element, next) {
            transition.traverse = transition.traverse.concat(behaviour(element).beginEnter);
            if (element instanceof StateJS.State) {
                this.cascadeOrthogonalRegionEntry(transition, behaviour, element, next);
            }
        };
        InitialiseTransitions.prototype.cascadeOrthogonalRegionEntry = function (transition, behaviour, state, next) {
            if (state.isOrthogonal()) {
                state.regions.forEach(function (region) { if (region !== next) {
                    transition.traverse = transition.traverse.concat(behaviour(region).enter);
                } });
            }
        };
        return InitialiseTransitions;
    })(StateJS.Visitor);
    var InitialiseElements = (function (_super) {
        __extends(InitialiseElements, _super);
        function InitialiseElements() {
            _super.apply(this, arguments);
            this.behaviours = {};
        }
        InitialiseElements.prototype.behaviour = function (element) {
            if (!element.qualifiedName) {
                element.qualifiedName = element.ancestors().map(function (e) { return e.name; }).join(StateJS.Element.namespaceSeparator);
            }
            return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
        };
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
            region.vertices.forEach(function (vertex) { vertex.accept(_this, deepHistoryAbove || (region.initial && region.initial.kind === StateJS.PseudoStateKind.DeepHistory)); });
            regionBehaviour.leave.push(function (message, stateMachineInstance) {
                invoke(_this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance);
            });
            if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
                regionBehaviour.endEnter.push(function (message, stateMachineInstance, history) {
                    var initial = region.initial;
                    if (history || region.initial.isHistory()) {
                        initial = stateMachineInstance.getCurrent(region) || region.initial;
                    }
                    invoke(_this.behaviour(initial).enter, message, stateMachineInstance, history || region.initial.kind === StateJS.PseudoStateKind.DeepHistory);
                });
            }
            else {
                regionBehaviour.endEnter = regionBehaviour.endEnter.concat(this.behaviour(region.initial).enter);
            }
            this.visitElement(region, deepHistoryAbove);
            regionBehaviour.enter = regionBehaviour.beginEnter.concat(regionBehaviour.endEnter);
        };
        InitialiseElements.prototype.visitVertex = function (vertex, deepHistoryAbove) {
            this.visitElement(vertex, deepHistoryAbove);
            this.behaviour(vertex).endEnter.push(function (message, stateMachineInstance) {
                if (isComplete(vertex, stateMachineInstance)) {
                    vertex.accept(Evaluator.instance, stateMachineInstance, vertex);
                }
            });
        };
        InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
            var pseudoStateBehaviour = this.behaviour(pseudoState);
            this.visitVertex(pseudoState, deepHistoryAbove);
            if (pseudoState.kind === StateJS.PseudoStateKind.Terminate) {
                pseudoStateBehaviour.enter.push(function (message, stateMachineInstance) {
                    stateMachineInstance.isTerminated = true;
                });
            }
            pseudoStateBehaviour.enter = pseudoStateBehaviour.beginEnter.concat(pseudoStateBehaviour.endEnter);
        };
        InitialiseElements.prototype.visitState = function (state, deepHistoryAbove) {
            var _this = this;
            var stateBehaviour = this.behaviour(state);
            state.regions.forEach(function (region) {
                var regionBehaviour = _this.behaviour(region);
                region.accept(_this, deepHistoryAbove);
                stateBehaviour.leave = stateBehaviour.leave.concat(regionBehaviour.leave);
                stateBehaviour.endEnter = stateBehaviour.endEnter.concat(regionBehaviour.enter);
            });
            this.visitVertex(state, deepHistoryAbove);
            stateBehaviour.leave = stateBehaviour.leave.concat(state.exitBehavior);
            stateBehaviour.beginEnter = stateBehaviour.beginEnter.concat(state.entryBehavior);
            stateBehaviour.beginEnter.push(function (message, stateMachineInstance) {
                if (state.region) {
                    stateMachineInstance.setCurrent(state.region, state);
                }
            });
            stateBehaviour.enter = stateBehaviour.beginEnter.concat(stateBehaviour.endEnter);
        };
        InitialiseElements.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
            var _this = this;
            this.visitState(stateMachine, deepHistoryAbove);
            stateMachine.accept(new InitialiseTransitions(), function (element) { return _this.behaviour(element); });
            stateMachine.onInitialise = this.behaviour(stateMachine).enter;
        };
        return InitialiseElements;
    })(StateJS.Visitor);
})(StateJS || (StateJS = {}));
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var module = module;
module.exports = StateJS;
