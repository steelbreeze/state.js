/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	interface BehaviourBase extends Array<Action> {
	}

	function invoke(actions: BehaviourBase, message: any, instance: IActiveStateConfiguration, history: boolean = false): void {
		actions.forEach(action => action(message, instance, history));
	}

	//	Behaviour.prototype.invoke = (message: any, instance: IActiveStateConfiguration, history: boolean = false): void {
	//		this.forEach(action => action(message, instance, history));
	//	}

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
			console.log("initialise " + stateMachineInstance);

			// enter the state machine instance for the first time
			invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);
		} else {
			// log as required
			console.log("initialise " + stateMachineModel.name);

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
		console.log(stateMachineInstance + " evaluate " + message);

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

				return isActive(state, stateMachineInstance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
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
			var transitions = state.outgoing.filter(transition => transition.guard(message, stateMachineInstance));

			if (transitions.length === 1) {
				// execute if a single transition was found
				result = traverse(transitions[0], stateMachineInstance, message);
			} else if (transitions.length > 1) {
				// error if multiple transitions evaluated true
				console.error(state + ": multiple outbound transitions evaluated true for message " + message);
			}
		}

		return result;
	}

	// traverses a transition
	function traverse(transition: Transition, instance: IActiveStateConfiguration, message?: any): boolean {
		var onTraverse = transition.onTraverse, target = transition.target;

		// process static conditional branches
		while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
			target = (transition = selectTransition(<PseudoState>target, instance, message)).target;

			// concatenate behaviour before and after junctions
			Array.prototype.push.apply(onTraverse, transition.onTraverse);
		}

		// execute the transition behaviour
		invoke(onTraverse, message, instance);

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
		var results = pseudoState.outgoing.filter(transition => transition.guard(message, stateMachineInstance));

		if (pseudoState.kind === PseudoStateKind.Choice) {
			return results.length !== 0 ? results[getRandom()(results.length)] : findElse(pseudoState);
		} else {
			if (results.length > 1) {
				console.error("Multiple outbound transition guards returned true at " + this + " for " + message);
			} else {
				return results[0] || findElse(pseudoState);
			}
		}
	}

	// look for else transitins from a junction or choice
	function findElse(pseudoState: PseudoState): Transition {
		return pseudoState.outgoing.filter(transition => transition.guard === Transition.FalseGuard)[0];
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
	class InitialiseTransitions extends Visitor<(element: Element) => ElementBehavior> {
		visitTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			if (transition.kind === TransitionKind.Internal) {
				transition.onTraverse = transition.transitionBehavior;
			} else if (transition.kind === TransitionKind.Local) {
				this.visitLocalTransition(transition, behaviour);
			} else {
				this.visitExternalTransition(transition, behaviour);
			}
		}

		// initialise internal transitions: these do not leave the source state
		visitLocalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			transition.onTraverse.push((message, instance) => {
				var targetAncestors = ancestors(transition.target),
					i = 0;

				// find the first inactive element in the target ancestry
				while (isActive(targetAncestors[i], instance)) { ++i; }

				// exit the active sibling
				invoke(behaviour(instance.getCurrent(targetAncestors[i].region)).leave, message, instance);

				// perform the transition action;
				invoke(transition.transitionBehavior, message, instance);

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { invoke(actions, message, instance); });
				}

				// trigger cascade
				invoke(behaviour(transition.target).endEnter, message, instance);
			});
		}

		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			var sourceAncestors = ancestors(transition.source),
				targetAncestors = ancestors(transition.target),
				i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;

			// find the index of the first uncommon ancestor (or for external transitions, the source)
			while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) { --i; }

			// leave source ancestry as required
			Array.prototype.push.apply(transition.onTraverse, behaviour(sourceAncestors[i]).leave);

			// perform the transition effect
			Array.prototype.push.apply(transition.onTraverse, transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], actions => { Array.prototype.push.apply(transition.onTraverse, actions) });
			}

			// trigger cascade
			Array.prototype.push.apply(transition.onTraverse, behaviour(transition.target).endEnter);
		}

		cascadeElementEntry(transition: Transition, behaviour: (element: Element) => ElementBehavior, element: Vertex, next: Vertex, task: (actions: Array<Action>) => void) {
			task(behaviour(element).beginEnter);

			if (next && element instanceof State) {
				element.regions.forEach(region => {
					task(behaviour(region).beginEnter);

					if (region !== next.region) {
						task(behaviour(region).endEnter);
					}
				});
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviours: ElementBehaviors = {};

		private behaviour(element: Element): ElementBehavior {
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}

		private addLogging(element: Element, logTo: IConsole) {
			if (logTo !== defaultConsole) {
				this.behaviour(element).leave.push((message, instance) => logTo.log(instance + " leave " + element));
				this.behaviour(element).beginEnter.push((message, instance) => logTo.log(instance + " enter " + element));
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionInitial = region.vertices.reduce<PseudoState>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() ? vertex : result, undefined);

			super.visitRegion(region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory));

			// leave the curent active child state when exiting the region
			this.behaviour(region).leave.push((message, stateMachineInstance) => invoke(this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance));

			// enter the appropriate child vertex when entering the region
			if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) { // NOTE: history needs to be determined at runtime
				this.behaviour(region).endEnter.push((message, stateMachineInstance, history) => {
					invoke(this.behaviour((history || regionInitial.isHistory()) ? stateMachineInstance.getCurrent(region) || regionInitial : regionInitial).enter(), message, stateMachineInstance, history || regionInitial.kind === PseudoStateKind.DeepHistory);
				});
			} else {
				Array.prototype.push.apply(this.behaviour(region).endEnter, this.behaviour(regionInitial).enter());
			}

			this.addLogging(region, console);
		}

		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
			this.addLogging(vertex, console);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			super.visitPseudoState(pseudoState, deepHistoryAbove);

			// evaluate comppletion transitions once vertex entry is complete
			if (pseudoState.isInitial()) {
				this.behaviour(pseudoState).endEnter.push((message, stateMachineInstance) => traverse(pseudoState.outgoing[0], stateMachineInstance));
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				// terminate the state machine instance upon transition to a terminate pseudo state
				this.behaviour(pseudoState).beginEnter.push((message, stateMachineInstance) => stateMachineInstance.isTerminated = true);
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			// NOTE: manually iterate over the child regions to control the sequence of behaviour
			state.regions.forEach(region => {
				region.accept(this, deepHistoryAbove);

				Array.prototype.push.apply(this.behaviour(state).leave, this.behaviour(region).leave);
				Array.prototype.push.apply(this.behaviour(state).endEnter, this.behaviour(region).enter());
			});

			this.visitVertex(state, deepHistoryAbove);

			// add the user defined behaviour when entering and exiting states
			Array.prototype.push.apply(this.behaviour(state).leave, state.exitBehavior);
			Array.prototype.push.apply(this.behaviour(state).beginEnter, state.entryBehavior);

			// update the parent regions current state
			this.behaviour(state).beginEnter.push((message, stateMachineInstance) => {
				if (state.region) {
					stateMachineInstance.setCurrent(state.region, state);
				}
			});
		}

		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			super.visitStateMachine(stateMachine, deepHistoryAbove);

			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), (element: Element) => this.behaviour(element));

			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter();
		}
	}

	var defaultConsole = {
		log(message?: any, ...optionalParams: any[]): void { },
		warn(message?: any, ...optionalParams: any[]): void { },
		error(message?: any, ...optionalParams: any[]): void { throw message; }
	}

	/**
	 * The object used for log, warning and error messages
	 * @member {IConsole}
	 */
	export var console: IConsole = defaultConsole;
}