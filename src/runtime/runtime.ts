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
	 * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
	 * @param {IInstance} instance The optional state machine instance to initialise.
	 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
	 */
	export function initialise(model: StateMachine, instance?: IInstance, autoInitialiseModel: boolean = true): void {
		if (instance) {
			// initialise the state machine model if necessary
			if (autoInitialiseModel && model.clean === false) {
				initialise(model);
			}

			// log as required
			console.log("initialise " + instance);

			// enter the state machine instance for the first time
			model.onInitialise.invoke(undefined, instance);
		} else {
			// log as required
			console.log("initialise " + model.name);

			// initialise the state machine model
			model.accept(new InitialiseElements(), false);
			model.clean = true;
		}
	}

	/**
	 * Passes a message to a state machine for evaluation; messages trigger state transitions.
	 * @function evaluate
	 * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
	 * @param {IInstance} instance The instance of the state machine model to evaluate the message against.
	 * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
	 * @returns {boolean} True if the message triggered a state transition.
	 */
	export function evaluate(model: StateMachine, instance: IInstance, message: any, autoInitialiseModel: boolean = true): boolean {
		// log as required
		console.log(instance + " evaluate " + message);

		// initialise the state machine model if necessary
		if (autoInitialiseModel && model.clean === false) {
			initialise(model);
		}

		// terminated state machine instances will not evaluate messages
		if (instance.isTerminated) {
			return false;
		}

		return evaluateState(model, instance, message);
	}

	// evaluates messages against a state, executing transitions as appropriate
	function evaluateState(state: State, instance: IInstance, message: any): boolean {
		var result = false;

		// delegate to child regions first
		state.regions.every(region => {
			if (evaluateState(instance.getCurrent(region), instance, message)) {
				result = true;

				return isActive(state, instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
			}

			return true; // NOTE: this just controls the every loop
		});

		// if a transition occured in a child region, check for completions
		if (result) {
			if ((message !== state) && isComplete(state, instance)) {
				evaluateState(state, instance, state);
			}
		} else {
			// otherwise look for a transition from this state
			var transitions = state.outgoing.filter(transition => transition.guard(message, instance));

			if (transitions.length === 1) {
				// execute if a single transition was found
				result = traverse(transitions[0], instance, message);
			} else if (transitions.length > 1) {
				// error if multiple transitions evaluated true
				console.error(state + ": multiple outbound transitions evaluated true for message " + message);
			}
		}

		return result;
	}

	// traverses a transition
	function traverse(transition: Transition, instance: IInstance, message?: any): boolean {
		var onTraverse = new Behavior(transition.onTraverse)//, target = transition.target;

		// process static conditional branches
		while (transition.target && transition.target instanceof PseudoState) {
			var pseudoState = transition.target as PseudoState;

			if (pseudoState.kind !== PseudoStateKind.Junction) {
				break;
			}

			transition = selectTransition(pseudoState, instance, message);

			// concatenate behavior before and after junctions
			onTraverse.push(transition.onTraverse);
		}

		// execute the transition behavior
		onTraverse.invoke(message, instance);

		// process dynamic conditional branches
		if (transition.target != null) {
			if (transition.target instanceof PseudoState) {
				var pseudoState = transition.target as PseudoState;

				if (pseudoState.kind == PseudoStateKind.Choice) {
					traverse(selectTransition(pseudoState, instance, message), instance, message);
				}
			} else if (transition.target instanceof State) {
				var state = transition.target as State;

				// test for completion transitions
				if (isComplete(state, instance)) {
					evaluateState(state, instance, state);
				}
			}
		}

		return true;
	}

	// select next leg of composite transitions after choice and junction pseudo states
	function selectTransition(pseudoState: PseudoState, instance: IInstance, message: any): Transition {
		var results = pseudoState.outgoing.filter(transition => transition.guard(message, instance));

		if (pseudoState.kind === PseudoStateKind.Choice) {
			return results.length !== 0 ? results[getRandom()(results.length)] : findElse(pseudoState);
		} else {
			if (results.length > 1) {
				console.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
			} else {
				return results[0] || findElse(pseudoState);
			}
		}
	}

	// look for else transitins from a junction or choice
	function findElse(pseudoState: PseudoState): Transition {
		return pseudoState.outgoing.filter(transition => transition.guard === Transition.FalseGuard)[0];
	}

	// interfaces to manage element behavior
	class ElementBehavior {
		leave: Behavior = new Behavior();
		beginEnter: Behavior = new Behavior();
		endEnter: Behavior = new Behavior();

		enter(): Behavior {
			return new Behavior(this.beginEnter).push(this.endEnter);
		}
	}

	interface ElementBehaviors { [index: string]: ElementBehavior; }

	// determine the type of transition and use the appropriate initiliasition method
	class InitialiseTransitions extends Visitor<(element: Element) => ElementBehavior> {
		visitTransition(transition: Transition, behavior: (element: Element) => ElementBehavior) {
			if (transition.kind === TransitionKind.Internal) {
				transition.onTraverse.push(transition.transitionBehavior);
			} else if (transition.kind === TransitionKind.Local) {
				this.visitLocalTransition(transition, behavior);
			} else {
				this.visitExternalTransition(transition, behavior);
			}
		}

		// initialise internal transitions: these do not leave the source state
		visitLocalTransition(transition: Transition, behavior: (element: Element) => ElementBehavior) {
			transition.onTraverse.push((message, instance) => {
				var targetAncestors = transition.target.ancestry(),
					i = 0;

				// find the first inactive element in the target ancestry
				while (isActive(targetAncestors[i], instance)) { ++i; }

				// exit the active sibling
				behavior(instance.getCurrent(targetAncestors[i].region)).leave.invoke(message, instance);

				// perform the transition action;
				transition.transitionBehavior.invoke(message, instance);

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], behavior => behavior.invoke(message, instance));
				}

				// trigger cascade
				behavior(transition.target).endEnter.invoke(message, instance);
			});
		}

		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behavior: (element: Element) => ElementBehavior) {
			var sourceAncestors = transition.source.ancestry(),
				targetAncestors = transition.target.ancestry(),
				i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;

			// find the index of the first uncommon ancestor (or for external transitions, the source)
			while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) { --i; }

			// leave source ancestry as required
			transition.onTraverse.push(behavior(sourceAncestors[i]).leave);

			// perform the transition effect
			transition.onTraverse.push(transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], behavior => transition.onTraverse.push(behavior));
			}

			// trigger cascade
			transition.onTraverse.push(behavior(transition.target).endEnter);
		}

		cascadeElementEntry(transition: Transition, behavior: (element: Element) => ElementBehavior, element: Vertex, next: Vertex, task: (behavior: Behavior) => void) {
			task(behavior(element).beginEnter);

			if (next && element instanceof State) {
				var state = element as State;

				state.regions.forEach(region => {
					task(behavior(region).beginEnter);

					if (region !== next.region) {
						task(behavior(region).endEnter);
					}
				});
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviors: ElementBehaviors = {};

		private behavior(element: Element): ElementBehavior {
			return this.behaviors[element.qualifiedName] || (this.behaviors[element.qualifiedName] = new ElementBehavior());
		}

		visitElement(element: Element, deepHistoryAbove: boolean) {
			if (console !== defaultConsole) {
				this.behavior(element).leave.push((message, instance) => console.log(instance + " leave " + element));
				this.behavior(element).beginEnter.push((message, instance) => console.log(instance + " enter " + element));
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionInitial = region.vertices.reduce<PseudoState>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() ? vertex : result, undefined);

			region.vertices.forEach(vertex => vertex.accept(this, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)));


			// leave the curent active child state when exiting the region
			this.behavior(region).leave.push((message, instance) => this.behavior(instance.getCurrent(region)).leave.invoke(message, instance));

			// enter the appropriate child vertex when entering the region
			if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) { // NOTE: history needs to be determined at runtime
				this.behavior(region).endEnter.push((message, instance, history) => (this.behavior((history || regionInitial.isHistory()) ? instance.getCurrent(region) || regionInitial : regionInitial)).enter().invoke(message, instance, history || regionInitial.kind === PseudoStateKind.DeepHistory));
			} else {
				this.behavior(region).endEnter.push(this.behavior(regionInitial).enter());
			}

			this.visitElement(region, deepHistoryAbove);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			super.visitPseudoState(pseudoState, deepHistoryAbove);

			// evaluate comppletion transitions once vertex entry is complete
			if (pseudoState.isInitial()) {
				this.behavior(pseudoState).endEnter.push((message, instance) => traverse(pseudoState.outgoing[0], instance));
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				// terminate the state machine instance upon transition to a terminate pseudo state
				this.behavior(pseudoState).beginEnter.push((message, instance) => instance.isTerminated = true);
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			// NOTE: manually iterate over the child regions to control the sequence of behavior
			state.regions.forEach(region => {
				region.accept(this, deepHistoryAbove);

				this.behavior(state).leave.push(this.behavior(region).leave);
				this.behavior(state).endEnter.push(this.behavior(region).enter());
			});

			this.visitVertex(state, deepHistoryAbove);

			// add the user defined behavior when entering and exiting states
			this.behavior(state).leave.push((message, instance) => state.exitBehavior.invoke(undefined, instance,undefined,state));
			this.behavior(state).beginEnter.push((message, instance) => state.entryBehavior.invoke(undefined, instance,undefined,state));

			// update the parent regions current state
			this.behavior(state).beginEnter.push((message, instance) => {
				if (state.region) {
					instance.setCurrent(state.region, state);
				}
			});
		}

		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			super.visitStateMachine(stateMachine, deepHistoryAbove);

			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), (element: Element) => this.behavior(element));

			// define the behavior for initialising a state machine instance
			stateMachine.onInitialise = this.behavior(stateMachine).enter();
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