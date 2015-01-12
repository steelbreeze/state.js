var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/* State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */
var FSM;
(function (FSM) {
    function invoke(actions, p1, p2, p3) {
        var i, l;
        if (actions) {
            for (i = 0, l = actions.length; i < l; i++) {
                actions[i](p1, p2, p3);
            }
        }
    }
    // DONE: TODO: remove this line
    var DictionaryContext = (function () {
        function DictionaryContext(name) {
            this.name = name;
            this.last = {};
            this.isTerminated = false;
        }
        DictionaryContext.prototype.setCurrent = function (region, value) {
            if (region) {
                this.last[region.qualifiedName] = value;
            }
        };
        DictionaryContext.prototype.getCurrent = function (region) {
            return this.last[region.qualifiedName];
        };
        DictionaryContext.prototype.toString = function () {
            return this.name;
        };
        return DictionaryContext;
    })();
    FSM.DictionaryContext = DictionaryContext;
    // DONE: TODO: remove this line
    var NamedElement = (function () {
        function NamedElement(name, parent) {
            this.name = name;
            this.qualifiedName = parent ? parent.qualifiedName + NamedElement.namespaceSeperator + name : name;
        }
        NamedElement.prototype.toString = function () {
            return this.qualifiedName;
        };
        NamedElement.namespaceSeperator = ".";
        return NamedElement;
    })();
    FSM.NamedElement = NamedElement;
    // DONE: TODO: remove this line
    var StateMachineElement = (function (_super) {
        __extends(StateMachineElement, _super);
        function StateMachineElement(name, parent) {
            _super.call(this, name, parent);
            this.parent = parent;
            if (parent) {
                this.root = parent.root;
            }
            this.reset();
        }
        StateMachineElement.prototype.ancestors = function () {
            return (this.parent ? this.parent.ancestors() : []).concat(this);
        };
        StateMachineElement.prototype.reset = function () {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        };
        StateMachineElement.prototype.bootstrap = function (deepHistoryAbove) {
            var element = this;
            // TODO: remove console.log on final release
            this.leave.push(function (message, context, history) {
                console.log(context + " leave " + element);
            });
            this.beginEnter.push(function (message, context, history) {
                console.log(context + " enter " + element);
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        StateMachineElement.prototype.bootstrapEnter = function (traverse, next) {
            traverse = traverse.concat(this.beginEnter);
        };
        return StateMachineElement;
    })(NamedElement);
    FSM.StateMachineElement = StateMachineElement;
    // DONE: TODO: remove this line
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(name, parent, selector) {
            _super.call(this, name, parent);
            this.transitions = [];
            this.selector = selector;
            if (parent) {
                parent.vertices.push(this);
                this.root.clean = false;
            }
        }
        Vertex.prototype.To = function (target) {
            var transition = new Transition(this, target);
            this.transitions.push(transition);
            this.root.clean = false;
            return transition;
        };
        Vertex.prototype.bootstrap = function (deepHistoryAbove) {
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            var vertex = this;
            this.endEnter.push(function (message, context, history) {
                vertex.evaluateCompletions(message, context, history);
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        Vertex.prototype.bootstrapTransitions = function () {
            for (var i = 0, l = this.transitions.length; i < l; i++) {
                this.transitions[i].bootstrap();
            }
        };
        Vertex.prototype.evaluateCompletions = function (message, context, history) {
            if (this.isComplete(context)) {
                this.evaluate(this, context);
            }
        };
        Vertex.prototype.isFinal = function () {
            return this.transitions.length === 0;
        };
        Vertex.prototype.isComplete = function (context) {
            return true;
        };
        Vertex.prototype.evaluate = function (message, context) {
            var transition = this.selector(this.transitions, message, context);
            if (transition) {
                invoke(transition.traverse, message, context, false);
                return true;
            }
            else {
                return false;
            }
        };
        return Vertex;
    })(StateMachineElement);
    FSM.Vertex = Vertex;
    // DONE: TODO: remove this line
    var Region = (function (_super) {
        __extends(Region, _super);
        function Region(name, parent) {
            _super.call(this, name, parent);
            this.vertices = [];
            parent.regions.push(this);
            this.root.clean = false; // TODO: move into StateMachineElement?
        }
        Region.prototype.isComplete = function (context) {
            return context.getCurrent(this).isFinal();
        };
        Region.prototype.bootstrap = function (deepHistoryAbove) {
            var region = this;
            for (var i = 0, l = this.vertices.length; i < l; i++) {
                var vertex = this.vertices[i];
                vertex.reset();
                vertex.bootstrap(deepHistoryAbove || (this.initial && this.initial.kind === 1 /* DeepHistory */));
            }
            this.leave.push(function (message, context, history) {
                var current = context.getCurrent(region);
                if (current.leave) {
                    invoke(current.leave, message, context, history);
                }
            });
            if (deepHistoryAbove || !this.initial || this.initial.isHistory()) {
                var init = this.initial;
                this.endEnter.push(function (message, context, history) {
                    var ini = init;
                    if (history || init.isHistory()) {
                        ini = context.getCurrent(region) || init;
                    }
                    invoke(ini.enter, message, context, history || (init.kind === 1 /* DeepHistory */));
                });
            }
            else {
                this.endEnter = this.endEnter.concat(this.initial.enter);
            }
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
        };
        Region.prototype.bootstrapTransitions = function () {
            for (var i = 0, l = this.vertices.length; i < l; i++) {
                this.vertices[i].bootstrapTransitions();
            }
        };
        Region.prototype.evaluate = function (message, context) {
            return context.getCurrent(this).evaluate(message, context);
        };
        Region.defaultName = "default";
        return Region;
    })(StateMachineElement);
    FSM.Region = Region;
    // DONE: TODO: remove this line
    (function (PseudoStateKind) {
        PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
        PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
        PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
        PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
        PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
        PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
    })(FSM.PseudoStateKind || (FSM.PseudoStateKind = {}));
    var PseudoStateKind = FSM.PseudoStateKind;
    // DONE: TODO: remove this line
    var PseudoState = (function (_super) {
        __extends(PseudoState, _super);
        function PseudoState(name, parent, kind) {
            _super.call(this, name, parent, pseudoState(kind));
            this.kind = kind;
            if (this.isInitial()) {
                parent.initial = this;
            }
        }
        PseudoState.prototype.isHistory = function () {
            return this.kind === 1 /* DeepHistory */ || this.kind === 4 /* ShallowHistory */;
        };
        PseudoState.prototype.isInitial = function () {
            return this.kind === 2 /* Initial */ || this.isHistory();
        };
        PseudoState.prototype.bootstrap = function (deepHistoryAbove) {
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            if (this.kind === 5 /* Terminate */) {
                this.enter.push(function (message, context, history) {
                    context.isTerminated = true;
                });
            }
        };
        return PseudoState;
    })(Vertex);
    FSM.PseudoState = PseudoState;
    // DONE: TODO: remove this line
    var State = (function (_super) {
        __extends(State, _super);
        function State(name, parent) {
            _super.call(this, name, parent, state);
            this.regions = [];
            this.exitActions = [];
            this.entryActions = [];
        }
        State.prototype.exit = function (action) {
            this.exitActions.push(action);
            this.root.clean = false;
            return this;
        };
        State.prototype.entry = function (action) {
            this.entryActions.push(action);
            this.root.clean = false;
            return this;
        };
        State.prototype.isFinal = function () {
            return false;
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
        State.prototype.bootstrap = function (deepHistoryAbove) {
            var state = this; // TODO: make sure state.parent in callback below works
            var sparent = this.parent;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                var region = this.regions[i];
                region.reset();
                region.bootstrap(deepHistoryAbove);
                this.leave.push(function (message, context, history) {
                    invoke(region.leave, message, context, history);
                });
                this.endEnter = this.endEnter.concat(region.enter);
            }
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.leave = this.leave.concat(this.exitActions);
            this.beginEnter = this.beginEnter.concat(this.entryActions);
            this.beginEnter.push(function (message, context, history) {
                context.setCurrent(sparent, state);
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        State.prototype.bootstrapTransitions = function () {
            for (var i = 0, l = this.regions.length; i < l; i++) {
                this.regions[i].bootstrapTransitions();
            }
            _super.prototype.bootstrapTransitions.call(this);
        };
        State.prototype.bootstrapEnter = function (traverse, next) {
            _super.prototype.bootstrapEnter.call(this, traverse, next);
            for (var i = 0, l = this.regions.length; i < l; i++) {
                var region = this.regions[i];
                if (region !== next) {
                    traverse = traverse.concat(region.enter);
                }
            }
        };
        State.prototype.evaluate = function (message, context) {
            var processed = false;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                var region = this.regions[i];
                if (region.evaluate(message, context)) {
                    processed = true;
                }
            }
            if (processed === false) {
                processed = _super.prototype.evaluate.call(this, message, context);
            }
            if (processed === true) {
                this.evaluateCompletions(this, context, false);
            }
            return processed;
        };
        return State;
    })(Vertex);
    FSM.State = State;
    var FinalState = (function (_super) {
        __extends(FinalState, _super);
        function FinalState(name, parent) {
            _super.call(this, name, parent);
        }
        FinalState.prototype.isFinal = function () {
            return true;
        };
        return FinalState;
    })(State);
    FSM.FinalState = FinalState;
    var StateMachine = (function (_super) {
        __extends(StateMachine, _super);
        function StateMachine(name) {
            _super.call(this, name, undefined);
            this.clean = true;
            this.root = this;
        }
        StateMachine.prototype.bootstrap = function (deepHistoryAbove) {
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            _super.prototype.bootstrapTransitions.call(this);
            this.clean = true;
        };
        StateMachine.prototype.initialise = function (context, autoBootstrap) {
            if (autoBootstrap === void 0) { autoBootstrap = true; }
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }
            invoke(this.enter, undefined, context, false);
        };
        return StateMachine;
    })(State);
    FSM.StateMachine = StateMachine;
    var Transition = (function () {
        function Transition(source, target) {
            this.source = source;
            this.target = target;
            this.actions = [];
            this.traverse = [];
            // default the transition to a completion transition
            this.completion();
        }
        Transition.prototype.isElse = function () {
            return false;
        };
        Transition.prototype.completion = function () {
            var src = this.source;
            this.guard = function (message, context) {
                return message === src;
            };
            return this;
        };
        Transition.prototype.when = function (guard) {
            this.guard = guard;
            return this;
        };
        Transition.prototype.effect = function (action) {
            this.actions.push(action);
            this.source.root.clean = false;
            return this;
        };
        Transition.prototype.bootstrap = function () {
            if (this.target === null) {
                this.traverse = this.actions;
            }
            else if (this.target.parent === this.source.parent) {
                this.traverse = this.source.leave.concat(this.actions).concat(this.target.enter);
            }
            else {
                var sourceAncestors = this.source.ancestors();
                var targetAncestors = this.target.ancestors();
                var i = 0, l = Math.min(sourceAncestors.length, targetAncestors.length);
                while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    ++i;
                }
                // TODO: assert common ancestor is a region
                // leave the first uncommon ancestor
                this.traverse = (i < sourceAncestors.length ? sourceAncestors[i] : this.source).leave;
                // perform the transition action
                this.traverse = this.traverse.concat(this.actions);
                while (i < targetAncestors.length) {
                    targetAncestors[i++].bootstrapEnter(this.traverse, targetAncestors[i]);
                }
                // trigger cascade
                this.traverse = this.traverse.concat(this.target.endEnter);
            }
        };
        return Transition;
    })();
    FSM.Transition = Transition;
    function pseudoState(kind) {
        switch (kind) {
            case 2 /* Initial */:
            case 1 /* DeepHistory */:
            case 4 /* ShallowHistory */:
                return initial;
            case 3 /* Junction */:
                return junction;
            case 0 /* Choice */:
                return choice;
            case 5 /* Terminate */:
                return terminate;
        }
    }
    function state(transitions, message, context) {
        var result;
        for (var i = 0, l = transitions.length; i < l; i++) {
            if (transitions[i].guard(message, context)) {
                if (result) {
                    throw "Multiple outbound transitions evaluated true";
                }
                result = transitions[i];
            }
        }
        return result;
    }
    function initial(transitions, message, context) {
        if (transitions.length === 1) {
            return transitions[0];
        }
        else {
            throw "Initial transition must have a single outbound transition";
        }
    }
    function junction(transitions, message, context) {
        var result, i, l = transitions.length;
        for (i = 0; i < l; i++) {
            if (transitions[i].isElse() === false) {
                if (transitions[i].guard(message, context) === true) {
                    if (result) {
                        throw "Multiple outbound transitions evaluated true";
                    }
                    result = transitions[i];
                }
            }
        }
        if (!result) {
            for (i = 0; i < l; i++) {
                if (transitions[i].isElse() === true) {
                    if (result) {
                        throw "Multiple outbound transitions evaluated true";
                    }
                    result = transitions[i];
                }
            }
        }
        return result;
    }
    function choice(transitions, message, context) {
        var results = [], result, i, l = transitions.length;
        for (i = 0; i < l; i++) {
            if (transitions[i].isElse() === false) {
                if (transitions[i].guard(message, context) === true) {
                    results.push(transitions[i]);
                }
            }
        }
        if (results.length !== 0) {
            result = results[Math.round((results.length - 1) * Math.random())];
        }
        if (!result) {
            for (i = 0; i < l; i++) {
                if (transitions[i].isElse() === true) {
                    if (result) {
                        throw "Multiple outbound transitions evaluated true";
                    }
                    result = transitions[i];
                }
            }
        }
        return result;
    }
    function terminate(transitions, message, context) {
        return;
    }
})(FSM || (FSM = {}));
