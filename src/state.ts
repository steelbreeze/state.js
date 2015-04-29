/**
 * state v5 finite state machine library
 * http://www.steelbreeze.net/state.cs
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 */

/**
 * Default namespace for the state.js classes.
 * @module fsm
 */
module fsm {
	interface Dictionary<TValue> {
        [index: string]: TValue;
    }
    

export interface Guard {
		(message: any, instance: IActiveStateConfiguration): boolean;
	}
	
	export interface Action {
		(message: any, instance: IActiveStateConfiguration, history: boolean): any;
	}
	
    /**
     * Interface for the state machine instance; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
     * @interface IActiveStateConfiguration
     */
    export interface IActiveStateConfiguration {
        /**
         * @member {boolean} isTerminated Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
         */
        isTerminated: boolean;
        
        /**
         * Updates the last known state for a given region.
         * @method setCurrent
         * @param {Region} region The region to update the last known state for.
         * @param {State} state The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        
        /**
         * Returns the last known state for a given region.
         * @method getCurrent
         * @param {Region} region The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }
		
	export class Visitor<TArg> {
		visitElement(element: Element, arg: TArg) {
		}
		
		visitRegion(region: Region, arg: TArg) {
			this.visitElement(region, arg);
			
			for (var i = 0, l = region.vertices.length; i < l; i++) {
				region.vertices[i].accept(this, arg);
			}
		}
		
		visitVertex(vertex: Vertex, arg: TArg) {
			this.visitElement(vertex, arg);
			
			for (var i = 0, l = vertex.transitions.length; i < l; i++) {
				vertex.transitions[i].accept(this, arg);
			}			
		}
		
		visitPseudoState(pseudoState: PseudoState, arg: TArg) {
			this.visitVertex(pseudoState, arg);
		}
		
		visitState(state: State, arg: TArg) {
			this.visitVertex(state, arg);

			for (var i = 0, l = state.regions.length; i < l; i++) {
				state.regions[i].accept(this, arg);
			}			
		}
		
		visitFinalState(finalState: FinalState, arg: TArg) {
			this.visitState(finalState, arg);
		}
		
		visitStateMachine(stateMachine: StateMachine, arg: TArg) {
			this.visitState(stateMachine, arg);
		}
		
		visitTransition(transition: Transition, arg: TArg) {
		}
	}

	class Behaviour {
	}
	
	class BootstrapTransitions extends Visitor<(element: Element) => Behaviour> {
		visitTransition(transition: Transition, elementBehaviour: (element: Element) => Behaviour) {
			// internal transitions: just perform the actions; no exiting or entering states
            if (transition.target === null) {
                transition.traverse = transition.transitionBehavior;
                
            // local transtions (within the same parent region): simple exit, transition and entry
            } else if (transition.target.getParent() === transition.source.getParent()) {
                transition.traverse = transition.source.leave.concat(transition.transitionBehavior).concat(transition.target.enter);
                
            // external transitions (crossing region boundaries): exit to the LCA, transition, enter from the LCA
            } else {
                var sourceAncestors = transition.source.ancestors();
                var targetAncestors = transition.target.ancestors();
                var sourceAncestorsLength = sourceAncestors.length;
                var targetAncestorsLength = targetAncestors.length;
                var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);

                // find the index of the first uncommon ancestor
                while((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    i++;
                }

                // validate transition does not cross sibling regions boundaries
                assert(!(sourceAncestors[i] instanceof Region), "Transitions may not cross sibling orthogonal region boundaries");

                // leave the first uncommon ancestor
                transition.traverse = (i < sourceAncestorsLength ? sourceAncestors[i] : transition.source).leave.slice(0);

                // perform the transition action
                transition.traverse = transition.traverse.concat(transition.transitionBehavior);

                if (i >= targetAncestorsLength ) {
                    transition.traverse = transition.traverse.concat(transition.target.beginEnter);
                }
                                
                // enter the target ancestry
                while(i < targetAncestorsLength) {
					var element = targetAncestors[i++];
					var next = i < targetAncestorsLength ? targetAncestors[i] : undefined;

					transition.traverse = transition.traverse.concat(element.beginEnter);
					
					if (element instanceof State) {
						var state = <State>element;
						
						if (state.isOrthogonal()) {
							for (var ii = 0, ll = state.regions.length; ii < ll; ii++) {
								var region = state.regions[ii];
								
								if (region !== next) {
									transition.traverse = transition.traverse.concat(region.enter);
								}
							}
						}
					}
                }

                // trigger cascade
                transition.traverse = transition.traverse.concat(transition.target.endEnter);
            }
		}	
	}

	class Bootstrap extends Visitor<boolean> {
		private static bootstrapTransitions = new BootstrapTransitions();
		
		private elementBehaviour(element: Element): Behaviour {
			// TODO: complete
			return;
		}

		visitElement(element: Element, deepHistoryAbove: boolean) {
			element.qualifiedName = element.ancestors().map<string>((e)=> { return e.name; }).join(Element.namespaceSeparator);

            // Put these lines back for debugging
            element.leave.push((message: any, instance: IActiveStateConfiguration) => { console.log(instance + " leave " + element); });
            element.beginEnter.push((message: any, instance: IActiveStateConfiguration) => { console.log(instance + " enter " + element); });

            element.enter = element.beginEnter.concat(element.endEnter);
		}

		visitRegion(region: Region, deepHistoryAbove: boolean) {
            for( var i = 0, l = region.vertices.length; i < l; i++) {
                region.vertices[i].reset();
                region.vertices[i].accept(this, deepHistoryAbove || (region.initial && region.initial.kind === PseudoStateKind.DeepHistory));
            }

            region.leave.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { var current = instance.getCurrent(region); if (current.leave) { invoke(current.leave, message, instance, history); } });

            if (deepHistoryAbove || !region.initial || region.initial.isHistory()) {
                region.endEnter.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { var ini: Vertex = region.initial; if (history || region.initial.isHistory()) {ini = instance.getCurrent(region) || region.initial;} invoke(ini.enter, message, instance, history || (region.initial.kind === PseudoStateKind.DeepHistory)); });
            } else {
                region.endEnter = region.endEnter.concat(region.initial.enter);
            }

            this.visitElement(region, deepHistoryAbove);
		}

		visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
            this.visitElement(vertex, deepHistoryAbove);

            vertex.endEnter.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { vertex.evaluateCompletions(message, instance, history); });
            vertex.enter = vertex.beginEnter.concat(vertex.endEnter);
		}

		visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {			
            this.visitVertex(pseudoState, deepHistoryAbove);

            if (pseudoState.kind === PseudoStateKind.Terminate) {
                pseudoState.enter.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { instance.isTerminated = true; });
            }
		}
		
		visitState(state: State, deepHistoryAbove: boolean) {
            for( var i = 0, l = state.regions.length; i < l; i++) {
                var region = state.regions[i];
                region.reset();
                region.accept(this, deepHistoryAbove);

                state.leave.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { invoke(region.leave, message, instance, history); });

                state.endEnter = state.endEnter.concat(region.enter);
            }

            this.visitVertex(state, deepHistoryAbove);

            state.leave = state.leave.concat(state.exitBehavior);
            state.beginEnter = state.beginEnter.concat(state.entryBehavior);

            state.beginEnter.push((message: any, instance: IActiveStateConfiguration, history: boolean) => { if (state.region) { instance.setCurrent(state.region, state); } });

            state.enter = state.beginEnter.concat(state.endEnter);
		}
		
		visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean) {
			this.visitState(stateMachine, deepHistoryAbove);
			
			stateMachine.accept(Bootstrap.bootstrapTransitions, this.elementBehaviour);
		}
	}
	
    /**
     * An abstract class used as the base for the Region and Vertex classes.
     * An element is any part of the tree structure that represents a composite state machine model.
     * @class Element
     */
    export class Element {
        /**
         * The symbol used to separate element names within a fully qualified name.
         * Change this static member to create different styles of qualified name generated by the toString method.
         * @member {string}
         */
        static namespaceSeparator = ".";
		qualifiedName: string;

