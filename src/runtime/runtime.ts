/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Initialises a state machine and/or state machine model.
	 *
	 * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
	 * @function initialise
	 * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
	 * @param {IActiveStateConfiguration} stateMachineInstance The optional state machine instance to initialise.
	 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
	 */
	export function initialise(stateMachineModel: StateMachine, stateMachineInstance?: IActiveStateConfiguration, autoInitialiseModel: boolean = true): void {
		// initialise a state machine instance
		if (stateMachineInstance) {
			// initialise the state machine model if necessary
			if (autoInitialiseModel && stateMachineModel.clean === false) {
				initialise(stateMachineModel);
			}

			// log as required
			if (stateMachineModel.logTo) {
				stateMachineModel.logTo.log("initialise " + stateMachineInstance);
			}

			// enter the state machine instance for the first time
			invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);

			// initiaise a state machine model
		} else {
			// log as required
			if (stateMachineModel.logTo) {
				stateMachineModel.logTo.log("initialise " + stateMachineModel.name);
			}

			stateMachineModel.accept(new InitialiseElements(), false);
			stateMachineModel.clean = true;
		}
	}

	/**
	 * Passes a message to a state machine for evaluation; messages trigger state transitions.
	 * @function evaluate
	 * @param {StateMachine} stateMachineModel The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
	 * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to evaluate the message against.
	 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
	 * @returns {boolean} True if the message triggered a state transition.
	 */
	export function evaluate(stateMachineModel: StateMachine, stateMachineInstance: IActiveStateConfiguration, message: any, autoInitialiseModel: boolean = true): boolean {
		// log as required
		if (stateMachineModel.logTo) {
			stateMachineModel.logTo.log(stateMachineInstance + " evaluate " + message);
		}

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

	// evaluates messages against a state, executing transitions as appropriate
	function evaluateState(state: State, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
		var result = false;

		// delegate to child regions first
		state.regions.every(region => {
			if (evaluateState(stateMachineInstance.getCurrent(region), stateMachineInstance, message)) {
				result = true;

				if (!isActive(state, stateMachineInstance)) {
					return false;
				}
			}

			return true;
		});

		// if a transition occured in a child region, check for completions
		if (result) {
			if ((message !== state) && isComplete(state, stateMachineInstance)) {
				evaluateState(state, stateMachineInstance, state);
			}

			// otherwise look for a transition from this state
		} else {
			var transition: Transition;

			state.transitions.forEach(t => {
				if (t.guard(message, stateMachineInstance)) {
					if (transition) {
						if (state.getRoot().errorTo) {
							state.getRoot().errorTo.error("Multiple outbound transitions evaluated true");
						}
					}

					transition = t;
				}
			});

			if (transition) {
				result = traverse(transition, stateMachineInstance, message);
			}
		}

		return result;
	}

	function invoke(actions: Array<Action>, message: any, instance?: IActiveStateConfiguration, history?: boolean) {
		actions.forEach(action => {
			action(message, instance, history);
		});
	}

	// traverses a transition
	function traverse(transition: Transition, instance: IActiveStateConfiguration, message?: any): boolean {
		var transitionBehavior = transition.traverse;

		// process static conditional branches
		while (transition.target && transition.target.isJunction()) {
			transitionBehavior = transitionBehavior.concat((transition = selectJunctionTransition(transition.target, instance, message)).traverse);
		}

		// execute the transition behaviour
		invoke(transitionBehavior, message, instance);

		// process dynamic conditional branches
		if (transition.target && transition.target.isChoice()) {
			traverse(transition = selectChoiceTransition(transition.target, instance, message), instance, message);
		}

		// test for completion transitions for
		if (transition.target && transition.target instanceof State) {
			var state = <State>transition.target;

			if (isComplete(state, instance)) {
				evaluateState(state, instance, state);
			}
		}

		return true;
	}

	function selectJunctionTransition(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration, message: any): Transition {
		var result: Transition, elseResult: Transition;

		vertex.transitions.forEach(t=> {
			if (t.guard === Transition.isElse) {
				if (elseResult) {
					if (vertex.getRoot().errorTo) {
						vertex.getRoot().errorTo.error("Multiple outbound transitions evaluated true");
					}
				}

				elseResult = t;
			} else if (t.guard(message, stateMachineInstance)) {
				if (result) {
					if (vertex.getRoot().errorTo) {
						vertex.getRoot().errorTo.error("Multiple outbound transitions evaluated true");
					}
				}

				result = t;
			}
		});

		return result || elseResult;
	}

	function selectChoiceTransition(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration, message: any): Transition {
		var results: Array<Transition> = [];
		var elseResult: Transition;

		vertex.transitions.forEach(t => {
			if (t.guard === Transition.isElse) {
				if (elseResult) {
					if (vertex.getRoot().errorTo) {
						vertex.getRoot().errorTo.error("Multiple outbound else transitions found at " + this + " for " + message);
					}
				}

				elseResult = t;
			} else if (t.guard(message, stateMachineInstance)) {
				results.push(t);
			}
		});

		return results.length !== 0 ? results[getRandom()(results.length)] : elseResult;
	}

	// Temporary structure to hold element behaviour during the bootstrap process
	class ElementBehavior {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}

	// determine the type of transition and use the appropriate initiliasition method
	class InitialiseTransitions extends Visitor<(element: Element) => ElementBehavior> {
		visitTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			switch (transition.kind) {
				case TransitionKind.Internal:
					this.visitInternalTransition(transition);
					break;

				case TransitionKind.Local:
					this.visitLocalTransition(transition, behaviour);
					break;

				case TransitionKind.External:
					this.visitExternalTransition(transition, behaviour);
					break;
			}
		}

		// initialise internal transitions: these do not leave the source state
		visitInternalTransition(transition: Transition) {
			transition.traverse = transition.transitionBehavior;
		}

		// initialise internal transitions: these do not leave the source state
		visitLocalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			transition.traverse.push((message, instance) => {
				var targetAncestors = transition.target.getAncestors();
				var i = 0;

				// find the first inactive element in the target ancestry
				while (isActive(targetAncestors[i], instance)) {
					i++;
				}

				// exit the active sibling
				invoke(behaviour(instance.getCurrent(targetAncestors[i].getParent())).leave, message, instance);

				// perform the transition action;
				invoke(transition.transitionBehavior, message, instance);

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], i < targetAncestors.length ? targetAncestors[i] : undefined, actions => { invoke(actions, message, instance); });
				}

				// trigger cascade
				invoke(behaviour(transition.target).endEnter, message, instance);
			});
		}

		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			var sourceAncestors = transition.source.getAncestors();
			var targetAncestors = transition.target.getAncestors();
			var i = 0, l = Math.min(sourceAncestors.length, targetAncestors.length);

			// find the index of the first uncommon ancestor
			while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
				i++;
			}

			// we went beyond the source or target, step back up one level
			if (i === l) {
				i--;
			}

			// leave source ancestry as required and perform the transition effect
			transition.traverse = behaviour(sourceAncestors[i]).leave.concat(transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { transition.traverse = transition.traverse.concat(actions); });
			}

			// trigger cascade
			transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
		}

		cascadeElementEntry(transition: Transition, behaviour: (element: Element) => ElementBehavior, element: Element, next: Element, task: (actions: Array<Action>) => any) {
			task(behaviour(element).beginEnter);

			if (next && element instanceof State && element.isOrthogonal()) {
				element.regions.forEach(region => {
					if (region !== next) {
						task(behaviour(region).enter);
					}
				});
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviours: any = {};

		// returns the behavior for a given element; creates one if not present
		private behaviour(element: Element): ElementBehavior {
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}

		// uncomment this method for debugging purposes
		visitElement(element: Element, deepHistoryAbove: boolean) {
			var logger = element.getRoot().logTo;

			if (logger) {
				var elementBehaviour = this.behaviour(element);

				elementBehaviour.leave.push((message, instance) => {
					logger.log(instance + " leave " + element);
				});

				elementBehaviour.beginEnter.push((message, instance) => {
					logger.log(instance + " enter " + element);
				});
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionBehaviour = this.behaviour(region);

			// chain initiaisation of child vertices
			region.vertices.forEach(vertex => {
				vertex.accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory));
			});

			// leave the curent active child state when exiting the region
			regionBehaviour.leave.push((message, stateMachineInstance) => {
				invoke(this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance);
			});

			// enter the appropriate initial child vertex when entering the region
			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) { // NOTE: history needs to be determined at runtime
				regionBehaviour.endEnter.push((message, stateMachineInstance, history) => { // TODO: can we remove any of these tests?
					invoke(this.behaviour((history || region.initial.isHistory()) ? stateMachineInstance.getCurrent(region) || region.initial : region.initial).enter, message, stateMachineInstance, history || region.initial.kind === PseudoStateKind.DeepHistory);
				});
			} else {
				regionBehaviour.endEnter = regionBehaviour.endEnter.concat(this.behaviour(region.initial).enter);
			}

			// add element behaviour (debug)
			this.visitElement(region, deepHistoryAbove);

			// merge begin and end enter behaviour
			regionBehaviour.enter = regionBehaviour.beginEnter.concat(regionBehaviour.endEnter);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			var pseudoStateBehaviour = this.behaviour(pseudoState);

			// add vertex behaviour (debug and testing completion transitions)
			this.visitVertex(pseudoState, deepHistoryAbove);

			// evaluate comppletion transitions once vertex entry is complete
			if (pseudoState.isInitial()) {
				this.behaviour(pseudoState).endEnter.push((message, stateMachineInstance) => {
					traverse(pseudoState.transitions[0], stateMachineInstance);
				});

				// terminate the state machine instance upon transition to a terminate pseudo state
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				pseudoStateBehaviour.beginEnter.push((message, stateMachineInstance) => {
					stateMachineInstance.isTerminated = true;
				});
			}

			// merge begin and end enter behaviour
			pseudoStateBehaviour.enter = pseudoStateBehaviour.beginEnter.concat(pseudoStateBehaviour.endEnter);
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			var stateBehaviour = this.behaviour(state);

			state.regions.forEach(region => {
				var regionBehaviour = this.behaviour(region);

				// chain initiaisation of child regions
				region.accept(this, deepHistoryAbove);

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
			stateBehaviour.beginEnter.push((message, stateMachineInstance) => {
				if (state.region) {
					stateMachineInstance.setCurrent(state.region, state);
				}
			});

			// merge begin and end enter behaviour
			stateBehaviour.enter = stateBehaviour.beginEnter.concat(stateBehaviour.endEnter);
		}

		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			// perform all the state initialisation
			this.visitState(stateMachine, deepHistoryAbove);

			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), (element: Element) => { return this.behaviour(element); });

			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter;
		}
	}
}