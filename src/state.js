var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/** State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */
var FSM;
(function (FSM) {
    /**
     * Enumeration describing the various types of PseudoState allowed.
     */
    (function (PseudoStateKind) {
        PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
        PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
        PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
        PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
        PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
        PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
    })(FSM.PseudoStateKind || (FSM.PseudoStateKind = {}));
    var PseudoStateKind = FSM.PseudoStateKind;
    /**
     * An abstract class that can be used as the base for any elmeent with a state machine.
     */
    var Element = (function () {
        function Element(name, element) {
            this.name = name;
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
            if (element) {
                this.root = element.root;
                this.root.clean = false;
            }
        }
        Element.prototype.ancestors = function () {
            return (this.parent() ? this.parent().ancestors() : []).concat(this);
        };
        Element.prototype.reset = function () {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        };
        Element.prototype.bootstrap = function (deepHistoryAbove) {
            // Put these lines back for debugging
            //this.leave.push((message: any, context: IContext) => { console.log(context + " leave " + this); });
            //this.beginEnter.push((message: any, context: IContext) => { console.log(context + " enter " + this); });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        Element.prototype.bootstrapEnter = function (add, next) {
            add(this.beginEnter);
        };
        Element.prototype.toString = function () {
            return this.ancestors().map(function (e) {
                return e.name;
            }).join(Element.namespaceSeperator); // NOTE: while this may look costly, only used at runtime rarely if ever
        };
        Element.namespaceSeperator = ".";
        return Element;
    })();
    FSM.Element = Element;
    /**
     * An element within a state machine model that is a container of Vertices.
     */
    var Region = (function (_super) {
        __extends(Region, _super);
        function Region(name, state) {
            var _this = this;
            _super.call(this, name, state);
            this.state = state;
            this.vertices = [];
            state.regions.push(this);
            this.parent = function () {
                return _this.state;
            };
        }
        Region.prototype.isComplete = function (context) {
            return context.getCurrent(this).isFinal();
        };
        Region.prototype.bootstrap = function (deepHistoryAbove) {
            var _this = this;
            for (var i = 0, l = this.vertices.length; i < l; i++) {
                this.vertices[i].reset();
                this.vertices[i].bootstrap(deepHistoryAbove || (this.initial && this.initial.kind === 1 /* DeepHistory */));
            }
            this.leave.push(function (message, context, history) {
                var current = context.getCurrent(_this);
                if (current.leave) {
                    invoke(current.leave, message, context, history);
                }
            });
            if (deepHistoryAbove || !this.initial || this.initial.isHistory()) {
                this.endEnter.push(function (message, context, history) {
                    var ini = _this.initial;
                    if (history || _this.initial.isHistory()) {
                        ini = context.getCurrent(_this) || _this.initial;
                    }
                    invoke(ini.enter, message, context, history || (_this.initial.kind === 1 /* DeepHistory */));
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
    })(Element);
    FSM.Region = Region;
    /**
     * An element within a state machine model that can be the source or target of a transition.
     */
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(name, element, selector) {
            var _this = this;
            _super.call(this, name, element);
            this.transitions = [];
            this.selector = selector;
            if (element instanceof Region) {
                this.region = element;
            }
            else if (element instanceof State) {
                this.region = element.defaultRegion();
            }
            if (this.region) {
                this.region.vertices.push(this);
            }
            this.parent = function () {
                return _this.region;
            };
        }
        Vertex.prototype.to = function (target) {
            var transition = new Transition(this, target);
            this.transitions.push(transition);
            this.root.clean = false;
            return transition;
        };
        Vertex.prototype.bootstrap = function (deepHistoryAbove) {
            var _this = this;
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.endEnter.push(function (message, context, history) {
                _this.evaluateCompletions(message, context, history);
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
            if (!transition) {
                return false;
            }
            invoke(transition.traverse, message, context, false);
            return true;
        };
        return Vertex;
    })(Element);
    FSM.Vertex = Vertex;
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    var PseudoState = (function (_super) {
        __extends(PseudoState, _super);
        function PseudoState(name, element, kind) {
            _super.call(this, name, element, pseudoState(kind));
            this.kind = kind;
            if (this.isInitial()) {
                this.region.initial = this;
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
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     */
    var State = (function (_super) {
        __extends(State, _super);
        function State(name, element) {
            _super.call(this, name, element, State.selector);
            this.regions = [];
            this.exitBehavior = [];
            this.entryBehavior = [];
        }
        State.selector = function (transitions, message, context) {
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
        };
        State.prototype.defaultRegion = function () {
            var region;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i].name === Region.defaultName) {
                    region = this.regions[i];
                }
            }
            if (!region) {
                region = new Region(Region.defaultName, this);
            }
            return region;
        };
        State.prototype.exit = function (exitAction) {
            this.exitBehavior.push(exitAction);
            this.root.clean = false;
            return this;
        };
        State.prototype.entry = function (entryAction) {
            this.entryBehavior.push(entryAction);
            this.root.clean = false;
            return this;
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
            var _this = this;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                var region = this.regions[i]; // regadless of TypeScript, still need this in this instance
                region.reset();
                region.bootstrap(deepHistoryAbove);
                this.leave.push(function (message, context, history) {
                    invoke(region.leave, message, context, history);
                });
                this.endEnter = this.endEnter.concat(region.enter);
            }
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.leave = this.leave.concat(this.exitBehavior);
            this.beginEnter = this.beginEnter.concat(this.entryBehavior);
            this.beginEnter.push(function (message, context, history) {
                if (_this.region) {
                    context.setCurrent(_this.region, _this);
                }
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        State.prototype.bootstrapTransitions = function () {
            for (var i = 0, l = this.regions.length; i < l; i++) {
                this.regions[i].bootstrapTransitions();
            }
            _super.prototype.bootstrapTransitions.call(this);
        };
        State.prototype.bootstrapEnter = function (add, next) {
            _super.prototype.bootstrapEnter.call(this, add, next);
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i] !== next) {
                    add(this.regions[i].enter);
                }
            }
        };
        State.prototype.evaluate = function (message, context) {
            var processed = false;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i].evaluate(message, context)) {
                    processed = true;
                }
            }
            if (processed === false) {
                processed = _super.prototype.evaluate.call(this, message, context);
            }
            if (processed === true && message !== this) {
                this.evaluateCompletions(this, context, false);
            }
            return processed;
        };
        return State;
    })(Vertex);
    FSM.State = State;
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     */
    var FinalState = (function (_super) {
        __extends(FinalState, _super);
        function FinalState(name, element) {
            _super.call(this, name, element);
        }
        FinalState.prototype.to = function (target) {
            throw "A FinalState cannot be the source of a transition.";
        };
        return FinalState;
    })(State);
    FSM.FinalState = FinalState;
    /**
     * An element within a state machine model that represents the root of the state machine model.
     */
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
        StateMachine.prototype.evaluate = function (message, context) {
            if (context.isTerminated) {
                return false;
            }
            return _super.prototype.evaluate.call(this, message, context);
        };
        return StateMachine;
    })(State);
    FSM.StateMachine = StateMachine;
    /**
     * An element within a state machine model that represents a valid transition between vertices in response to a message.
     */
    var Transition = (function () {
        function Transition(source, target) {
            this.source = source;
            this.target = target;
            this.transitionBehavior = [];
            this.traverse = [];
            this.completion(); // default the transition to a completion transition
        }
        Transition.prototype.completion = function () {
            var _this = this;
            this.guard = function (message, context) {
                return message === _this.source;
            };
            return this;
        };
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
            this.source.root.clean = false;
            return this;
        };
        Transition.prototype.bootstrap = function () {
            var _this = this;
            if (this.target === null) {
                this.traverse = this.transitionBehavior;
            }
            else if (this.target.parent() === this.source.parent()) {
                this.traverse = this.source.leave.concat(this.transitionBehavior).concat(this.target.enter);
            }
            else {
                var sourceAncestors = this.source.ancestors();
                var targetAncestors = this.target.ancestors();
                var sourceAncestorsLength = sourceAncestors.length;
                var targetAncestorsLength = targetAncestors.length;
                var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);
                while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    i++;
                }
                // validate transition does not cross sibling regions boundaries
                assert(!(sourceAncestors[i] instanceof Region), "Transitions may not cross sibling orthogonal region boundaries");
                // leave the first uncommon ancestor
                this.traverse = (i < sourceAncestorsLength ? sourceAncestors[i] : this.source).leave.slice(0);
                // perform the transition action
                this.traverse = this.traverse.concat(this.transitionBehavior);
                if (i >= targetAncestorsLength) {
                    this.traverse = this.traverse.concat(this.target.beginEnter);
                }
                while (i < targetAncestorsLength) {
                    targetAncestors[i++].bootstrapEnter(function (additional) {
                        _this.traverse = _this.traverse.concat(additional);
                    }, targetAncestors[i]);
                }
                // trigger cascade
                this.traverse = this.traverse.concat(this.target.endEnter);
            }
        };
        Transition.isElse = function (message, context) {
            return false;
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
            if (transitions[i].guard(message, context) === true) {
                if (result) {
                    throw "Multiple outbound transitions evaluated true";
                }
                result = transitions[i];
            }
        }
        if (!result) {
            for (i = 0; i < l; i++) {
                if (transitions[i].guard === Transition.isElse) {
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
            if (transitions[i].guard(message, context) === true) {
                results.push(transitions[i]);
            }
        }
        if (results.length !== 0) {
            result = results[Math.round((results.length - 1) * Math.random())];
        }
        if (!result) {
            for (i = 0; i < l; i++) {
                if (transitions[i].guard === Transition.isElse) {
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
    function invoke(behavior, message, context, history) {
        for (var i = 0, l = behavior.length; i < l; i++) {
            behavior[i](message, context, history);
        }
    }
    function assert(condition, error) {
        if (!condition) {
            throw error;
        }
    }
    /**
     * Default working implementation of a state machine context class.
     */
    var Context = (function () {
        function Context() {
            this.isTerminated = false;
            this.last = {};
        }
        Context.prototype.setCurrent = function (region, value) {
            this.last[region.toString()] = value;
        };
        Context.prototype.getCurrent = function (region) {
            return this.last[region.toString()];
        };
        return Context;
    })();
    FSM.Context = Context;
})(FSM || (FSM = {}));
