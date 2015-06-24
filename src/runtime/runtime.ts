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
				stateMachineModel.logTo.log(stateMachineModel, "initialise " + stateMachineInstance);
			}
			
			// enter the state machine instance for the first time
			stateMachineModel.onInitialise.forEach(action => { action(undefined, stateMachineInstance); });
	
			// initiaise a state machine model
		} else {
			// log as required
			if (stateMachineModel.logTo) {
				stateMachineModel.logTo.log(stateMachineModel, "initialise " + stateMachineModel.name);
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
			stateMachineModel.logTo.log(stateMachineModel, stateMachineInstance + " evaluate " + message);
		}
		
		// initialise the state machine model if necessary
		if (autoInitialiseModel && stateMachineModel.clean === false) {
			initialise(stateMachineModel);
		}
	
		// terminated state machine instances will not evaluate messages
		if (stateMachineInstance.isTerminated) {
			return false;
		}
	
		// evaluate the message using the Evaluator visitor
		return stateMachineModel.accept(Evaluator.instance, stateMachineInstance, message);
	}

	// Temporary structure to hold element behaviour during the bootstrap process
	class ElementBehavior {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}
	
	// determines if a state is currently active
	function isActive(state: State, stateMachineInstance: IActiveStateConfiguration): boolean {
		return state.region ? (isActive(state.region.state, stateMachineInstance) && (stateMachineInstance.getCurrent(state.region) === state)) : true;
	}
	
	// traverses a transition
	function traverse(transition: Transition, instance: IActiveStateConfiguration, message: any): boolean {
		// TODO: need to implement run-to-completion from here to end of the method
		var transitionBehavior = transition.traverse;

		while (transition.target && transition.target.isJunction()) {
			transition = selectJunctionTransition(transition.target, instance, message);

			if (!transition) {
				return false;
			}

			transitionBehavior = transitionBehavior.concat(transition.traverse);
		}

		transitionBehavior.forEach(action => { action(message, instance); });

		if (transition.target && transition.target.isChoice()) {
			transition = selectChoiceTransition(transition.target, instance, message);

			if (!transition) {
				return false;
			}

			traverse(transition, instance, message);
		}

		return true;
	}

	function selectJunctionTransition(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration, message: any): Transition {
		var result: Transition, elseResult: Transition;

		vertex.transitions.forEach(t=> {
			if (t.guard === Transition.isElse) {
				if (elseResult) {
					if (vertex.getRoot().errorTo) {
						vertex.getRoot().errorTo.error(vertex.getRoot(), "Multiple outbound transitions evaluated true");
					}
				}

				elseResult = t;
			} else if (t.guard(message, stateMachineInstance)) {
				if (result) {
					if (vertex.getRoot().errorTo) {
						vertex.getRoot().errorTo.error(vertex.getRoot(), "Multiple outbound transitions evaluated true");
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
						vertex.getRoot().errorTo.error(vertex.getRoot(), "Multiple outbound else transitions found at " + this + " for " + message);
					}
				}

				elseResult = t;
			} else if (t.guard(message, stateMachineInstance)) {
				results.push(t);
			}
		});

		return results.length !== 0 ? results[getRandom()(results.length)] : elseResult;
	}

	// evaluates messages against a state machine, executing transitions as appropriate
	class Evaluator extends Visitor<IActiveStateConfiguration> {
		static instance = new Evaluator();

		visitRegion(region: Region, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			return stateMachineInstance.getCurrent(region).accept(this, stateMachineInstance, message);
		}

		visitPseudoState(pseudoState: PseudoState, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			if (pseudoState.isInitial()) {
				if (pseudoState.transitions.length === 1) {
					return traverse(pseudoState.transitions[0], stateMachineInstance, message);
				} else {
					if (pseudoState.getRoot().errorTo) {
						pseudoState.getRoot().errorTo.error(pseudoState.getRoot(), "Initial transition must have a single outbound transition from " + pseudoState);
					}
				}
			}

			return false;
		}

		visitState(state: State, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			var result = false;
			
			// delegate to child regions first
			for (var i = 0, l = state.regions.length; i < l; i++) { // NOTE: use of break means this needs to stay as a for loop
				if (state.regions[i].accept(this, stateMachineInstance, message)) {
					result = true;

					if (!isActive(state, stateMachineInstance)) {
						break;
					}
				}
			}
			
			//if still unprocessed, try to find one here
			if (!result) {
				var transition: Transition;

				state.transitions.forEach(t => {
					if (t.guard(message, stateMachineInstance)) {
						if (transition) {
							if (state.getRoot().errorTo) {
								state.getRoot().errorTo.error(state.getRoot(), "Multiple outbound transitions evaluated true");
							}
						}
						
						transition = t;
					}
				});

				if (transition) {
					result = traverse(transition, stateMachineInstance, message);
				}
			}
	
			// if a transition occured, check for completions
			if (result && (message !== state) && isComplete(state, stateMachineInstance)) {
				this.visitState(state, stateMachineInstance, state);
			}

			return result;
		}
	}

	// initialises transitions after all elements have been bootstrapped
	class InitialiseTransitions extends Visitor<(element: Element) => ElementBehavior> {
		
		// determine the type of transition and use the appropriate initiliasition method
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
			
			// leave the first uncommon ancestor
			transition.traverse = behaviour(i < sourceAncestors.length ? sourceAncestors[i] : transition.source).leave.slice(0);
	
			// perform the transition action
			transition.traverse = transition.traverse.concat(transition.transitionBehavior);

			if (i >= targetAncestors.length) {
				transition.traverse = transition.traverse.concat(behaviour(transition.target).beginEnter);
			}
							
			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.cascadeElementEntry(transition, behaviour, targetAncestors[i++], i < targetAncestors.length ? targetAncestors[i] : undefined);
			}
	
			// trigger cascade
			transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
		}

		cascadeElementEntry(transition: Transition, behaviour: (element: Element) => ElementBehavior, element: Element, next: Element): void {
			transition.traverse = transition.traverse.concat(behaviour(element).beginEnter);

			if (element instanceof State) {
				this.cascadeOrthogonalRegionEntry(transition, behaviour, <State>element, next);
			}
		}

		cascadeOrthogonalRegionEntry(transition: Transition, behaviour: (element: Element) => ElementBehavior, state: State, next: Element): void {
			if (state.isOrthogonal()) {
				state.regions.forEach(region => { if (region !== next) { transition.traverse = transition.traverse.concat(behaviour(region).enter); } });
			}
		}
	}
	
	// bootstraps all the elements within a state machine model
	class InitialiseElements extends Visitor<boolean> {
		private behaviours: any = {};
	
		// returns the behavior for a given element; creates one if not present
		private behaviour(element: Element): ElementBehavior {
			if (!element.qualifiedName) {
				element.qualifiedName = element.getAncestors().map<string>((e) => { return e.name; }).join(Element.namespaceSeparator);
			}

			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}
	
		// uncomment this method for debugging purposes
		visitElement(element: Element, deepHistoryAbove: boolean) {
			var logger = element.getRoot().logTo;

			if (logger) {
				var elementBehaviour = this.behaviour(element);

				elementBehaviour.leave.push((message, instance) => { logger.log(instance + " leave " + element); });
				elementBehaviour.beginEnter.push((message, instance) => { logger.log(instance + " enter " + element); });
			}
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionBehaviour = this.behaviour(region);
	
			// chain initiaisation of child vertices
			region.vertices.forEach(vertex => { vertex.accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory)); });
	
			// leave the curent active child state when exiting the region
			regionBehaviour.leave.push((message, stateMachineInstance) => {
				this.behaviour(stateMachineInstance.getCurrent(region)).leave.forEach(action => { action(message, stateMachineInstance); });
			});
	
			// enter the appropriate initial child vertex when entering the region
			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) { // NOTE: history needs to be determined at runtime
				regionBehaviour.endEnter.push((message, stateMachineInstance, history) => {
					var initial: Vertex = region.initial;

					if (history || region.initial.isHistory()) {
						initial = stateMachineInstance.getCurrent(region) || region.initial;
					}

					var cascadedHistory = history || region.initial.kind === PseudoStateKind.DeepHistory;
					this.behaviour(initial).enter.forEach(action => { action(message, stateMachineInstance, cascadedHistory); });
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
					if (isComplete(pseudoState, stateMachineInstance)) {
						pseudoState.accept(Evaluator.instance, stateMachineInstance, pseudoState);
					}
				});
			}

			// terminate the state machine instance upon transition to a terminate pseudo state
			if (pseudoState.kind === PseudoStateKind.Terminate) {
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
	
			// evaluate comppletion transitions once vertex entry is complete
			this.behaviour(state).endEnter.push((message, stateMachineInstance) => {
				if (isComplete(state, stateMachineInstance)) {
					state.accept(Evaluator.instance, stateMachineInstance, state);
				}
			});
	
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
			this.visitState(stateMachine, deepHistoryAbove);
	
			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), (element: Element) => { return this.behaviour(element); });
	
			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter;
		}
	}
}