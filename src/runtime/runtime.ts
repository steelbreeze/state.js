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
		if (stateMachineInstance) {
			// initialise the state machine model if necessary
			if (autoInitialiseModel && stateMachineModel.clean === false) {
				initialise(stateMachineModel);
			}

			// log as required
			stateMachineModel.logTo.log("initialise " + stateMachineInstance);

			// enter the state machine instance for the first time
			stateMachineModel.onInitialise.forEach(action => action(undefined, stateMachineInstance));
		} else {
			// log as required
			stateMachineModel.logTo.log("initialise " + stateMachineModel.name);

			// initialise the state machine model
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
		stateMachineModel.logTo.log(stateMachineInstance + " evaluate " + message);

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
					return false; // NOTE: this just controls the every loop
				}
			}

			return true; // NOTE: this just controls the every loop
		});

		// if a transition occured in a child region, check for completions
		if (result) {
			if ((message !== state) && isComplete(state, stateMachineInstance)) {
				evaluateState(state, stateMachineInstance, state);
			}
		} else {
			// otherwise look for a transition from this state
			var transition: Transition;

			state.transitions.forEach(t => {
				if (t.guard(message, stateMachineInstance)) {
					if (transition) {
						state.getRoot().errorTo.error("Multiple outbound transitions evaluated true");
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

	// traverses a transition
	function traverse(transition: Transition, instance: IActiveStateConfiguration, message?: any): boolean {
		var transitionBehavior = transition.traverse,
			target = transition.target;

		// process static conditional branches
		while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
			transition = selectTransition(<PseudoState>target, instance, message); // TODO: remove this cast
			target = transition.target;

			Array.prototype.push.apply(transitionBehavior, transition.traverse);
		}

		// execute the transition behaviour
		transitionBehavior.forEach(action => action(message, instance));

		// process dynamic conditional branches
		if (target && (target instanceof PseudoState) && (target.kind === PseudoStateKind.Choice)) {
			traverse(selectTransition(target, instance, message), instance, message);
		} else if (target && target instanceof State && isComplete(target, instance)) {
			// test for completion transitions
			evaluateState(target, instance, target);
		}

		return true;
	}

	// select next leg of composite transitions after choice and junction pseudo states
	function selectTransition(pseudoState: PseudoState, stateMachineInstance: IActiveStateConfiguration, message: any): Transition {
		var results: Array<Transition> = [], elseResult: Transition;

		pseudoState.transitions.forEach(transition => {
			if (transition.guard === Transition.isElse) {
				if (elseResult) {
					pseudoState.getRoot().errorTo.error("Multiple outbound else transitions found at " + this + " for " + message);
				}

				elseResult = transition;
			} else if (transition.guard(message, stateMachineInstance)) {
				results.push(transition);
			}
		});

		if (pseudoState.kind === PseudoStateKind.Choice) {
			return results.length !== 0 ? results[getRandom()(results.length)] : elseResult;
		} else if (pseudoState.kind === PseudoStateKind.Junction) {
			if (results.length > 1) {
				pseudoState.getRoot().errorTo.error("Multiple outbound transition guards returned true at " + this + " for " + message);
			}

			return results[0] || elseResult;
		}
	}

	// Temporary structure to hold element behaviour during the bootstrap process
	class ElementBehavior {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}

	// type to manage an array of element behaviours
	interface ElementBehaviors {
		[index: string]: ElementBehavior;
	}

	// determine the type of transition and use the appropriate initiliasition method
	class InitialiseTransitions extends Visitor<ElementBehaviors> {
		visitTransition(transition: Transition, behaviour: ElementBehaviors) {
			switch (transition.kind) {
				case TransitionKind.Internal:
					transition.traverse = transition.transitionBehavior;
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
		visitLocalTransition(transition: Transition, behaviour: ElementBehaviors) {
			transition.traverse.push((message, instance) => {
				var targetAncestors = getAncestors(transition.target);
				var i = 0;

				// find the first inactive element in the target ancestry
				while (isActive(targetAncestors[i], instance)) {
					i++;
				}

				// exit the active sibling
				behaviour[instance.getCurrent((<Vertex>targetAncestors[i]).region).qualifiedName].leave.forEach(action => action(message, instance)); // TODO: cast

				// perform the transition action;
				transition.transitionBehavior.forEach(action => action(message, instance));

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], i < targetAncestors.length ? targetAncestors[i] : undefined, actions => { actions.forEach(action => action(message, instance)); });
				}

				// trigger cascade
				behaviour[transition.target.qualifiedName].endEnter.forEach(action => action(message, instance));
			});
		}

		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behaviour: ElementBehaviors) {
			var sourceAncestors = getAncestors(transition.source);
			var targetAncestors = getAncestors(transition.target);
			var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;

			// find the index of the first uncommon ancestor (or for external transitions, the source)
			while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
				i--;
			}

			// leave source ancestry as required and perform the transition effect
			Array.prototype.push.apply(transition.traverse, behaviour[sourceAncestors[i].qualifiedName].leave);
			Array.prototype.push.apply(transition.traverse, transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { Array.prototype.push.apply(transition.traverse, actions) });
			}

			// trigger cascade
			Array.prototype.push.apply(transition.traverse, behaviour[transition.target.qualifiedName].endEnter);
		}

		cascadeElementEntry(transition: Transition, behaviour: ElementBehaviors, element: Element, next: Element, task: (actions: Array<Action>) => void) {
			task(behaviour[element.qualifiedName].beginEnter);

			if (next && element instanceof State && element.isOrthogonal()) {
				element.regions.forEach(region => {
					if (region !== next) {
						task(behaviour[region.qualifiedName].enter);
					}
				});
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviours: ElementBehaviors = {};

		// returns the behavior for a given element; creates one if not present
		private behaviour(element: Element): ElementBehavior {
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}

		// uncomment this method for debugging purposes
		visitElement(element: Element, deepHistoryAbove: boolean) {
			if (element.getRoot().logTo !== defaultConsole) {
				var elementBehaviour = this.behaviour(element);

				elementBehaviour.leave.push((message, instance) => element.getRoot().logTo.log(instance + " leave " + element));
				elementBehaviour.beginEnter.push((message, instance) => element.getRoot().logTo.log(instance + " enter " + element));
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionBehaviour = this.behaviour(region);

			// chain initiaisation of child vertices
			region.vertices.forEach(vertex => vertex.accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory)));

			// leave the curent active child state when exiting the region
			regionBehaviour.leave.push((message, stateMachineInstance) => this.behaviour(stateMachineInstance.getCurrent(region)).leave.forEach(action=> action(message, stateMachineInstance)));

			// enter the appropriate initial child vertex when entering the region
			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) { // NOTE: history needs to be determined at runtime
				regionBehaviour.endEnter.push((message, stateMachineInstance, history) => {
					this.behaviour((history || region.initial.isHistory()) ? stateMachineInstance.getCurrent(region) || region.initial : region.initial).enter.forEach(action=> action(message, stateMachineInstance, history || region.initial.kind === PseudoStateKind.DeepHistory));
				});
			} else {
				Array.prototype.push.apply(regionBehaviour.endEnter, this.behaviour(region.initial).enter);
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
				this.behaviour(pseudoState).endEnter.push((message, stateMachineInstance) => traverse(pseudoState.transitions[0], stateMachineInstance));
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				// terminate the state machine instance upon transition to a terminate pseudo state
				pseudoStateBehaviour.beginEnter.push((message, stateMachineInstance) => stateMachineInstance.isTerminated = true);
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
				Array.prototype.push.apply(stateBehaviour.leave, regionBehaviour.leave);

				// enter child regions when entering the state
				Array.prototype.push.apply(stateBehaviour.endEnter, regionBehaviour.enter);
			});

			// add vertex behaviour (debug and testing completion transitions)
			this.visitVertex(state, deepHistoryAbove);

			// add the user defined behaviour when entering and exiting states
			Array.prototype.push.apply(stateBehaviour.leave, state.exitBehavior);
			Array.prototype.push.apply(stateBehaviour.beginEnter, state.entryBehavior);

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
			stateMachine.accept(new InitialiseTransitions(), this.behaviours);

			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter;
		}
	}

	function getAncestors(element: Element): Array<Element> {
		return (element.parent ? getAncestors(element.parent) : []).concat(element);
	}
}