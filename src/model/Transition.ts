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
	 * internal transitions respond to messages but do not cause a state transition, they only have behavior;
	 * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
	 * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
	 *
	 * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
	 * @class Transition
	 */
	export class Transition {
		// the default guard condition for pseudo states
		static TrueGuard = () => { return true; };

		// used as the guard condition for else tranitions
		static FalseGuard = () => { return false; };

		// guard condition for this transition.
		guard: Guard;

		// user defined behavior (via effect) executed when traversing this transition.
		transitionBehavior = new Behavior();

		// the collected actions to perform when traversing the transition (includes exiting states, traversal, and state entry)
		onTraverse: Behavior;

		/**
		 * The source of the transition.
		 * @member {Vertex}
		 */
		public source: Vertex;

		/**
		 * The target of the transition.
		 * @member {Vertex}
		 */
		public target: Vertex;

		/**
		 * The kind of the transition which determines its behavior.
		 * @member {TransitionKind}
		 */
		public kind: TransitionKind;

		/**
		 * Creates a new instance of the Transition class.
		 * @param {Vertex} source The source of the transition.
		 * @param {Vertex} source The target of the transition; this is an optional parameter, omitting it will create an Internal transition.
		 * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
		 */
		public constructor(source: Vertex, target?: Vertex, kind: TransitionKind = TransitionKind.External) {
			this.source = source;
			this.target = target;
			this.kind = target ? kind : TransitionKind.Internal;

			this.guard = source instanceof PseudoState ? Transition.TrueGuard : (message => message === this.source);

			this.source.outgoing.push(this);

			if (this.target) {
				this.target.incoming.push(this);
			}

			this.source.getRoot().clean = false;
		}

		/**
		 * Turns a transition into an else transition.
		 *
		 * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
		 * @method else
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		public else(): Transition {
			this.guard = Transition.FalseGuard;

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
		 * Add behavior to a transition.
		 * @method effect
		 * @param {Action} transitionAction The action to add to the transitions traversal behavior.
		 * @returns {Transition} Returns the transition object to enable the fluent API.
		 */
		public effect(transitionAction: Action): Transition {
			this.transitionBehavior.push(transitionAction);

			this.source.getRoot().clean = false;

			return this;
		}

		/**
		 * Removes the transition from the state machine model
		 * @method remove
		 */
		public remove() {
			this.source.outgoing.splice(this.source.outgoing.indexOf(this), 1);

			if (this.target) {
				this.target.incoming.splice(this.target.incoming.indexOf(this), 1);
			}

			console.log("remove " + this);

			this.source.getRoot().clean = false;
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

		/**
		 * Returns a the transition name.
		 * @method toString
		 * @returns {string}
		 */
		public toString(): string {
			return "[" + (this.target ? (this.source + " -> " + this.target) : this.source) + "]";
		}
	}
}