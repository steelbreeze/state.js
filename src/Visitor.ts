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
	export class Visitor<TArg1> {
		/**
		 * Visits an element within a state machine model.
		 * @method visitElement
		 * @param {Element} element the element being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitElement(element: Element, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			return;
		}

		/**
		 * Visits a region within a state machine model.
		 * @method visitRegion
		 * @param {Region} region The region being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitRegion(region: Region, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			var result = this.visitElement(region, arg1, arg2, arg3, arg4);

			for (var i = 0, l = region.vertices.length; i < l; i++) {
				region.vertices[i].accept(this, arg1, arg2, arg3, arg4);
			}

			return result;
		}

		/**
		 * Visits a vertex within a state machine model.
		 * @method visitVertex
		 * @param {Vertex} vertex The vertex being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitVertex(vertex: Vertex, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			var result = this.visitElement(vertex, arg1, arg2, arg3, arg4);

			for (var i = 0, l = vertex.transitions.length; i < l; i++) {
				vertex.transitions[i].accept(this, arg1, arg2, arg3, arg4);
			}

			return result;
		}

		/**
		 * Visits a pseudo state within a state machine model.
		 * @method visitPseudoState
		 * @param {PseudoState} pseudoState The pseudo state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitPseudoState(pseudoState: PseudoState, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			return this.visitVertex(pseudoState, arg1, arg2, arg3, arg4);
		}

		/**
		 * Visits a state within a state machine model.
		 * @method visitState
		 * @param {State} state The state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitState(state: State, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			var result = this.visitVertex(state, arg1, arg2, arg3, arg4);

			for (var i = 0, l = state.regions.length; i < l; i++) {
				state.regions[i].accept(this, arg1, arg2, arg3, arg4);
			}
			
			return result;
		}

		/**
		 * Visits a final state within a state machine model.
		 * @method visitFinal
		 * @param {FinalState} finalState The final state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitFinalState(finalState: FinalState, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			return this.visitState(finalState, arg1, arg2, arg3, arg4);
		}

		/**
		 * Visits a state machine within a state machine model.
		 * @method visitVertex
		 * @param {StateMachine} state machine The state machine being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitStateMachine(stateMachine: StateMachine, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			return this.visitState(stateMachine, arg1, arg2, arg3, arg4);
		}

		/**
		 * Visits a transition within a state machine model.
		 * @method visitTransition
		 * @param {Transition} transition The transition being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @param {any} arg4 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		visitTransition(transition: Transition, arg1?: TArg1, arg2?: any, arg3?: any, arg4?: any): any {
			return;
		}
	}
}