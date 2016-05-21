/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
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
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitElement(element: Element, arg1?: TArg1, arg2?: any, arg3?: any): any {
		}

		/**
		 * Visits a region within a state machine model.
		 * @method visitRegion
		 * @param {Region} region The region being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitRegion(region: Region, arg1?: TArg1, arg2?: any, arg3?: any): any {
			const result = this.visitElement(region, arg1, arg2, arg3);

			region.vertices.forEach(vertex => { vertex.accept(this, arg1, arg2, arg3) });

			return result;
		}

		/**
		 * Visits a vertex within a state machine model.
		 * @method visitVertex
		 * @param {Vertex} vertex The vertex being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitVertex(vertex: Vertex, arg1?: TArg1, arg2?: any, arg3?: any): any {
			const result = this.visitElement(vertex, arg1, arg2, arg3);

			vertex.outgoing.forEach(transition => { transition.accept(this, arg1, arg2, arg3) });

			return result;
		}

		/**
		 * Visits a pseudo state within a state machine model.
		 * @method visitPseudoState
		 * @param {PseudoState} pseudoState The pseudo state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitPseudoState(pseudoState: PseudoState, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return this.visitVertex(pseudoState, arg1, arg2, arg3);
		}

		/**
		 * Visits a state within a state machine model.
		 * @method visitState
		 * @param {State} state The state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitState(state: State, arg1?: TArg1, arg2?: any, arg3?: any): any {
			const result = this.visitVertex(state, arg1, arg2, arg3);

			state.regions.forEach(region => { region.accept(this, arg1, arg2, arg3) });

			return result;
		}

		/**
		 * Visits a final state within a state machine model.
		 * @method visitFinal
		 * @param {FinalState} finalState The final state being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitFinalState(finalState: FinalState, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return this.visitState(finalState, arg1, arg2, arg3);
		}

		/**
		 * Visits a state machine within a state machine model.
		 * @method visitVertex
		 * @param {StateMachine} state machine The state machine being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitStateMachine(model: StateMachine, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return this.visitState(model, arg1, arg2, arg3);
		}

		/**
		 * Visits a transition within a state machine model.
		 * @method visitTransition
		 * @param {Transition} transition The transition being visited.
		 * @param {TArg1} arg1 An optional parameter passed into the accept method.
		 * @param {any} arg2 An optional parameter passed into the accept method.
		 * @param {any} arg3 An optional parameter passed into the accept method.
		 * @returns {any} Any value may be returned when visiting an element.
		 */
		public visitTransition(transition: Transition, arg1?: TArg1, arg2?: any, arg3?: any): any {
		}
	}
}