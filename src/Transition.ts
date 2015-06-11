/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
	 *
	 * Transitions come in a variety of types:
	 * internal transitions respond to messages but do not cause a state transition, they only have behaviour;
	 * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
	 * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
	 *
	 * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
	 * @class Transition
	 */
	export class Transition {
		// used as the guard condition for else tranitions
		static isElse = () => { return false; };
	
		// guard condition for this transition.
		guard: Guard;
		
		// user defined behaviour (via effect) executed when traversing this transition.
		transitionBehavior: Array<Action> = [];
		
		// the collected actions to perform when traversing the transition (includes exiting states, traversal, and state entry)
		traverse: Array<Action> = [];
	
		/** 
		 * Creates a new instance of the Transition class.
		 * @param {Vertex} source The source of the transition.
		 * @param {Vertex} source The target of the transition.
		 */
		public constructor(public source: Vertex, public target?: Vertex) {
			this.guard = message => { return message === this.source; };
		}
	
		/**
		 * Turns a transition into an else transition.
		 *
		 * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
		 * @method else
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		public else(): Transition {
			this.guard = Transition.isElse;
	
			return this;
		}
	
		/**
		 * Defines the guard condition for the transition.
		 * @method when
		 * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed. 
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		public when(guard: Guard): Transition {
			this.guard = guard;
	
			return this;
		}
	
		/**
		 * Add behaviour to a transition.
		 * @method effect
		 * @param {Action} transitionAction The action to add to the transitions traversal behaviour.
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		public effect<TMessage>(transitionAction: Action): Transition {
			this.transitionBehavior.push(transitionAction);
	
			this.source.getRoot().clean = false;
	
			return this;
		}
	
		/**
		 * Accepts an instance of a visitor and calls the visitTransition method on it.
		 * @method accept
		 * @param {Visitor<TArg1>} visitor The visitor instance.
		 * @param {TArg1} arg1 An optional argument to pass into the visitor.
		 * @param {any} arg2 An optional argument to pass into the visitor.
		 * @param {any} arg3 An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return visitor.visitTransition(this, arg1, arg2, arg3);
		}
	}
	
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
			return;
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
			var result = this.visitElement(region, arg1, arg2, arg3);
	
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
			var result = this.visitElement(vertex, arg1, arg2, arg3);
	
			vertex.transitions.forEach(transition => { transition.accept(this, arg1, arg2, arg3) });
	
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
			var result = this.visitVertex(state, arg1, arg2, arg3);
	
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
		public visitStateMachine(stateMachine: StateMachine, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return this.visitState(stateMachine, arg1, arg2, arg3);
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
			return;
		}
	}
}