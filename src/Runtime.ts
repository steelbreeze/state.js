/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
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
			if (autoInitialiseModel && stateMachineModel.clean === false) {
				initialise(stateMachineModel);
			}
			
			invoke(stateMachineModel.onInitialise, undefined, stateMachineInstance);
		} else {
			stateMachineModel.accept(new BootstrapElements(), false);
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
		if (autoInitialiseModel && stateMachineModel.clean === false) {
			initialise(stateMachineModel);
		}

		if (stateMachineInstance.isTerminated) {
			return false;
		}

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
		if(vertex instanceof State) {
			return (<State>vertex).regions.every(region => { return stateMachineInstance.getCurrent(region).isFinal(); });			
		}

		return true;
	}

 	// Temporary structure to hold element behaviour during the bootstrap process
	class ElementBehavior {
		leave: Behavior = [];
		beginEnter: Behavior = [];
		endEnter: Behavior = [];
		enter: Behavior = [];
	}

	// invokes behaviour
	function invoke(behavior: Behavior, message: any, stateMachineInstance: IActiveStateConfiguration, history: boolean = false) : void {
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
				case PseudoStateKind.ShallowHistory: {
					if (pseudoState.transitions.length === 1) {
						transition = pseudoState.transitions[0];
					} else {
						throw "Initial transition must have a single outbound transition from " + pseudoState;
					}
					
					break;
				}
				
				case PseudoStateKind.Junction: {
					var result: Transition, elseResult: Transition;

					pseudoState.transitions.forEach (t=> {
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
				}
				
				case PseudoStateKind.Choice: {
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
			}

			if (!transition) {
				return false;
			}

			invoke(transition.traverse, message, stateMachineInstance);

			return true;
		}
		
		visitState (state: State, stateMachineInstance: IActiveStateConfiguration, message: any): boolean {
			var result = false;
			
			// delegate to child regions first
			for (var i = 0, l = state.regions.length; i < l; i++) { // NOTE: use of break means this needs to stay as a for loop
				if (state.regions[i].accept(this, stateMachineInstance, message)) {
					result = true;
					
					if (!isActive(state,stateMachineInstance)) {
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
							throw new Error ("Multiple outbound transitions evaluated true");
						}
	
						transition = t;
					}
				});

				if (transition) {
					invoke (transition.traverse, message, stateMachineInstance);
					
					result = true;
				}
			}
			
			if (result && (message !== state) && isComplete(state, stateMachineInstance)) {
				this.visitState (state, stateMachineInstance, state);
			}
			
			return result;
		}
	}

	// Bootstraps transitions after all elements have been bootstrapped
	class BootstrapTransitions extends Visitor<(element: Element) => ElementBehavior> {		
		visitTransition(transition: Transition, behaviour: (element: Element) => ElementBehavior) {
			// internal transitions: just perform the actions; no exiting or entering states
			if (!transition.target) {
				transition.traverse = transition.transitionBehavior;
				
				// local transtions (within the same parent region): simple exit, transition and entry
			} else if (transition.target.getParent() === transition.source.getParent()) {
				transition.traverse = behaviour(transition.source).leave.concat(transition.transitionBehavior).concat(behaviour(transition.target).enter);
				
				// external transitions (crossing region boundaries): exit to the LCA, transition, enter from the LCA
			} else {
				var sourceAncestors = transition.source.ancestors();
				var targetAncestors = transition.target.ancestors();
				var sourceAncestorsLength = sourceAncestors.length;
				var targetAncestorsLength = targetAncestors.length;
				var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);

				// find the index of the first uncommon ancestor
				while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
					i++;
				}

				// validate transition does not cross sibling regions boundaries
				if (sourceAncestors[i] instanceof Region) {
					throw "Transitions may not cross sibling orthogonal region boundaries";
				}
				
				// leave the first uncommon ancestor
				transition.traverse = behaviour(i < sourceAncestorsLength ? sourceAncestors[i] : transition.source).leave.slice(0);

				// perform the transition action
				transition.traverse = transition.traverse.concat(transition.transitionBehavior);

				if (i >= targetAncestorsLength) {
					transition.traverse = transition.traverse.concat(behaviour(transition.target).beginEnter);
				}
								
				// enter the target ancestry
				while (i < targetAncestorsLength) {
					var element = targetAncestors[i++];
					var next = i < targetAncestorsLength ? targetAncestors[i] : undefined;

					transition.traverse = transition.traverse.concat(behaviour(element).beginEnter);

					if (element instanceof State) {
						var state = <State>element;

						if (state.isOrthogonal()) {
							state.regions.forEach(region => { if (region !== next) { transition.traverse = transition.traverse.concat(behaviour(region).enter); } });
						}
					}
				}

				// trigger cascade
				transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class BootstrapElements extends Visitor<boolean> {		
		private behaviours: any = {};

		private behaviour(element: Element): ElementBehavior {
			if (!element.qualifiedName) {
				element.qualifiedName = element.ancestors().map<string>((e) => { return e.name; }).join(Element.namespaceSeparator);
			}
						
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new ElementBehavior());
		}

		visitElement(element: Element, deepHistoryAbove: boolean) {
			var elementBehaviour = this.behaviour(element);

//			uncomment the following two lines for debugging purposes
//			elementBehaviour.leave.push((message, instance) => { console.log(instance + " leave " + element); });
//			elementBehaviour.beginEnter.push((message, instance) => { console.log(instance + " enter " + element); });

			elementBehaviour.enter = elementBehaviour.beginEnter.concat(elementBehaviour.endEnter);
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
			var regionBehaviour = this.behaviour(region);
			
			region.vertices.forEach(vertex => { vertex.accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory)); });

			regionBehaviour.leave.push((message, stateMachineInstance, history) => {
				invoke(this.behaviour(stateMachineInstance.getCurrent(region)).leave, message, stateMachineInstance);
			});

			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
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

			this.visitElement(region, deepHistoryAbove);
		}

		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
			this.visitElement(vertex, deepHistoryAbove);

			var vertexBehaviour = this.behaviour((vertex));

			vertexBehaviour.endEnter.push((message, stateMachineInstance, history) => {
				if (isComplete(vertex, stateMachineInstance)) {
					vertex.accept(Evaluator.instance, stateMachineInstance, vertex);
				}
			});
				
			vertexBehaviour.enter = vertexBehaviour.beginEnter.concat(vertexBehaviour.endEnter);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			this.visitVertex(pseudoState, deepHistoryAbove);

			if (pseudoState.kind === PseudoStateKind.Terminate) {
				this.behaviour(pseudoState).enter.push((message, stateMachineInstance, history) => {
					stateMachineInstance.isTerminated = true;
				});
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			var stateBehaviour = this.behaviour(state);
			
			state.regions.forEach(region => {
				var regionBehaviour = this.behaviour(region);

				region.accept(this, deepHistoryAbove);

				stateBehaviour.leave.push((message, stateMachineInstance, history) => {
					invoke(regionBehaviour.leave, message, stateMachineInstance);
				});

				stateBehaviour.endEnter = stateBehaviour.endEnter.concat(regionBehaviour.enter);
			});

			this.visitVertex(state, deepHistoryAbove);

			stateBehaviour.leave = stateBehaviour.leave.concat(state.exitBehavior);
			stateBehaviour.beginEnter = stateBehaviour.beginEnter.concat(state.entryBehavior);

			stateBehaviour.beginEnter.push((message, stateMachineInstance, history) => {
				if (state.region) {
					stateMachineInstance.setCurrent(state.region, state);
				}
			});

			stateBehaviour.enter = stateBehaviour.beginEnter.concat(stateBehaviour.endEnter);
		}

		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			this.behaviours = {};
			
			this.visitState(stateMachine, deepHistoryAbove);

			stateMachine.accept(new BootstrapTransitions(), (element: Element) => { return this.behaviour(element); });

			stateMachine.onInitialise = this.behaviour(stateMachine).enter;
		}
	}
}