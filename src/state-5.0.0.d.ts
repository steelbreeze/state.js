/**
 * State v5 finite state machine library
 *
 * http://www.steelbreeze.net/state.cs
 * @copyright (c) 2014-5 Steelbreeze Limited
 * @license MIT and GPL v3 licences
 * @module state
 */
declare module state {
    /**
     * An enumeration that dictates the precise behaviour of the PseudoState objects.
     * @enum PseudoStateKind
     */
    enum PseudoStateKind {
        Choice = 0,
        DeepHistory = 1,
        Initial = 2,
        Junction = 3,
        ShallowHistory = 4,
        Terminate = 5,
    }
    /**
     * Type signature for guard conditions used by Transitions.
     * @interface Guard
     * @param {any} message The message injected into the state machine for evaluation.
     * @param {IContext}context The object representing a particualr state machine instance.
     * @returns {boolean}
     */
    interface Guard {
        (message: any, context: IContext): boolean;
    }
    /**
     * Type signature for an action performed durin Transitions.
     * @interface Action
     * @param {any} message The message injected into the state machine for evaluation.
     * @param {IContext} context The object representing a particualr state machine instance.
     * @param  {boolean} history For internal use only; indicates that history semantics are in operation when the action is called.
     * @returns {any} Note that the any return type is used to indicate that the state machine runtime does not care what the return type of actions are.
     */
    interface Action {
        (message: any, context: IContext, history: boolean): any;
    }
    /**
     * Type signature for a set of actions performed during Transitions.
     * @interface Behavior
     */
    interface Behavior extends Array<Action> {
    }
    interface Selector {
        (transitions: Array<Transition>, message: any, context: IContext): Transition;
    }
    /**
     * Interface for the state machine context; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
     * @interface IContext
     */
    interface IContext {
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
    /**
     * An abstract class used as the base for regions and vertices (states and pseudo states) with a state machine model.
     * @class Element
     */
    class Element {
        name: string;
        /**
         * @member {string} namespaceSeperator The symbol used to seperate element names within a fully qualified name.
         */
        static namespaceSeperator: string;
        leave: Behavior;
        beginEnter: Behavior;
        endEnter: Behavior;
        enter: Behavior;
        constructor(name: string);
        parent(): Element;
        root(): StateMachine;
        ancestors(): Array<Element>;
        reset(): void;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        /**
         * Returns a the element name as a fully qualified namespace.
         * @method toString
         * @returns {string}
         */
        toString(): string;
    }
    /**
     * An element within a state machine model that is a container of Vertices.
     * @class Region
     * @augments Element
     */
    class Region extends Element {
        state: State;
        /** @member {string} defaultName The name given to regions thare are created automatically when a state is passed as a vertex's parent. */
        static defaultName: string;
        vertices: Array<Vertex>;
        initial: PseudoState;
        /**
         * Creates a new instance of the Region class.
         * @param {string} name The name of the region.
         * @param {State} state The parent state that this region will be a child of.
         */
        constructor(name: string, state: State);
        parent(): Element;
        /**
         * True if the region is complete; a region is deemed to be complete if its current state is final (having on outbound transitions).
         * @method isComplete
         * @param {IContext} context The object representing a particualr state machine instance.
         * @returns {boolean}
         */
        isComplete(context: IContext): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * An abstract element within a state machine model that can be the source or target of a transition.
     * @class Vertex
     * @augments Element
     */
    class Vertex extends Element {
        region: Region;
        transitions: Array<Transition>;
        selector: Selector;
        constructor(name: string, region: Region, selector: Selector);
        constructor(name: string, state: State, selector: Selector);
        parent(): Element;
        /**
         * True of the vertex is deemed to be complete; always true for pseuso states and simple states, true for composite states whose child regions all are complete.
         * @method isComplete
         * @param {IContext} context The object representing a particualr state machine instance.
         * @returns {boolean}
         */
        isComplete(context: IContext): boolean;
        /**
         * Creates a new transtion from this vertex to the target vertex.
         * @method to
         * @param {Vertex} target The destination of the transition; omit for internal transitions.
         * @returns {Transition}
         */
        to(target?: Vertex): Transition;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        evaluateCompletions(message: any, context: IContext, history: boolean): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     * @class PseudoState
     * @augments Vertex
     */
    class PseudoState extends Vertex {
        /**
         * @member {PseudoStateKind} kind The specific kind of the pesudo state that drives its behaviour.
         */
        kind: PseudoStateKind;
        constructor(name: string, region: Region, kind: PseudoStateKind);
        constructor(name: string, state: State, kind: PseudoStateKind);
        isHistory(): boolean;
        isInitial(): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
    }
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     * @class State
     * @augments Vertex
     */
    class State extends Vertex {
        private static selector(transitions, message, context);
        regions: Array<Region>;
        private exitBehavior;
        private entryBehavior;
        /**
         * Creates a new instance of the State class.
         * @param {string} name The name of the state.
         * @param {Region} region The parent region that owns the state.
         */
        constructor(name: string, region: Region);
        /**
         * Creates a new instance of the State class.
         * @param {string} name The name of the state.
         * @param {State} state The parent state that owns the state.
         */
        constructor(name: string, state: State);
        defaultRegion(): Region;
        /**
         * Tests the state to see if it is a final state that has no outbound transitions.
         * @method isFinal
         * @returns {boolean}
         */
        isFinal(): boolean;
        /**
         * True if the state is a simple state, one that has no child regions.
         * @method isSimple
         * @returns {boolean}
         */
        isSimple(): boolean;
        /**
         * True if the state is a composite state, one that child regions.
         * @method isComposite
         * @returns {boolean}
         */
        isComposite(): boolean;
        /**
         * True if the state is a simple state, one that has more than one child region.
         * @method isOrthogonal
         * @returns {boolean}
         */
        isOrthogonal(): boolean;
        /**
         * Adds behaviour to a state that is executed each time the state is exited.
         * @method exit
         * @param {Action} exitAction The action to add to the state's exit behaviour.
         * @returns {State}
         */
        exit<TMessage>(exitAction: Action): State;
        /**
         * Adds behaviour to a state that is executed each time the state is entered.
         * @method entry
         * @param {Action} entryAction The action to add to the state's entry behaviour.
         * @returns {State}
         */
        entry<TMessage>(entryAction: Action): State;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     * @class FinalState
     * @augments State
     */
    class FinalState extends State {
        constructor(name: string, region: Region);
        constructor(name: string, state: State);
        to(target?: Vertex): Transition;
    }
    /**
     * An element within a state machine model that represents the root of the state machine model.
     * @class StateMachine
     * @augments State
     */
    class StateMachine extends State {
        clean: boolean;
        constructor(name: string);
        root(): StateMachine;
        /**
         * Bootstraps the state machine model; precompiles the actions to take during transition traversal.
         * @method bootstrap
         */
        bootstrap(deepHistoryAbove: boolean): void;
        /**
         * Initialises an instance of the state machine and enters its initial steady state.
         * @method initialise
         * @param {IContext} context The object representing a particualr state machine instance.
         * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
         */
        initialise(context: IContext, autoBootstrap?: boolean): void;
        /**
         * Passes a message to a state machine instance for evaluation.
         * @method evaluate
         * @param {any} message A message to pass to a state machine instance for evaluation that may cause a state transition.
         * @param {IContext} context The object representing a particualr state machine instance.
         * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
         * @returns {boolean} True if the method caused a state transition.
         */
        evaluate(message: any, context: IContext, autoBootstrap?: boolean): boolean;
    }
    /**
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     * @class Transition
     */
    class Transition {
        private source;
        private target;
        static isElse: Guard;
        guard: Guard;
        private transitionBehavior;
        traverse: Behavior;
        constructor(source: Vertex, target?: Vertex);
        /**
         * Turns a transtion into a completion transition.
        * @method completion
         * @returns {Transition}
         */
        completion(): Transition;
        /**
         * Turns a transition into an else transition.
         * @method else
         * @returns {Transition}
         */
        else(): Transition;
        /**
         * Defines the guard condition for the transition.
         * @method when
         * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed.
         * @returns {Transition}
         */
        when(guard: Guard): Transition;
        /**
         * Add behaviour to a transition.
         * @method effect
         * @param {Action} transitionAction The action to add to the transitions traversal behaviour.
         * @returns {Transition}
         */
        effect<TMessage>(transitionAction: Action): Transition;
        bootstrap(): void;
    }
    /**
     * Default working implementation of a state machine context class.
     * @class Context
     * @implements IContext
     */
    class Context implements IContext {
        isTerminated: boolean;
        private last;
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
}
