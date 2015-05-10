/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
 
 /**
  * Namespace for the finite state machine classes.
  * @module fsm
  */
module fsm {	
	/**
	 * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
	 * 
	 * Vertex extends the Element class and inherits its public interface.
	 * @class Vertex
	 * @augments Element
	 */
	export class Vertex extends Element {
		/**
		 * The parent region of this vertex.
		 * @member {Region}
		 */
		region: Region;
		
		/**
		 * The set of transitions from this vertex.
		 * @member {Array<Transition>}
		 */
		transitions: Array<Transition> = [];

		/**
		 * Creates a new instance of the Vertex class within a given parent region.
		 * @param {string} name The name of the vertex.
		 * @param {Region} parent The parent region.
		 */
		constructor(name: string, parent: Region);
		
		/**
		 * Creates a new instance of the Vertex class within a given parent state.
		 * Note, this will create the vertex within the parent states default region.
		 * @param {string} name The name of the vertex.
		 * @param {State} parent The parent state.
		 */
		constructor(name: string, parent: State);

		/**
		 * Creates a new instance of the Vertex class.
		 * @param {string} name The name of the vertex.
		 * @param {Region|State} parent The parent region or state.
		 */
		constructor(name: string, parent: any) {
			super(name);

			if (parent instanceof Region) {
				this.region = <Region>parent;
			} else if (parent instanceof State) {
				this.region = (<State>parent).defaultRegion();
			}

			if (this.region) {
				this.region.vertices.push(this);
				this.region.root().clean = false;
			}
		}

		/**
		 * Returns the parent element of this vertex.
		 * @method getParent
		 * @returns {Element} The parent element of the vertex.
		 */
		getParent(): Element {
			return this.region;
		}
		
		/**
		 * Tests the vertex to determine if it is deemed to be complete.
		 * Pseudo states and simple states are always deemed to be complete.
		 * Composite states are deemed to be complete when all its child regions all are complete.
		 * @method isComplete
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @returns {boolean} True if the vertex is deemed to be complete.
		 */
		isComplete(instance: IActiveStateConfiguration): boolean {
			return;
		}

		/**
		 * Creates a new transition from this vertex.
		 * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
		 * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
		 * @method to
		 * @param {Vertex} target The destination of the transition; omit for internal transitions.
		 * @returns {Transition} The new transition object.
		 */
		to(target?: Vertex): Transition {
			var transition = new Transition(this, target);

			this.transitions.push(transition);
			this.root().clean = false;

			return transition;
		}

		// selects the transition to follow for a given message and state machine instance combination
		select(message: any, instance: IActiveStateConfiguration): Transition {
			return; // NOTE: abstract method
		}

		/**
		 * Evaluates a message to determine if a state transition can be made.
		 * Vertices will evauate the guard conditions of their outbound transition; if a single guard evaluates true, the transition will be traversed.
		 * @method evaluate
		 * @param {any} message The message that will be evaluated.
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the message triggered a state transition.
		 */
		evaluate(message: any, instance: IActiveStateConfiguration): boolean {
			var transition = this.select(message, instance);

			if (!transition) {
				return false;
			}

			for (var i =0, l = transition.traverse.length; i < l; i++) {
				transition.traverse[i](message, instance, false);
			}

			return true;
		}

		/**
		 * Accepts an instance of a visitor.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return; // note: abstract method
		}
	}

	/**
	 * An element within a state machine model that represents an transitory Vertex within the state machine model.
	 * 
	 * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
	 * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
	 * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
	 *
	 * PseudoState extends the Vertex class and inherits its public interface.
	 * @class PseudoState
	 * @augments Vertex
	 */
	export class PseudoState extends Vertex {
		/**
		 * The kind of the pseudo state which determines its use and behaviour.
		 * @member {PseudoStateKind}
		 */
		public kind: PseudoStateKind;
		
		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {Region} parent The parent region that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		constructor(name: string, parent: Region, kind: PseudoStateKind);
		
		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {State} parent The parent state that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		constructor(name: string, parent: State, kind: PseudoStateKind);

