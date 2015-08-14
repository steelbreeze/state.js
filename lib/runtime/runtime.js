var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
var StateJS;
(function (StateJS) {
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
        if (stateMachineInstance) {
            // initialise the state machine model if necessary
            if (autoInitialiseModel && stateMachineModel.clean === false) {
                initialise(stateMachineModel);
            }
            // log as required
            exports.logTo.log("initialise " + stateMachineInstance);
            // enter the state machine instance for the first time
            stateMachineModel.onInitialise.forEach(function (action) { return action(undefined, stateMachineInstance); });
        }
        else {
            // log as required
            exports.logTo.log("initialise " + stateMachineModel.name);
            // initialise the state machine model
            stateMachineModel.accept(new InitialiseElements(), false);
            stateMachineModel.clean = true;
        }
    }
    StateJS.initialise = initialise;
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
        exports.logTo.log(stateMachineInstance + " evaluate " + message);
        // initialise the state machine model if necessary
        if (autoInitialiseModel && stateMachineModel.clean === false) {
            initialise(stateMachineModel);
        }
        // terminated state machine instances will not evaluate messages
        if (stateMachineInstance.isTerminated) {
            return false;
        }
        return evaluateState(stateMachineModel, stateMachineInstance, message);
    }
    StateJS.evaluate = evaluate;
    // evaluates messages against a state, executing transitions as appropriate
    function evaluateState(state, stateMachineInstance, message) {
        var result = false;
        // delegate to child regions first
        state.regions.every(function (region) {
            if (evaluateState(stateMachineInstance.getCurrent(region), stateMachineInstance, message)) {
                result = true;
                return isActive(state, stateMachineInstance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
            }
            return true; // NOTE: this just controls the every loop
        });
        // if a transition occured in a child region, check for completions
        if (result) {
            if ((message !== state) && isComplete(state, stateMachineInstance)) {
                evaluateState(state, stateMachineInstance, state);
            }
        }
        else {
            // otherwise look for a transition from this state
            var transitions = state.outgoing.filter(function (transition) { return transition.guard(message, stateMachineInstance); });
            if (transitions.length === 1) {
                // execute if a single transition was found
                result = traverse(transitions[0], stateMachineInstance, message);
            }
            else if (transitions.length > 1) {
                // error if multiple transitions evaluated true
                exports.errorTo.error(state + ": multiple outbound transitions evaluated true for message " + message);
            }
        }
        return result;
    }
    // traverses a transition
    function traverse(transition, instance, message) {
        var onTraverse = transition.onTraverse, target = transition.target;
        // process static conditional branches
        while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
            target = (transition = selectTransition(target, instance, message)).target;
            // concatenate behaviour before and after junctions
            Array.prototype.push.apply(onTraverse, transition.onTraverse);
        }
        // execute the transition behaviour
        onTraverse.forEach(function (action) { return action(message, instance); });
        // process dynamic conditional branches
        if (target && (target instanceof PseudoState) && (target.kind === PseudoStateKind.Choice)) {
            traverse(selectTransition(target, instance, message), instance, message);
        }
        else if (target && target instanceof State && isComplete(target, instance)) {
            // test for completion transitions
            evaluateState(target, instance, target);
        }
        return true;
    }
    // select next leg of composite transitions after choice and junction pseudo states
    function selectTransition(pseudoState, stateMachineInstance, message) {
        var results = pseudoState.outgoing.filter(function (transition) { return transition.guard(message, stateMachineInstance); });
        if (pseudoState.kind === PseudoStateKind.Choice) {
            return results.length !== 0 ? results[getRandom()(results.length)] : findElse(pseudoState);
        }
        else {
            if (results.length > 1) {
                exports.errorTo.error("Multiple outbound transition guards returned true at " + this + " for " + message);
            }
            else {
                return results[0] || findElse(pseudoState);
            }
        }
    }
    // look for else transitins from a junction or choice
    function findElse(pseudoState) {
        return pseudoState.outgoing.filter(function (transition) { return transition.guard === Transition.FalseGuard; })[0];
    }
    // Temporary structure to hold element behaviour during the bootstrap process
    var ElementBehavior = (function () {
        function ElementBehavior() {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
        }
        ElementBehavior.prototype.enter = function () {
            return this.beginEnter.concat(this.endEnter);
        };
        return ElementBehavior;
    })();
    // get all the vertex ancestors of a vertex (including the vertex itself)
    function ancestors(vertex) {
        return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
    }
    // determine the type of transition and use the appropriate initiliasition method
    var InitialiseTransitions = (function (_super) {
        __extends(InitialiseTransitions, _super);
        function InitialiseTransitions() {
            _super.apply(this, arguments);
        }
        InitialiseTransitions.prototype.visitTransition = function (transition, behaviour) {
            if (transition.kind === TransitionKind.Internal) {
                transition.onTraverse = transition.transitionBehavior;
            }
            else if (transition.kind === TransitionKind.Local) {
                this.visitLocalTransition(transition, behaviour);
            }
            else {
                this.visitExternalTransition(transition, behaviour);
            }
        };
        // initialise internal transitions: these do not leave the source state
        InitialiseTransitions.prototype.visitLocalTransition = function (transition, behaviour) {
            var _this = this;
            transition.onTraverse.push(function (message, instance) {
                var targetAncestors = ancestors(transition.target), i = 0;
                // find the first inactive element in the target ancestry
                while (isActive(targetAncestors[i], instance)) {
                    ++i;
                }
                // exit the active sibling
                behaviour(instance.getCurrent(targetAncestors[i].region)).leave.forEach(function (action) { return action(message, instance); });
                // perform the transition action;
                transition.transitionBehavior.forEach(function (action) { return action(message, instance); });
                // enter the target ancestry
                while (i < targetAncestors.length) {
                    _this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], function (actions) { actions.forEach(function (action) { return action(message, instance); }); });
                }
                // trigger cascade
                behaviour(transition.target).endEnter.forEach(function (action) { return action(message, instance); });
            });
        };
        // initialise external transitions: these are abritarily complex
        InitialiseTransitions.prototype.visitExternalTransition = function (transition, behaviour) {
            var sourceAncestors = ancestors(transition.source), targetAncestors = ancestors(transition.target), i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
            // find the index of the first uncommon ancestor (or for external transitions, the source)
            while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
                --i;
            }
            // leave source ancestry as required
            Array.prototype.push.apply(transition.onTraverse, behaviour(sourceAncestors[i]).leave);
            // perform the transition effect
            Array.prototype.push.apply(transition.onTraverse, transition.transitionBehavior);
            // enter the target ancestry
            while (i < targetAncestors.length) {
                this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], function (actions) { Array.prototype.push.apply(transition.onTraverse, actions); });
            }
            // trigger cascade
            Array.prototype.push.apply(transition.onTraverse, behaviour(transition.target).endEnter);
        };
        InitialiseTransitions.prototype.cascadeElementEntry = function (transition, behaviour, element, next, task) {
            task(behaviour(element).beginEnter);
            if (next && element instanceof State) {
                element.regions.forEach(function (region) {
                    task(behaviour(region).beginEnter);
                    if (region !== next.region) {
                        task(behaviour(region).endEnter);
                    }
                });
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
        InitialiseElements.prototype.behaviour = function (element) {
            return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
        };
        InitialiseElements.prototype.visitElement = function (element, deepHistoryAbove) {
            if (exports.logTo !== exports.defaultConsole) {
                this.behaviour(element).leave.push(function (message, instance) { return exports.logTo.log(instance + " leave " + element); });
                this.behaviour(element).beginEnter.push(function (message, instance) { return exports.logTo.log(instance + " enter " + element); });
            }
        };
        InitialiseElements.prototype.visitRegion = function (region, deepHistoryAbove) {
            var _this = this;
            var initial = region.vertices.reduce(function (result, vertex) { return vertex instanceof PseudoState && vertex.isInitial() ? vertex : result; }, undefined);
            _super.visitRegion.call(this, region, deepHistoryAbove || (initial && initial.kind === PseudoStateKind.DeepHistory));
            // leave the curent active child state when exiting the region
            this.behaviour(region).leave.push(function (message, stateMachineInstance) { return _this.behaviour(stateMachineInstance.getCurrent(region)).leave.forEach(function (action) { return action(message, stateMachineInstance); }); });
            // enter the appropriate child vertex when entering the region
            if (deepHistoryAbove || !initial || initial.isHistory()) {
                this.behaviour(region).endEnter.push(function (message, stateMachineInstance, history) {
                    _this.behaviour((history || initial.isHistory()) ? stateMachineInstance.getCurrent(region) || initial : initial).enter().forEach(function (action) { return action(message, stateMachineInstance, history || initial.kind === PseudoStateKind.DeepHistory); });
                });
            }
            else {
                Array.prototype.push.apply(this.behaviour(region).endEnter, this.behaviour(initial).enter());
            }
        };
        InitialiseElements.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
            _super.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
            // evaluate comppletion transitions once vertex entry is complete
            if (pseudoState.isInitial()) {
                this.behaviour(pseudoState).endEnter.push(function (message, stateMachineInstance) { return traverse(pseudoState.outgoing[0], stateMachineInstance); });
            }
            else if (pseudoState.kind === PseudoStateKind.Terminate) {
                // terminate the state machine instance upon transition to a terminate pseudo state
                this.behaviour(pseudoState).beginEnter.push(function (message, stateMachineInstance) { return stateMachineInstance.isTerminated = true; });
            }
        };
        InitialiseElements.prototype.visitState = function (state, deepHistoryAbove) {
            var _this = this;
            // NOTE: manually iterate over the child regions to control the sequence of behaviour
            state.regions.forEach(function (region) {
                region.accept(_this, deepHistoryAbove);
                Array.prototype.push.apply(_this.behaviour(state).leave, _this.behaviour(region).leave);
                Array.prototype.push.apply(_this.behaviour(state).endEnter, _this.behaviour(region).enter());
            });
            this.visitVertex(state, deepHistoryAbove);
            // add the user defined behaviour when entering and exiting states
            Array.prototype.push.apply(this.behaviour(state).leave, state.exitBehavior);
            Array.prototype.push.apply(this.behaviour(state).beginEnter, state.entryBehavior);
            // update the parent regions current state
            this.behaviour(state).beginEnter.push(function (message, stateMachineInstance) {
                if (state.region) {
                    stateMachineInstance.setCurrent(state.region, state);
                }
            });
        };
        InitialiseElements.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
            var _this = this;
            _super.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
            // initiaise all the transitions once all the elements have been initialised
            stateMachine.accept(new InitialiseTransitions(), function (element) { return _this.behaviour(element); });
            // define the behaviour for initialising a state machine instance
            stateMachine.onInitialise = this.behaviour(stateMachine).enter();
        };
        return InitialiseElements;
    })(Visitor);
})(StateJS || (StateJS = {}));
exports.defaultConsole = {
    log: function (message) { },
    warn: function (message) { },
    error: function (message) { throw message; }
};
/**
 * The object used to send log messages to. Point this to another object if you wish to implement custom logging.
 * @member {ILogTo}
 */
exports.logTo = exports.defaultConsole;
/**
 * The object used to send warning messages to. Point this to another object if you wish to implement custom warnings.
 * @member {IWarnTo}
 */
exports.warnTo = exports.defaultConsole;
/**
 * The object used to send error messages to. Point this to another object if you wish to implement custom warnings.
 *
 * Default behaviour for error messages is to throw an exception.
 * @member {IErrorTo}
 */
exports.errorTo = exports.defaultConsole;
