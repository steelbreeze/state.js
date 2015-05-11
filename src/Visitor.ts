/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
	/**
	 * Implementation of a visitor pattern.
	 * @class Visitor
	 */
	export class Visitor<TArg> {
		/**
		 * Visits an element within a state machine model.
		 * @method visitElement
		 * @param {Element} element the element being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitElement(element: Element, arg?: TArg): any {
			return;
		}

		/**
		 * Visits a region within a state machine model.
		 * @method visitRegion
		 * @param {Region} region The region being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitRegion(region: Region, arg?: TArg): any {
			var result = this.visitElement(region, arg);

			for (var i = 0, l = region.vertices.length; i < l; i++) {
				region.vertices[i].accept(this, arg);
			}

			return result;
		}

		/**
		 * Visits a vertex within a state machine model.
		 * @method visitVertex
		 * @param {Vertex} vertex The vertex being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitVertex(vertex: Vertex, arg?: TArg): any {
			var result = this.visitElement(vertex, arg);

			for (var i = 0, l = vertex.transitions.length; i < l; i++) {
				vertex.transitions[i].accept(this, arg);
			}

			return result;
		}

		/**
		 * Visits a pseudo state within a state machine model.
		 * @method visitPseudoState
		 * @param {PseudoState} pseudoState The pseudo state being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitPseudoState(pseudoState: PseudoState, arg?: TArg): any {
			return this.visitVertex(pseudoState, arg);
		}

		/**
		 * Visits a state within a state machine model.
		 * @method visitState
		 * @param {State} state The state being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitState(state: State, arg?: TArg): any {
			var result = this.visitVertex(state, arg);

			for (var i = 0, l = state.regions.length; i < l; i++) {
				state.regions[i].accept(this, arg);
			}
			
			return result;
		}

		/**
		 * Visits a final state within a state machine model.
		 * @method visitFinal
		 * @param {FinalState} finalState The final state being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitFinalState(finalState: FinalState, arg?: TArg): any {
			return this.visitState(finalState, arg);
		}

		/**
		 * Visits a state machine within a state machine model.
		 * @method visitVertex
		 * @param {StateMachine} state machine The state machine being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitStateMachine(stateMachine: StateMachine, arg?: TArg): any {
			return this.visitState(stateMachine, arg);
		}

		/**
		 * Visits a transition within a state machine model.
		 * @method visitTransition
		 * @param {Transition} transition The transition being visited.
		 * @param {any} arg The parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitTransition(transition: Transition, arg?: TArg): any {
			return;
		}
	}
}