		/**
		 * Creates a new instance of the PseudoState class.
		 * @param {string} name The name of the pseudo state.
		 * @param {Element} parent The parent element that this pseudo state will be a child of.
		 * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
		 */
		constructor(name: string, parent: any, kind: PseudoStateKind) {
			super(name, parent);

			this.kind = kind;

			if (this.isInitial()) {
				this.region.initial = this;
			}
		}

		/**
		 * Tests the vertex to determine if it is deemed to be complete.
		 * Pseudo states and simple states are always deemed to be complete.
		 * Composite states are deemed to be complete when all its child regions all are complete.
		 * @method isComplete
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @returns {boolean} True if the vertex is deemed to be complete.
		 */
		isComplete(instance: IActiveStateConfiguration): boolean {
			return true;
		}

		/**
		 * Tests a pseudo state to determine if it is a history pseudo state.
		 * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isHistory
		 * @returns {boolean} True if the pseudo state is a history pseudo state.
		 */
		isHistory(): boolean {
			return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
		}

		/**
		 * Tests a pseudo state to determine if it is an initial pseudo state.
		 * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
		 * @method isInitial
		 * @returns {boolean} True if the pseudo state is an initial pseudo state.
		 */
		isInitial(): boolean {
			return this.kind === PseudoStateKind.Initial || this.isHistory();
		}

		// selects the transition to follow for a given message and state machine instance combination
		select(message: any, instance: IActiveStateConfiguration): Transition {
			switch (this.kind) {
				case PseudoStateKind.Initial:
				case PseudoStateKind.DeepHistory:
				case PseudoStateKind.ShallowHistory:
					if (this.transitions.length === 1) {
						return this.transitions[0];
					} else {
						throw "Initial transition must have a single outbound transition from " + this.qualifiedName;
					}

				case PseudoStateKind.Junction:
					var result: Transition, elseResult: Transition;

					for (var i = 0, l = this.transitions.length; i < l; i++) {
						if (this.transitions[i].guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound transitions evaluated true";
							}

							elseResult = this.transitions[i];
						} else if (this.transitions[i].guard(message, instance)) {
							if (result) {
								throw "Multiple outbound transitions evaluated true";
							}

							result = this.transitions[i];
						}
					}

					return result || elseResult;

				case PseudoStateKind.Choice:
					var results: Array<Transition> = [];

					for (var i = 0, l = this.transitions.length; i < l; i++) {
						if (this.transitions[i].guard === Transition.isElse) {
							if (elseResult) {
								throw "Multiple outbound else transitions found at " + this + " for " + message;
							}

							elseResult = this.transitions[i];
						} else if (this.transitions[i].guard(message, instance)) {
							results.push(this.transitions[i]);
						}
					}

					return results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;

				default:
					return null;
			}
		}

		/**
		 * Accepts an instance of a visitor and calls the visitPseudoState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitPseudoState(this, arg);
		}
	}

	/**
	 * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
	 *
	 * States are one of the fundamental building blocks of the state machine model.
	 * Behaviour can be defined for both state entry and state exit.
	 *
	 * State extends the Vertex class and inherits its public interface.
	 * @class State
	 * @augments Vertex
	 */
	export class State extends Vertex {
		// user defined behaviour (via exit method) to execute when exiting a state.
		exitBehavior: Array<Action> = [];
		
		// user defined behaviour (via entry method) to execute when entering a state.
		entryBehavior: Array<Action> = [];
		
		/**
		 * The set of regions under this state.
		 * @member {Array<Region>}
		 */
		regions: Array<Region> = [];		

		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {Region} parent The parent region that owns the state.
		 */
		constructor(name: string, parent: Region);
		
		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {State} parent The parent state that owns the state.
		 */
		constructor(name: string, parent: State);

