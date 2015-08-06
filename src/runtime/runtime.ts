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

	/***
	 * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
	 * @function validate
	 * @param {StateMachine} stateMachineModel The state machine model to validate.
	 */
	export function validate(stateMachineModel: StateMachine): void {
		stateMachineModel.accept(new Validator());
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

			state.outgoing.forEach(t => {
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
		var onTraverse = transition.onTraverse,
			target = transition.target;

		// process static conditional branches
		while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
			if (target instanceof PseudoState) { // coerce the TS compiler into casting target for the selectTransition call
				transition = selectTransition(target, instance, message);
			}

			target = transition.target;

			Array.prototype.push.apply(onTraverse, transition.onTraverse);
		}

		// execute the transition behaviour
		onTraverse.forEach(action => action(message, instance));

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

		pseudoState.outgoing.forEach(transition => {
			if (transition.guard === Transition.FalseGuard) {
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

		enter(): Array<Action> {
			return this.beginEnter.concat(this.endEnter);
		}
	}

	// type to manage an array of element behaviours
	interface ElementBehaviors {
		[index: string]: ElementBehavior;
	}

	// get all the vertex ancestors of a vertex (including the vertex itself)
	function ancestors(vertex: Vertex): Array<Vertex> {
		return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
	}

	// determine the type of transition and use the appropriate initiliasition method
	class InitialiseTransitions extends Visitor<ElementBehaviors> {
		visitTransition(transition: Transition, behaviour: ElementBehaviors) {
			if (transition.kind === TransitionKind.Internal) {
				transition.onTraverse = transition.transitionBehavior;
			} else if (transition.kind === TransitionKind.Local) {
				this.visitLocalTransition(transition, behaviour);
			} else {
				this.visitExternalTransition(transition, behaviour);
			}
		}

		// initialise internal transitions: these do not leave the source state
		visitLocalTransition(transition: Transition, behaviour: ElementBehaviors) {
			transition.onTraverse.push((message, instance) => {
				var targetAncestors = ancestors(transition.target);
				var i = 0;

				// find the first inactive element in the target ancestry
				while (isActive(targetAncestors[i], instance)) { ++i; }

				// exit the active sibling
				behaviour[instance.getCurrent(targetAncestors[i].region).qualifiedName].leave.forEach(action => action(message, instance));

				// perform the transition action;
				transition.transitionBehavior.forEach(action => action(message, instance));

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { actions.forEach(action => action(message, instance)); });
				}

				// trigger cascade
				behaviour[transition.target.qualifiedName].endEnter.forEach(action => action(message, instance));
			});
		}

		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behaviour: ElementBehaviors) {
			var sourceAncestors = ancestors(transition.source);
			var targetAncestors = ancestors(transition.target);
			var i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;

			// find the index of the first uncommon ancestor (or for external transitions, the source)
			while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) { --i; }

			// leave source ancestry as required
			Array.prototype.push.apply(transition.onTraverse, behaviour[sourceAncestors[i].qualifiedName].leave);

			// perform the transition effect
			Array.prototype.push.apply(transition.onTraverse, transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { Array.prototype.push.apply(transition.onTraverse, actions) });
			}

			// trigger cascade
			Array.prototype.push.apply(transition.onTraverse, behaviour[transition.target.qualifiedName].endEnter);
		}

		cascadeElementEntry(transition: Transition, behaviour: ElementBehaviors, element: Vertex, next: Vertex, task: (actions: Array<Action>) => void) {
			task(behaviour[element.qualifiedName].beginEnter);

			if (next && element instanceof State) {
				element.regions.forEach(region => {
					task(behaviour[region.qualifiedName].beginEnter);

					if (region !== next.region) {
						task(behaviour[region.qualifiedName].endEnter);
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

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionBehaviour = this.behaviour(region);
			var regionInitial = region.getInitial();

			super.visitRegion(region, regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory);

			// leave the curent active child state when exiting the region
			regionBehaviour.leave.push((message, stateMachineInstance) => this.behaviour(stateMachineInstance.getCurrent(region)).leave.forEach(action=> action(message, stateMachineInstance)));

			// enter the appropriate child vertex when entering the region
			if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) { // NOTE: history needs to be determined at runtime
				regionBehaviour.endEnter.push((message, stateMachineInstance, history) => {
					this.behaviour((history || regionInitial.isHistory()) ? stateMachineInstance.getCurrent(region) || regionInitial : regionInitial).enter().forEach(action=> action(message, stateMachineInstance, history || regionInitial.kind === PseudoStateKind.DeepHistory));
				});
			} else {
				Array.prototype.push.apply(regionBehaviour.endEnter, this.behaviour(regionInitial).enter());
			}

			// add element behaviour
			if (region.getRoot().logTo !== defaultConsole) {
				regionBehaviour.leave.push((message, instance) => region.getRoot().logTo.log(instance + " leave " + region));
				regionBehaviour.beginEnter.push((message, instance) => region.getRoot().logTo.log(instance + " enter " + region));
			}
		}

		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
			if (vertex.getRoot().logTo !== defaultConsole) {
				var vertexBehaviour = this.behaviour(vertex);

				vertexBehaviour.leave.push((message, instance) => vertex.getRoot().logTo.log(instance + " leave " + vertex));
				vertexBehaviour.beginEnter.push((message, instance) => vertex.getRoot().logTo.log(instance + " enter " + vertex));
			}
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			super.visitPseudoState(pseudoState, deepHistoryAbove);

			var pseudoStateBehaviour = this.behaviour(pseudoState);

			// evaluate comppletion transitions once vertex entry is complete
			if (pseudoState.isInitial()) {
				pseudoStateBehaviour.endEnter.push((message, stateMachineInstance) => traverse(pseudoState.outgoing[0], stateMachineInstance));
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				// terminate the state machine instance upon transition to a terminate pseudo state
				pseudoStateBehaviour.beginEnter.push((message, stateMachineInstance) => stateMachineInstance.isTerminated = true);
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			super.visitState(state, deepHistoryAbove);

			var stateBehaviour = this.behaviour(state);

			state.regions.forEach(region => {
				var regionBehaviour = this.behaviour(region);

				// leave child regions when leaving the state
				Array.prototype.push.apply(stateBehaviour.leave, regionBehaviour.leave);

				// enter child regions when entering the state
				Array.prototype.push.apply(stateBehaviour.endEnter, regionBehaviour.enter());
			});

			// add the user defined behaviour when entering and exiting states
			Array.prototype.push.apply(stateBehaviour.leave, state.exitBehavior);
			Array.prototype.push.apply(stateBehaviour.beginEnter, state.entryBehavior);

			// update the parent regions current state
			stateBehaviour.beginEnter.push((message, stateMachineInstance) => {
				if (state.region) {
					stateMachineInstance.setCurrent(state.region, state);
				}
			});
		}

		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			super.visitStateMachine(stateMachine, deepHistoryAbove);

			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), this.behaviours);

			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter();
		}
	}

	class Validator extends Visitor<string> {
		public visitPseudoState(pseudoState: PseudoState): any {
			super.visitPseudoState(pseudoState);

			if (pseudoState.isInitial()) {
				if (pseudoState.outgoing.length !== 1) {
					// [1] An initial vertex can have at most one outgoing transition.
					// [2] History vertices can have at most one outgoing transition.
					pseudoState.getRoot().errorTo.error(pseudoState + ": initial pseudo states must have one outgoing transition.");
				} else {
					// [9] The outgoing transition from an initial vertex may have a behavior, but not a trigger or guard.
					if (pseudoState.outgoing[0].guard !== Transition.TrueGuard) {
						pseudoState.getRoot().errorTo.error(pseudoState + ": initial pseudo states cannot have a guard condition.");
					}
				}
			} else if (pseudoState.kind === PseudoStateKind.Choice || pseudoState.kind === PseudoStateKind.Junction) {
				// [7] In a complete statemachine, a junction vertex must have at least one incoming and one outgoing transition.
				// [8] In a complete statemachine, a choice vertex must have at least one incoming and one outgoing transition.
				if (pseudoState.outgoing.length === 0) {
					pseudoState.getRoot().errorTo.error(pseudoState + ": " + pseudoState.kind + " pseudo states must have at least one outgoing transition.");
				}
			}
		}

		public visitRegion(region: Region): any {
			super.visitRegion(region);

			// [1] A region can have at most one initial vertex.
			// [2] A region can have at most one deep history vertex.
			// [3] A region can have at most one shallow history vertex.
			var initial: PseudoState;

			region.vertices.forEach(vertex => {
				if (vertex instanceof PseudoState && vertex.isInitial()) {
					if (initial) {
						region.getRoot().errorTo.error(region + ": regions may have at most one initial pseudo state.");
					}

					initial = vertex;
				}
			});
		}

		public visitFinalState(finalState: FinalState): any {
			super.visitFinalState(finalState);

			// [1] A final state cannot have any outgoing transitions.
			if (finalState.outgoing.length !== 0) {
				finalState.getRoot().errorTo.error(finalState + ": final states must not have outgoing transitions.");
			}

			// [2] A final state cannot have regions.
			if (finalState.regions.length !== 0) {
				finalState.getRoot().errorTo.error(finalState + ": final states must not have child regions.");
			}

			// [4] A final state has no entry behavior.
			if (finalState.entryBehavior.length !== 0) {
				finalState.getRoot().warnTo.warn(finalState + ": final states may not have entry behavior.");
			}

			// [5] A final state has no exit behavior.
			if (finalState.exitBehavior.length !== 0) {
				finalState.getRoot().warnTo.warn(finalState + ": final states may not have exit behavior.");
			}
		}

		public visitTransition(transition: Transition): any {
			super.visitTransition(transition);

			// Local transition target vertices must be a child of the source vertex
			if (transition.kind === TransitionKind.Local) {
				if (ancestors(transition.target).indexOf(transition.source) === -1) {
					transition.source.getRoot().errorTo.error(transition + ": local transition target vertices must be a child of the source composite sate.");
				}
			}
		}
	}
}