        leave: Array<Action> = [];
        beginEnter: Array<Action> = [];
        endEnter: Array<Action> =[];
        enter: Array<Action> = [];

        constructor(public name: string) { 
        }
        
        getParent(): Element {
            return;
        }
        
        root(): StateMachine {
            return this.getParent().root();
        }
        
        ancestors(): Array<Element> {
            return (this.getParent() ? this.getParent().ancestors() : []).concat(this);
        }

        isActive(instance: IActiveStateConfiguration): boolean {
            return this.getParent().isActive(instance);
        }
        
        reset(): void {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        }

		/**
         * Returns a the element name as a fully qualified namespace.
         * @method toString
         * @returns {string}
         */
         toString(): string { 
			 return this.qualifiedName;
        }
    }

    /**
     * An element within a state machine model that is a container of Vertices.
     * 
     * Regions are implicitly inserted into composite state machines as a container for vertices.
     * They only need to be explicitly defined if orthogonal states are required.
     * 
     * Region extends the Element class and inherits its public interface.
     * @class Region
     * @augments Element
     */
    export class Region extends Element {
        /**
         * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
         * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
         * Update this static member to use a different name for default regions.
         * @member {string} 
         */
        public static defaultName: string = "default";
        
        // NOTE: would like an equivalent of internal or package-private
        vertices: Array<Vertex> = [];
        initial: PseudoState;