		/** 
		 * Creates a new instance of the State class.
		 * @param {string} name The name of the state.
		 * @param {Element} parent The parent state that owns the state.
		 */
		constructor(name: string, parent: any) {
			super(name, parent);
		}

		/**
		 * Returns the default region for the state.
		 * Note, this will create the default region if it does not already exist.
		 * @method defaultRegion
		 * @returns {Region} The default region.
		 */
		defaultRegion(): Region {
			var region: Region;

			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.regions[i].name === Region.defaultName) {
					region = this.regions[i];
				}
			}

			if (!region) {
				region = new Region(Region.defaultName, this);
			}

			return region;
		}

		/**
		 * Determines if an element is active within a given state machine instance.
		 * @method isActive
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the element is active within the state machine instance.
		 */
		isActive(instance: IActiveStateConfiguration): boolean {
			return super.isActive(instance) && instance.getCurrent(this.region) === this;
		}

		/**
		 * Tests the state to see if it is a final state;
		 * a final state is one that has no outbound transitions.
		 * @method isFinal
		 * @returns {boolean} True if the state is a final state.
		 */
		isFinal(): boolean {
			return this.transitions.length === 0;
		}
		
		/**
		 * Tests the state to see if it is a simple state;
		 * a simple state is one that has no child regions.
		 * @method isSimple
		 * @returns {boolean} True if the state is a simple state.
		 */
		isSimple(): boolean {
			return this.regions.length === 0;
		}

		/**
		 * Tests the state to see if it is a composite state;
		 * a composite state is one that has one or more child regions.
		 * @method isComposite
		 * @returns {boolean} True if the state is a composite state.
		 */
		isComposite(): boolean {
			return this.regions.length > 0;
		}

		/**
		 * Tests the state to see if it is an orthogonal state;
		 * an orthogonal state is one that has two or more child regions.
		 * @method isOrthogonal
		 * @returns {boolean} True if the state is an orthogonal state.
		 */
		isOrthogonal(): boolean {
			return this.regions.length > 1;
		}

