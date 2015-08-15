/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
	 * @function validate
	 * @param {StateMachine} stateMachineModel The state machine model to validate.
	 */
	export function validate(stateMachineModel: StateMachine): void {
		stateMachineModel.accept(new Validator());
	}

	function ancestors(vertex: Vertex): Array<Vertex> { // TODO: remove this
		return (vertex.region ? ancestors(vertex.region.state) : []).concat(vertex);
	}

	class Validator extends Visitor<string> {
		public visitPseudoState(pseudoState: PseudoState): any {
			super.visitPseudoState(pseudoState);

			if (pseudoState.kind === PseudoStateKind.Choice || pseudoState.kind === PseudoStateKind.Junction) {
				// [7] In a complete statemachine, a junction vertex must have at least one incoming and one outgoing transition.
				// [8] In a complete statemachine, a choice vertex must have at least one incoming and one outgoing transition.
				if (pseudoState.outgoing.length === 0) {
					console.error(pseudoState + ": " + pseudoState.kind + " pseudo states must have at least one outgoing transition.");
				}

				// choice and junction pseudo state can have at most one else transition
				if (pseudoState.outgoing.filter((transition: Transition) => { return transition.guard === Transition.FalseGuard; }).length > 1) {
					console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have more than one Else transitions.");
				}
			} else {
				// non choice/junction pseudo state may not have else transitions
				if (pseudoState.outgoing.filter((transition: Transition) => { return transition.guard === Transition.FalseGuard; }).length !== 0) {
					console.error(pseudoState + ": " + pseudoState.kind + " pseudo states cannot have Else transitions.");
				}

				if (pseudoState.isInitial()) {
					if (pseudoState.outgoing.length !== 1) {
						// [1] An initial vertex can have at most one outgoing transition.
						// [2] History vertices can have at most one outgoing transition.
						console.error(pseudoState + ": initial pseudo states must have one outgoing transition.");
					} else {
						// [9] The outgoing transition from an initial vertex may have a behavior, but not a trigger or guard.
						if (pseudoState.outgoing[0].guard !== Transition.TrueGuard) {
							console.error(pseudoState + ": initial pseudo states cannot have a guard condition.");
						}
					}
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
						console.error(region + ": regions may have at most one initial pseudo state.");
					}

					initial = vertex;
				}
			});
		}
		public visitState(state: State): any {
			super.visitState(state);

			if(state.regions.filter(state => state.name === Region.defaultName).length > 1){
				console.error(state + ": a state cannot have more than one region named " + Region.defaultName);
			}
		}

		public visitFinalState(finalState: FinalState): any {
			super.visitFinalState(finalState);

			// [1] A final state cannot have any outgoing transitions.
			if (finalState.outgoing.length !== 0) {
				console.error(finalState + ": final states must not have outgoing transitions.");
			}

			// [2] A final state cannot have regions.
			if (finalState.regions.length !== 0) {
				console.error(finalState + ": final states must not have child regions.");
			}

			// [4] A final state has no entry behavior.
			if (finalState.entryBehavior.length !== 0) {
				console.warn(finalState + ": final states may not have entry behavior.");
			}

			// [5] A final state has no exit behavior.
			if (finalState.exitBehavior.length !== 0) {
				console.warn(finalState + ": final states may not have exit behavior.");
			}
		}

		public visitTransition(transition: Transition): any {
			super.visitTransition(transition);

			// Local transition target vertices must be a child of the source vertex
			if (transition.kind === TransitionKind.Local) {
				if (ancestors(transition.target).indexOf(transition.source) === -1) {
					console.error(transition + ": local transition target vertices must be a child of the source composite sate.");
				}
			}
		}
	}
}