        /**
         * Creates a new instance of the Region class.
         * @param {string} name The name of the region.
         * @param {State} parent The parent state that this region will be a child of.
         */
        constructor(name: string, public parent: State) {
            super(name);
            
            parent.regions.push(this);
            
            parent.root().clean = false;
        }
        
        getParent(): Element {
            return this.parent;
        }
        
        /**
         * Tests a region to determine if it is deemed to be complete.
         * A region is complete if its current state is final (a state having on outbound transitions).
         * @method isComplete
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @returns {boolean} True if the region is deemed to be complete.
         */
        isComplete(instance: IActiveStateConfiguration): boolean {
            return instance.getCurrent(this).isFinal();
        }
        
        evaluate(message: any, instance: IActiveStateConfiguration): boolean {
            return instance.getCurrent(this).evaluate(message, instance);
        }
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitRegion(this, arg);
		}
    }
    
    /**
     * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
     * 
     * Vertex extends the Element class and inherits its public interface.
     * @class Vertex
     * @augments Element
     */
    export class Vertex extends Element {
        region: Region;
        transitions: Array<Transition> = [];

        constructor(name: string, parent: Region);
        constructor(name: string, parent: State);
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

        evaluateCompletions(message: any, instance: IActiveStateConfiguration, history: boolean) {
            if (this.isComplete(instance)) {
                this.evaluate(this, instance);
            }
        }

		select(message: any, instance: IActiveStateConfiguration): Transition {
			return; // NOTE: abstract method
		}
		
