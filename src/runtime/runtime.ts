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
			console.log("initialise " + stateMachineInstance);

			// enter the state machine instance for the first time
			stateMachineModel.onInitialise.invoke(undefined, stateMachineInstance);
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
		var onTraverse = new Behavior(transition.onTraverse), target = transition.target;

		// process static conditional branches
		while (target && target instanceof PseudoState && target.kind === PseudoStateKind.Junction) {
			target = (transition = selectTransition(<PseudoState>target, instance, message)).target;

			// concatenate behaviour before and after junctions
			onTraverse.push(transition.onTraverse);
		}

		// execute the transition behaviour
		onTraverse.invoke(message, instance);

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

	// interfaces to manage element behavior
	interface ElementBehavior { [index: number]: Behavior; }
	interface ElementBehaviors { [index: string]: ElementBehavior; }

	// functions to retreive specif element behavior
	function leave(elementBehavior: ElementBehavior): Behavior { return elementBehavior[0] || (elementBehavior[0] = new Behavior()); }
	function beginEnter(elementBehavior: ElementBehavior): Behavior { return elementBehavior[1] || (elementBehavior[1] = new Behavior()); }
	function endEnter(elementBehavior: ElementBehavior): Behavior { return elementBehavior[2] || (elementBehavior[2] = new Behavior()); }
	function enter(elementBehavior: ElementBehavior): Behavior { return new Behavior(beginEnter(elementBehavior)).push(endEnter(elementBehavior)); }

	// get all the vertex ancestors of a vertex (including the vertex itself)
	function ancestors(vertex: Vertex): Array<Vertex> {
		return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
	}

	// determine the type of transition and use the appropriate initiliasition method
	class InitialiseTransitions extends Visitor<(element: Element) => ElementBehavior> {
		visitTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			if (transition.kind === TransitionKind.Internal) {
				transition.onTraverse.push(transition.transitionBehavior);
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
				leave(behaviour(instance.getCurrent(targetAncestors[i].region))).invoke(message, instance);

				// perform the transition action;
				transition.transitionBehavior.invoke(message, instance);

				// enter the target ancestry
				while (i < targetAncestors.length) {
					this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], behavior => { behavior.invoke(message, instance); });
				}

				// trigger cascade
				endEnter(behaviour(transition.target)).invoke(message, instance);
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
			transition.onTraverse.push(leave(behaviour(sourceAncestors[i])));

			// perform the transition effect
			transition.onTraverse.push(transition.transitionBehavior);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], targetAncestors[i], behavior => transition.onTraverse.push(behavior));
			}

			// trigger cascade
			transition.onTraverse.push(endEnter(behaviour(transition.target)));
		}

		cascadeElementEntry(transition: Transition, behaviour: (element: Element) => ElementBehavior, element: Vertex, next: Vertex, task: (behavior: Behavior) => void) {
			task(beginEnter(behaviour(element)));

			if (next && element instanceof State) {
				element.regions.forEach(region => {
					task(beginEnter(behaviour(region)));

					if (region !== next.region) {
						task(endEnter(behaviour(region)));
					}
				});
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviours: ElementBehaviors = {};

		private behaviour(element: Element): ElementBehavior {
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = []);
		}

		visitElement(element: Element, deepHistoryAbove: boolean) {
			if (console !== defaultConsole) {
				leave(this.behaviour(element)).push((message, instance) => console.log(instance + " leave " + element));
				beginEnter(this.behaviour(element)).push((message, instance) => console.log(instance + " enter " + element));
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionInitial = region.vertices.reduce<PseudoState>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() ? vertex : result, undefined);

			region.vertices.forEach(vertex => { vertex.accept(this, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)) });


			// leave the curent active child state when exiting the region
			leave(this.behaviour(region)).push((message, stateMachineInstance) => leave(this.behaviour(stateMachineInstance.getCurrent(region))).invoke(message, stateMachineInstance));

			// enter the appropriate child vertex when entering the region
			if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) { // NOTE: history needs to be determined at runtime
				endEnter(this.behaviour(region)).push((message, stateMachineInstance, history) => {
					enter(this.behaviour((history || regionInitial.isHistory()) ? stateMachineInstance.getCurrent(region) || regionInitial : regionInitial)).invoke(message, stateMachineInstance, history || regionInitial.kind === PseudoStateKind.DeepHistory);
				});
			} else {
				endEnter(this.behaviour(region)).push(enter(this.behaviour(regionInitial)));
			}

			this.visitElement(region, deepHistoryAbove);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			super.visitPseudoState(pseudoState, deepHistoryAbove);

			// evaluate comppletion transitions once vertex entry is complete
			if (pseudoState.isInitial()) {
				endEnter(this.behaviour(pseudoState)).push((message, stateMachineInstance) => traverse(pseudoState.outgoing[0], stateMachineInstance));
			} else if (pseudoState.kind === PseudoStateKind.Terminate) {
				// terminate the state machine instance upon transition to a terminate pseudo state
				beginEnter(this.behaviour(pseudoState)).push((message, stateMachineInstance) => stateMachineInstance.isTerminated = true);
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			// NOTE: manually iterate over the child regions to control the sequence of behaviour
			state.regions.forEach(region => {
				region.accept(this, deepHistoryAbove);

				leave(this.behaviour(state)).push(leave(this.behaviour(region)));
				endEnter(this.behaviour(state)).push(enter(this.behaviour(region)));
			});

			this.visitVertex(state, deepHistoryAbove);

			// add the user defined behaviour when entering and exiting states
			leave(this.behaviour(state)).push(state.exitBehavior);
			beginEnter(this.behaviour(state)).push(state.entryBehavior);

			// update the parent regions current state
			beginEnter(this.behaviour(state)).push((message, stateMachineInstance) => {
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
			stateMachine.onInitialise = enter(this.behaviour(stateMachine));
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