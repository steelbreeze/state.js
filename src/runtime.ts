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
			if (stateMachineModel.logger) {
				stateMachineModel.logger.log("initialise " + stateMachineInstance);
			}
	
			// enter the state machine instance for the first time
			invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);
	
			// initiaise a state machine model
		} else {
			// log as required
			if (stateMachineModel.logger) {
				stateMachineModel.logger.log("initialise " + stateMachineModel.name);
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
		if (stateMachineModel.logger) {
			stateMachineModel.logger.log(stateMachineInstance + " evaluate " + message);
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
	
	/**
	 * Tests a state machine instance to see if its lifecycle is complete. A state machine instance is complete if all regions belonging to the state machine root have curent states that are final states.
	 * @function isComplete
	 * @param {StateMachine} stateMachineModel The state machine model. 
	 * @param {IActiveStateConfiguration} stateMachineInstance The instance of the state machine model to test for completeness.
	 * @returns {boolean} True if the state machine instance is complete.
	 */
	export function isComplete(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration): boolean {
		if (vertex instanceof State) {
			return (<State>vertex).regions.every(region => { return stateMachineInstance.getCurrent(region).isFinal(); });
		}
	
		return true;
	}
	
	// Temporary structure to hold element behaviour during the bootstrap process
	class ElementBehavior {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}
	
	// invokes behaviour
	function invoke(behavior: Array<Action>, message: any, stateMachineInstance: IActiveStateConfiguration, history: boolean = false): void {
		behavior.forEach(action => { action(message, stateMachineInstance, history) });
	}
	
	// determines if a state is currently active
	function isActive(state: State, stateMachineInstance: IActiveStateConfiguration): boolean {
		return state.region ? (isActive(state.region.state, stateMachineInstance) && (stateMachineInstance.getCurrent(state.region) === state)) : true;
	}
	
	// evaluates messages against a state machine, executing transitions as appropriate
	class Evaluator extends Visitor<IActiveStateConfiguration> {
		static instance = new Evaluator();
	
		visitRegion(region: Region, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			return stateMachineInstance.getCurrent(region).accept(this, stateMachineInstance, message);
		}
	
		visitPseudoState(pseudoState: PseudoState, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			var transition: Transition;
	
			switch (pseudoState.kind) {
				case PseudoStateKind.Initial:
				case PseudoStateKind.DeepHistory:
				case PseudoStateKind.ShallowHistory:
					if (pseudoState.transitions.length === 1) {
						transition = pseudoState.transitions[0];
					} else {
						throw "Initial transition must have a single outbound transition from " + pseudoState;
					}
	
					break;
	
				case PseudoStateKind.Junction:
					var result: Transition, elseResult: Transition;
	
					pseudoState.transitions.forEach(t=> {
						if (t.guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound transitions evaluated true";
							}
	
							elseResult = t;
						} else if (t.guard(message, stateMachineInstance)) {
							if (result) {
								throw "Multiple outbound transitions evaluated true";
							}
	
							result = t;
						}
					});
	
					transition = result || elseResult;
	
					break;
	
				case PseudoStateKind.Choice:
					var results: Array<Transition> = [];
	
					pseudoState.transitions.forEach(t => {
						if (t.guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound else transitions found at " + this + " for " + message;
							}
	
							elseResult = t;
						} else if (t.guard(message, stateMachineInstance)) {
							results.push(t);
						}
					});
	
					transition = results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;
	
					break;
			}
	
			if (!transition) {
				return false;
			}
	
			invoke(transition.traverse, message, stateMachineInstance);
	
			return true;
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
							throw new Error("Multiple outbound transitions evaluated true");
						}
	
						transition = t;
					}
				});
	
				if (transition) {
					invoke(transition.traverse, message, stateMachineInstance);
	
					result = true;
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
			if (!transition.target) {
				this.visitInternalTransition(transition);
			} else if (transition.target.region === transition.source.region) {
				this.visitLocalTransition(transition, behaviour);
			} else {
				this.visitExternalTransition(transition, behaviour);
			}
		}
	
		// initialise internal transitions: these do not leave the source state
		visitInternalTransition(transition: Transition) {
			transition.traverse = transition.transitionBehavior;
		}
	
		// initialise local transitions: these do not leave the source/target parent region
		visitLocalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			transition.traverse = behaviour(transition.source).leave.concat(transition.transitionBehavior).concat(behaviour(transition.target).enter);
		}
	
		// initialise external transitions: these are abritarily complex
		visitExternalTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			var sourceAncestors = transition.source.ancestors();
			var targetAncestors = transition.target.ancestors();
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
				element.qualifiedName = element.ancestors().map<string>((e) => { return e.name; }).join(Element.namespaceSeparator);
			}
	
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}
	
		// uncomment this method for debugging purposes
		visitElement(element: Element, deepHistoryAbove: boolean) {
			if (element.getRoot().logger) {
				var elementBehaviour = this.behaviour(element);
				var logger = element.getRoot().logger;
	
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
				invoke(this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance); // NOTE: current state needs to be evaluated at runtime
			});
	
			// enter the appropriate initial child vertex when entering the region
			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) { // NOTE: history needs to be determined at runtime
				regionBehaviour.endEnter.push((message, stateMachineInstance, history) => {
					var initial: Vertex = region.initial;
	
					if (history || region.initial.isHistory()) {
						initial = stateMachineInstance.getCurrent(region) || region.initial;
					}
	
					invoke(this.behaviour(initial).enter, message, stateMachineInstance, history || region.initial.kind === PseudoStateKind.DeepHistory);
				});
			} else {
				regionBehaviour.endEnter = regionBehaviour.endEnter.concat(this.behaviour(region.initial).enter);
			}
	
			// add element behaviour (debug)
			this.visitElement(region, deepHistoryAbove);
			
			// merge begin and end enter behaviour
			regionBehaviour.enter = regionBehaviour.beginEnter.concat(regionBehaviour.endEnter);
		}
	
		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
			// add element behaviour (debug)
			this.visitElement(vertex, deepHistoryAbove);
	
			// evaluate comppletion transitions once vertex entry is complete
			this.behaviour(vertex).endEnter.push((message, stateMachineInstance) => {
				if (isComplete(vertex, stateMachineInstance)) {
					vertex.accept(Evaluator.instance, stateMachineInstance, vertex);
				}
			});
		}
	
		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			var pseudoStateBehaviour = this.behaviour(pseudoState);
			
			// add vertex behaviour (debug and testing completion transitions)
			this.visitVertex(pseudoState, deepHistoryAbove);
	
			// terminate the state machine instance upon transition to a terminate pseudo state
			if (pseudoState.kind === PseudoStateKind.Terminate) {
				pseudoStateBehaviour.enter.push((message, stateMachineInstance) => {
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
			this.visitState(stateMachine, deepHistoryAbove);
	
			// initiaise all the transitions once all the elements have been initialised
			stateMachine.accept(new InitialiseTransitions(), (element: Element) => { return this.behaviour(element); });
	
			// define the behaviour for initialising a state machine instance
			stateMachine.onInitialise = this.behaviour(stateMachine).enter;
		}
	}
}