        evaluate(message: any, instance: IActiveStateConfiguration): boolean {
            var transition = this.select(message, instance);
            
            if (!transition) {
                return false;
            }
            
            invoke(transition.traverse, message, instance, false);
                
            return true;
        }

		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			// NOTE: abstract method
		}
    }

    /**
     * An enumeration of static constants that dictates the precise behaviour of pseudo states.
     *
     * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
     * @class PseudoStateKind
     */
    export enum PseudoStateKind {        
        /**
         * Used for pseudo states that are always the staring point when entering their parent region.
         * @member {number} Initial
         */
        Initial,
                
        /**
         * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
         * @member {number} ShallowHistory
         */
        ShallowHistory,
        
        /**
         * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
         * @member {number} DeepHistory
         */
        DeepHistory,
        
        /**
         * Enables a dynamic conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many transitions are found, an arbitary one will be selected and traversed;
         * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {number} Choice
         */
        Choice,

        /**
         * Enables a static conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {number} Junction
         */
        Junction,

        /**
         * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
         * @member {number} Terminate
         */
        Terminate
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
        constructor(name: string, parent: any, public kind: PseudoStateKind) {
            super(name, parent/*, pseudoState(kind)*/);
            
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

        isHistory(): boolean {
            return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
        }

        isInitial(): boolean {
            return this.kind === PseudoStateKind.Initial || this.isHistory();
        }
		
		select(message: any, instance: IActiveStateConfiguration): Transition {
			switch(this.kind) {
				case PseudoStateKind.Initial:
				case PseudoStateKind.DeepHistory:
				case PseudoStateKind.ShallowHistory:
					if(this.transitions.length === 1) {
						return this.transitions[0];
					} else {
						throw "Initial transition must have a single outbound transition from " + this.qualifiedName;
					}

				case PseudoStateKind.Junction:
					var result: Transition, elseResult: Transition;

					for(var i = 0, l = this.transitions.length; i < l; i++) {
						if(this.transitions[i].guard === Transition.isElse) {
							if(elseResult) {
								throw "Multiple outbound transitions evaluated true";
							}

							elseResult = this.transitions[i];
							} else if(this.transitions[i].guard(message, instance)) {
								if(result) {
									throw "Multiple outbound transitions evaluated true";
							}

							result = this.transitions[i];
						}
					}
											
					return result || elseResult;
	
				case PseudoStateKind.Choice:
					var results: Array<Transition> = [];

					for(var i = 0, l = this.transitions.length; i < l; i++) {
						if(this.transitions[i].guard === Transition.isElse) {
							if(elseResult) {
									throw "Multiple outbound else transitions found at " + this + " for " + message;
							}

							elseResult = this.transitions[i];
						} else if(this.transitions[i].guard(message, instance)) {
							results.push(this.transitions[i]);
						}
					}

					return results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;

			default:
					return null;
			}
		}
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitPseudoState(this, arg);
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
        exitBehavior: Array<Action> = [];
        entryBehavior: Array<Action> = [];
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
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} exitAction The action to add to the state's exit behaviour.
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
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} entryAction The action to add to the state's entry behaviour.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        entry<TMessage>(entryAction: Action): State {
            this.entryBehavior.push(entryAction);

            this.root().clean = false;

            return this;
        }
        
		select(message: any, instance: IActiveStateConfiguration): Transition {
			var result: Transition;
                
            for (var i = 0, l = this.transitions.length; i < l; i++) {
                if(this.transitions[i].guard(message, instance)) {
                    if(result) {
                        throw "Multiple outbound transitions evaluated true";
                    }

                    result = this.transitions[i];
                }
            }
        
            return result;
		}
		
        evaluate(message: any, instance: IActiveStateConfiguration): boolean {
            var processed = false;
            
            for( var i = 0, l = this.regions.length; i < l; i++) {
                if(this.isActive(instance) === true) {
                    if(this.regions[i].evaluate(message, instance)) {
                        processed = true;
                    }
                }  
            }
            
            if(processed === false) {
                processed = super.evaluate(message, instance);
            }
            
            if(processed === true && message !== this) {
                this.evaluateCompletions(this, instance, false);
            }
            
            return processed;
        }
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitState(this, arg);
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
        
        to(target?: Vertex): Transition {
            // ensure FinalStates will satisfy the isFinal check
            throw "A FinalState cannot be the source of a transition.";
        }
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitFinalState(this, arg);
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
		private static bootstrap = new Bootstrap();
		
        // NOTE: would like an equivalent of internal or package-private
        clean = true;

        /** 
         * Creates a new instance of the StateMachine class.
         * @param {string} name The name of the state machine.
         */
        constructor(name: string) {
            super(name, undefined);
        }

        root(): StateMachine {
            return this;
        }

        isActive(instance: IActiveStateConfiguration): boolean {
            return true;
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
            super.reset();
            this.clean = true;
			
			this.accept(StateMachine.bootstrap, false);
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

            invoke(this.enter, undefined, instance, false);
        }

        /**
         * Passes a message to a state machine instance for evaluation.
         * 
         * The message will cause the guard conditions of outbound transitions from the current state to be evaluated; if a single guard evaluates true, it will trigger transition traversal.
         * Transition traversal may cause a chain of transitions to be traversed.
         * @method evaluate
         * @param {any} message A message to pass to a state machine instance for evaluation that may cause a state transition.
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
         * @returns {boolean} True if the method caused a state transition.
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
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitStateMachine(this, arg);
		}
    }

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
        static isElse = (message: any, instance: IActiveStateConfiguration): boolean => { return false; };
        
        guard: Guard;                
        transitionBehavior: Array<(message: any, instance: IActiveStateConfiguration, history: boolean) => any> = [];
        traverse: Array<(message: any, instance: IActiveStateConfiguration, history: boolean) => any> = [];

        /** 
         * Creates a new instance of the Transition class.
         * @param {Vertex} source The source of the transition.
         * @param {Vertex} source The target of the transition.
         */
        constructor(public source: Vertex, public target?: Vertex) {
            // transitions are initially completion transitions, where the message is the source state itself
            this.guard = (message: any, instance: IActiveStateConfiguration): boolean => { return message === this.source; };
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
         * @param {(message: any, instance: IActiveStateConfiguration) => boolean} guard The guard condition that must evaluate true for the transition to be traversed. 
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        when(guard: Guard ): Transition {
            this.guard = guard;

            return this;
        }

        /**
         * Add behaviour to a transition.
         * @method effect
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} transitionAction The action to add to the transitions traversal behaviour.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        effect<TMessage>(transitionAction: Action): Transition {
            this.transitionBehavior.push(transitionAction);

            this.source.root().clean = false;
 
            return this;
        }
		
		accept<TArg>(visitor: Visitor<TArg>, arg: TArg) {
			visitor.visitTransition(this, arg);
		}
    }
               	
    function invoke(actions: Array<(message: any, instance: IActiveStateConfiguration, history: boolean) => any>, message: any, instance: IActiveStateConfiguration, history: boolean): void {
        for (var i = 0, l = actions.length; i < l; i++) {
            actions[i](message, instance, history);
        }
    }
      
    function assert(condition: boolean, error: string): void {
        if (!condition) {
            throw error;
        }
    }
    
    /**
     * Default working implementation of a state machine instance class.
     *
     * Implements the `IActiveStateConfiguration` interface.
     * It is possible to create other custom instance classes to manage state machine state in any way (e.g. as serialisable JSON); just implement the same members and methods as this class.
     * @class Context
     * @implements IActiveStateConfiguration
     */
    export class StateMachineInstance implements IActiveStateConfiguration {
        isTerminated: boolean = false;
        private last: Dictionary<State> = {};

		constructor (public name: string = "unnamed") { }
		
        /**
         * Updates the last known state for a given region.
         * @method setCurrent
         * @param {Region} region The region to update the last known state for.
         * @param {State} state The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void {            
            this.last[region.qualifiedName] = state;
        }

        /**
         * Returns the last known state for a given region.
         * @method getCurrent
         * @param {Region} region The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State {            
            return this.last[region.qualifiedName];
        }
		
		toString(): string {
			return this.name;
		}
    }
}