/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
	export function initialise(stateMachine: StateMachine, instance?: IActiveStateConfiguration, autoBootstrap: boolean = true) {
		if (instance) {
			if (autoBootstrap && stateMachine.clean === false) {
				initialise(stateMachine);
			}

			instance.evaluator = new Evaluator();
			
			invoke(stateMachine.onInitialise, undefined, instance);
		} else {
			stateMachine.accept(new BootstrapElements(), false);
			stateMachine.clean = true;
		}
	}

	export function evaluate(stateMachine: StateMachine, instance: IActiveStateConfiguration, message: any, autoBootstrap: boolean = true): boolean {
		if (autoBootstrap && stateMachine.clean === false) {
			initialise(stateMachine);
		}

		if (instance.isTerminated) {
			return false;
		}

		return stateMachine.accept(instance.evaluator, instance, message);
	}

	export function isComplete(vertex: Vertex, instance: IActiveStateConfiguration): boolean {
		if(vertex instanceof State) {
			return (<State>vertex).regions.every(region => { return instance.getCurrent(region).isFinal(); });			
		}

		return true;
	}

 	// Temporary structure to hold element behaviour during the bootstrap process
	class Behaviour {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}

	// invokes behaviour
	function invoke(actions: Array<Action>, message: any, instance: IActiveStateConfiguration, history: boolean = false) : void {
		actions.forEach(action => { action(message, instance, history) });
	}
	
	// determines if a state is currently active
	function isActive(state: State, instance: IActiveStateConfiguration): boolean {
		return state.region ? (isActive(state.region.state, instance) && (instance.getCurrent(state.region) === state)) : true;
	}
	
	// evaluates messages against a state machine, executing transitions as appropriate
	class Evaluator extends Visitor<IActiveStateConfiguration> {
		visitRegion(region: Region, instance: IActiveStateConfiguration, message: any): boolean {
			return instance.getCurrent(region).accept(this, instance, message);
		}

		visitPseudoState(pseudoState: PseudoState, instance: IActiveStateConfiguration, message: any): boolean {			
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
						} else if (t.guard(message, instance)) {
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
						} else if (t.guard(message, instance)) {
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

			invoke(transition.traverse, message, instance);

			return true;
		}
		
		visitState (state: State, instance: IActiveStateConfiguration, message: any): boolean {
			var result = false;
			
			// delegate to child regions first
			for (var i = 0, l = state.regions.length; i < l; i++) { // NOTE: use of break means this needs to stay as a for loop
				if (state.regions[i].accept(this, instance, message)) {
					result = true;
					
					if (!isActive(state,instance)) {
						break;
					}
				}
			}
			
			//if still unprocessed, try to find one here
			if (!result) {
				var transition: Transition;				

				state.transitions.forEach(t => {
					if (t.guard(message, instance)) {
						if (transition) {
							throw new Error ("Multiple outbound transitions evaluated true");
						}
	
						transition = t;
					}
				});

				if (transition) {
					invoke (transition.traverse, message, instance);
					
					result = true;
				}
			}
			
			if (result && (message !== state) && isComplete(state, instance)) {
				this.visitState (state, instance, state);
			}
			
			return result;
		}
	}

	// Bootstraps transitions after all elements have been bootstrapped
	class BootstrapTransitions extends Visitor<(element: Element) => Behaviour> {		
		visitTransition(transition: Transition, behaviour: (element: Element) => Behaviour) {
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

		private behaviour(element: Element): Behaviour {
			if (!element.qualifiedName) {
				element.qualifiedName = element.ancestors().map<string>((e) => { return e.name; }).join(Element.namespaceSeparator);
			}
						
			return this.behaviours[element.qualifiedName] || (this.behaviours[element.qualifiedName] = new Behaviour());
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

			regionBehaviour.leave.push((message, instance, history) => {
				invoke(this.behaviour(instance.getCurrent(region)).leave, message, instance);
			});

			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
				regionBehaviour.endEnter.push((message, instance, history) => {
					var initial: Vertex = region.initial;
					
					if (history || region.initial.isHistory()) {
						initial = instance.getCurrent(region) || region.initial;
					}
					
					invoke(this.behaviour(initial).enter, message, instance, history || region.initial.kind === PseudoStateKind.DeepHistory);
				});
			} else {
				regionBehaviour.endEnter = regionBehaviour.endEnter.concat(this.behaviour(region.initial).enter);
			}

			this.visitElement(region, deepHistoryAbove);
		}

		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
			this.visitElement(vertex, deepHistoryAbove);

			var vertexBehaviour = this.behaviour((vertex));

			vertexBehaviour.endEnter.push((message, instance, history) => {
				if (isComplete(vertex, instance)) {
					vertex.accept(instance.evaluator, instance, vertex);
				}
			});
				
			vertexBehaviour.enter = vertexBehaviour.beginEnter.concat(vertexBehaviour.endEnter);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
			this.visitVertex(pseudoState, deepHistoryAbove);

			if (pseudoState.kind === PseudoStateKind.Terminate) {
				this.behaviour(pseudoState).enter.push((message, instance, history) => {
					instance.isTerminated = true;
				});
			}
		}

		visitState(state: State, deepHistoryAbove: boolean) {
			var stateBehaviour = this.behaviour(state);
			
			state.regions.forEach(region => {
				var regionBehaviour = this.behaviour(region);

				region.accept(this, deepHistoryAbove);

				stateBehaviour.leave.push((message, instance, history) => {
					invoke(regionBehaviour.leave, message, instance);
				});

				stateBehaviour.endEnter = stateBehaviour.endEnter.concat(regionBehaviour.enter);
			});

			this.visitVertex(state, deepHistoryAbove);

			stateBehaviour.leave = stateBehaviour.leave.concat(state.exitBehavior);
			stateBehaviour.beginEnter = stateBehaviour.beginEnter.concat(state.entryBehavior);

			stateBehaviour.beginEnter.push((message, instance, history) => {
				if (state.region) {
					instance.setCurrent(state.region, state);
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