		/**
		 * Tests a region to determine if it is deemed to be complete.
		 * A region is complete if its current state is final (a state having on outbound transitions).
		 * @method isComplete
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @returns {boolean} True if the region is deemed to be complete.
		 */
		isComplete(instance: IActiveStateConfiguration): boolean {
			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.regions[i].isComplete(instance) === false) {
					return false;
				}
			}

			return true;
		}
		
		/**
		 * Adds behaviour to a state that is executed each time the state is exited.
		 * @method exit
		 * @param {Action} exitAction The action to add to the state's exit behaviour.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		exit<TMessage>(exitAction: Action): State {
			this.exitBehavior.push(exitAction);

			this.root().clean = false;

			return this;
		}

		/**
		 * Adds behaviour to a state that is executed each time the state is entered.
		 * @method entry
		 * @param {Action} entryAction The action to add to the state's entry behaviour.
		 * @returns {State} Returns the state to allow a fluent style API.
		 */
		entry<TMessage>(entryAction: Action): State {
			this.entryBehavior.push(entryAction);

			this.root().clean = false;

			return this;
		}

		// selects the transition to follow for a given message and state machine instance combination
		select(message: any, instance: IActiveStateConfiguration): Transition {
			var result: Transition;

			for (var i = 0, l = this.transitions.length; i < l; i++) {
				if (this.transitions[i].guard(message, instance)) {
					if (result) {
						throw "Multiple outbound transitions evaluated true";
					}

					result = this.transitions[i];
				}
			}

			return result;
		}

		/**
		 * Evaluates a message to determine if a state transition can be made.
		 * States initially delegate messages to their child regions for evaluation, if no state transition is triggered, they behave as any other vertex.
		 * @method evaluate
		 * @param {any} message The message that will be evaluated.
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the message triggered a state transition.
		 */
		evaluate(message: any, instance: IActiveStateConfiguration): boolean {
			var processed = false;

			for (var i = 0, l = this.regions.length; i < l; i++) {
				if (this.isActive(instance) === true) {
					if (this.regions[i].evaluate(message, instance)) {
						processed = true;
					}
				}
			}

			if (processed === false) {
				processed = super.evaluate(message, instance);
			}

			if (processed === true && message !== this && this.isComplete(instance)) {
				this.evaluate(this, instance);
			}

			return processed;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitState(this, arg);
		}
	}

	/**
	 * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
	 *
	 * A final state cannot have outbound transitions.
	 *
	 * FinalState extends the State class and inherits its public interface.
	 * @class FinalState
	 * @augments State
	 */
	export class FinalState extends State {
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {Region} parent The parent region that owns the final state.
		 */
		constructor(name: string, parent: Region);
		
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {State} parent The parent state that owns the final state.
		 */
		constructor(name: string, parent: State);
		
		/** 
		 * Creates a new instance of the FinalState class.
		 * @param {string} name The name of the final state.
		 * @param {Element} parent The parent element that owns the final state.
		 */
		constructor(name: string, parent: any) {
			super(name, parent);
		}

		// override Vertex.to to throw an exception when trying to create a transition from a final state.
		to(target?: Vertex): Transition {
			throw "A FinalState cannot be the source of a transition.";
		}

		/**
		 * Accepts an instance of a visitor and calls the visitFinalState method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitFinalState(this, arg);
		}
	}

	/**
	 * An element within a state machine model that represents the root of the state machine model.
	 *
	 * StateMachine extends the State class and inherits its public interface.
	 * @class StateMachine
	 * @augments State
	 */
	export class StateMachine extends State {
		// behaviour required to bootstrap state machine instances.
		init: Array<Action>;
		
		// flag used to indicate that the state machine model requires bootstrapping.
		clean = false;

		/** 
		 * Creates a new instance of the StateMachine class.
		 * @param {string} name The name of the state machine.
		 */
		constructor(name: string) {
			super(name, undefined);
		}

		/**
		 * Returns the root element within the state machine model.
		 * Note that if this state machine is embeded within another state machine, the ultimate root element will be returned.
		 * @method root
		 * @returns {StateMachine} The root state machine element.
		 */
		root(): StateMachine {
			return this.region ? this.region.root() : this;
		}

		/**
		 * Determines if an element is active within a given state machine instance.
		 * @method isActive
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the element is active within the state machine instance.
		 */
		isActive(instance: IActiveStateConfiguration): boolean {
			return this.region ? this.region.isActive(instance) : true;
		}

		/**
		 * Bootstraps the state machine model; precompiles the actions to take during transition traversal.
		 *
		 * Bootstrapping a state machine model pre-calculates all the actions required for each transition within the state machine model.
		 * The actions will exit all states as appropriate, perform transition behaviour, enter all states as appropriate and update the current state.
		 *
		 * This is only required if you are dynamically changing the state machine model and want to manually control when the model is bootstrapped.
		 * @method bootstrap
		 */
		initialiseModel(): void {
			this.clean = true;

			this.accept(Bootstrap.getInstance(), false);
		}

		/**
		 * Initialises an instance of the state machine and enters its initial pseudo state.
		 * Entering the initial pseudo state may cause a chain of other completion transitions.
		 * @method initialise
		 * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
		 * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
		 */
		initialise(instance: IActiveStateConfiguration, autoBootstrap: boolean = true): void {
			if (autoBootstrap && this.clean === false) {
				this.initialiseModel();
			}

			for (var i =0, l = this.init.length; i < l; i++) {
				this.init[i](undefined, instance, false);
			}
		}

		/**
		 * Evaluates a message to determine if a state transition can be made.
		 * State machines initially delegate messages to their child regions for evaluation.
		 * @method evaluate
		 * @param {any} message The message that will be evaluated.
		 * @param {IActiveStateConfiguration} instance The state machine instance.
		 * @returns {boolean} True if the message triggered a state transition.
		 */
		evaluate(message: any, instance: IActiveStateConfiguration, autoBootstrap: boolean = true): boolean {
			if (autoBootstrap && this.clean === false) {
				this.initialiseModel();
			}

			if (instance.isTerminated) {
				return false;
			}

			return super.evaluate(message, instance);
		}

		/**
		 * Accepts an instance of a visitor and calls the visitStateMachine method on it.
		 * @method accept
		 * @param {Visitor<TArg>} visitor The visitor instance.
		 * @param {TArg} arg An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
 		 */
		accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): any {
			return visitor.visitStateMachine(this, arg);
		}
	}


	// TODO: determine how to seperate these from the StateMachine class.

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

	// Temporary structure to hold element behaviour during the bootstrap process
	class Behaviour {
		leave: Array<Action> = [];
		beginEnter: Array<Action> = [];
		endEnter: Array<Action> = [];
		enter: Array<Action> = [];
	}

	// Bootstraps transitions after all elements have been bootstrapped
	class BootstrapTransitions extends Visitor<(element: Element) => Behaviour> {
		private static _instance: BootstrapTransitions;
		
		public static getInstance(): BootstrapTransitions {
			if (!BootstrapTransitions._instance) {
				BootstrapTransitions._instance = new BootstrapTransitions();
			}
			
			return BootstrapTransitions._instance;
		}
		
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
							for (var ii = 0, ll = state.regions.length; ii < ll; ii++) {
								var region = state.regions[ii];

								if (region !== next) {
									transition.traverse = transition.traverse.concat(behaviour(region).enter);
								}
							}
						}
					}
				}

				// trigger cascade
				transition.traverse = transition.traverse.concat(behaviour(transition.target).endEnter);
			}
		}
	}

	// bootstraps all the elements within a state machine model
	class Bootstrap extends Visitor<boolean> {
		private static _instance: Bootstrap;
		
		public static getInstance(): Bootstrap {
			if (!Bootstrap._instance) {
				Bootstrap._instance = new Bootstrap();
			}
			
			return Bootstrap._instance;
		}
		
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
			
			for (var i = 0, l = region.vertices.length; i < l; i++) {
				region.vertices[i].accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory));
			}

			regionBehaviour.leave.push((message, instance, history) => {
				var leave = this.behaviour(instance.getCurrent(region)).leave;
				
				for (var i =0, l = leave.length; i < l; i++) {
					leave[i](message, instance, false);
				}
			});

			if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
				regionBehaviour.endEnter.push((message, instance, history) => {
					var initial: Vertex = region.initial;
					
					if (history || region.initial.isHistory()) {
						initial = instance.getCurrent(region) || region.initial;
					}
					
					var enter = this.behaviour(initial).enter;
					var hist = history || region.initial.kind === PseudoStateKind.DeepHistory;
					
					for (var i =0, l = enter.length; i < l; i++) {
						enter[i](message, instance, hist);
					}
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
				if (vertex.isComplete(instance)) {
					vertex.evaluate(vertex, instance);
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
			
			for (var i = 0, l = state.regions.length; i < l; i++) {
				var region = state.regions[i];
				var regionBehaviour = this.behaviour(region);

				region.accept(this, deepHistoryAbove);

				stateBehaviour.leave.push((message, instance, history) => {
					for (var i =0, l = regionBehaviour.leave.length; i < l; i++) {
						regionBehaviour.leave[i](message, instance, false);
					}
				});

				stateBehaviour.endEnter = stateBehaviour.endEnter.concat(regionBehaviour.enter);
			}

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

			stateMachine.accept(BootstrapTransitions.getInstance(), (element: Element) => { return this.behaviour(element); });

			stateMachine.init = this.behaviour(stateMachine).enter;
		}
	}
}