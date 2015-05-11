/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
module fsm {
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
		static isElse = (message: any, instance: IActiveStateConfiguration): boolean => { return false; };

		// guard condition for this transition.
		guard: Guard;
		
		// user defined behaviour (via effect) executed when traversing this transition.
		transitionBehavior: Array<(message: any, instance: IActiveStateConfiguration, history: boolean) => any> = [];
		
		// the collected actions to perform when traversing the transition (includes exiting states, traversal, and state entry)
		traverse: Array<(message: any, instance: IActiveStateConfiguration, history: boolean) => any> = [];

		/** 
		 * Creates a new instance of the Transition class.
		 * @param {Vertex} source The source of the transition.
		 * @param {Vertex} source The target of the transition.
		 */
		constructor(public source: Vertex, public target?: Vertex) {
			// transitions are initially completion transitions, where the message is the source state itself
			this.guard = (message, instance): boolean => { return message === this.source; };
		}

		/**
		 * Turns a transition into an else transition.
		 *
		 * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
		 * @method else
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		else(): Transition {
			this.guard = Transition.isElse;

			return this;
		}

		/**
		 * Defines the guard condition for the transition.
		 * @method when
		 * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed. 
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		when(guard: Guard): Transition {
			this.guard = guard;

			return this;
		}

		/**
		 * Add behaviour to a transition.
		 * @method effect
		 * @param {Action} transitionAction The action to add to the transitions traversal behaviour.
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		effect<TMessage>(transitionAction: Action): Transition {
			this.transitionBehavior.push(transitionAction);

			this.source.root().clean = false;

			return this;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitTransition method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitTransition(this, arg);
		}
	}
}