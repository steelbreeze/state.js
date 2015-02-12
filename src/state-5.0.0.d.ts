/**
 * state.js version 5 finite state machine.
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
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     * @returns {boolean}
     */
    interface Guard {
        (message: any, context: IContext): boolean;
    }
    /**
     * Type signature for an action performed durin Transitions.
     * @interface Action
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     * @param history {boolean} For internal use only.
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
         * @method setCurrent
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        /**
         * @method getCurrent
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
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
         * @method toString
         * Returns a the element name as a fully qualified namespace.
         * @returns {string}
         */
        toString(): string;
    }
    /**
     * @class Region
     * An element within a state machine model that is a container of Vertices.
     */
    class Region extends Element {
        state: State;
        /**
         * @member {string} defaultName The name given to regions thare are created automatically when a state is passed as a vertex's parent.
         */
        static defaultName: string;
        vertices: Array<Vertex>;
        initial: PseudoState;
        /**
         * Creates a new instance of the region class.
         * @param name {string} The name of the region.
         * @param state {State} The parent state that the new region is a part of.
        */
        constructor(name: string, state: State);
        parent(): Element;
        /**
         * @method isComplete
         * True if the region is complete; a region is deemed to be complete if its current state is final (having on outbound transitions).
         * @param context {IContext} The object representing a particualr state machine instance.
         * @returns {boolean}
         */
        isComplete(context: IContext): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * @class Vertex
     * An element within a state machine model that can be the source or target of a transition.
     */
    class Vertex extends Element {
        region: Region;
        private transitions;
        private selector;
        constructor(name: string, region: Region, selector: Selector);
        constructor(name: string, state: State, selector: Selector);
        parent(): Element;
        /**
         * @method isFinal
         * Tests the vertex to see if it is a final vertex that has no outbound transitions.
         * @returns {boolean}
         */
        isFinal(): boolean;
        /**
         @method isComplete
         * True of the vertex is deemed to be complete; always true for pseuso states and simple states, true for composite states whose child regions all are complete.
         * @returns {boolean}
         */
        isComplete(context: IContext): boolean;
        /**
         * @method to
         * Creates a new transtion from this vertex to the target vertex.
         * @param target {Vertex} The destination of the transition; omit for internal transitions.
         * @returns {Transition}
         */
        to(target?: Vertex): Transition;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        evaluateCompletions(message: any, context: IContext, history: boolean): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * @class PseudoState
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    class PseudoState extends Vertex {
        /**
         * @member {PseudoStateKind} kind The specific kind of the pesudo state that drives its behaviour.
         */
        kind: PseudoStateKind;
        /**
         * Creates a new instance of the PseudoState class.
         * @param name {string} The name of the pseudo state.
         * @param region {Region} The parent region that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, region: Region, kind: PseudoStateKind);
        /**
         * Creates a new instance of the PseudoState class.
         * @param name {string} The name of the pseudo state.
         * @param state {State} The parent state that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, state: State, kind: PseudoStateKind);
        isHistory(): boolean;
        isInitial(): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
    }
    /**
     * @class State
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     */
    class State extends Vertex {
        private static selector(transitions, message, context);
        regions: Array<Region>;
        private exitBehavior;
        private entryBehavior;
        /**
         * Creates a new instance of the State class.
         * @param name {string} The name of the state.
         * @param region {Region} The parent region that owns the state.
         */
        constructor(name: string, region: Region);
        /**
         * Creates a new instance of the State class.
         * @param name {string} The name of the state.
         * @param state {State} The parent state that owns the state.
         */
        constructor(name: string, state: State);
        defaultRegion(): Region;
        /**
         * @method isSimple
         * True if the state is a simple state, one that has no child regions.
         * @returns {boolean}
         */
        isSimple(): boolean;
        /**
         * @method isComposite
         * True if the state is a composite state, one that child regions.
         * @returns {boolean}
         */
        isComposite(): boolean;
        /**
         * @method isOrthogonal
         * True if the state is a simple state, one that has more than one child region.
         * @returns {boolean}
         */
        isOrthogonal(): boolean;
        /**
         * @method exit
         * Adds behaviour to a state that is executed each time the state is exited.
         * @returns {State}
         */
        exit<TMessage>(exitAction: Action): State;
        /**
         * @method entry
         * Adds behaviour to a state that is executed each time the state is entered.
         * @returns {State}
         */
        entry<TMessage>(entryAction: Action): State;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * @class FinalState
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     */
    class FinalState extends State {
        /**
         * Creates a new instance of the FinalState class.
         * @param name {string} The name of the final state.
         * @param region {Region} The parent region that owns the final state.
         */
        constructor(name: string, region: Region);
        /**
         * Creates a new instance of the FinalState class.
         * @param name {string} The name of the final state.
         * @param state {State} The parent state that owns the final state.
         */
        constructor(name: string, state: State);
        to(target?: Vertex): Transition;
    }
    /**
     * @class StateMachine
     * An element within a state machine model that represents the root of the state machine model.
     */
    class StateMachine extends State {
        clean: boolean;
        /**
         * Creates a new instance of the StateMachine class.
         * @param name {string} The name of the state machine.
         */
        constructor(name: string);
        root(): StateMachine;
        /**
         * @method bootstrap
         * Bootstraps the state machine model; precompiles the actions to take during transition traversal.
         * @param deepHistoryAbove {boolean} Internal use only.
         */
        bootstrap(deepHistoryAbove: boolean): void;
        /**
         * @method initialise
         * Initialises an instance of the state machine and enters its initial steady state.
         * @param context {IContext} The object representing a particualr state machine instance.
         * @param autoBootstrap {boolean} Set to false to manually control when bootstrapping occurs.
         */
        initialise(context: IContext, autoBootstrap?: boolean): void;
        /**
         * @method evaluate
         * Passes a message to a state machine instance for evaluation.
         * @param message {any} A message to pass to a state machine instance for evaluation that may cause a state transition.
         * @param context {IContext} The object representing a particualr state machine instance.
         * @param autoBootstrap {boolean} Set to false to manually control when bootstrapping occurs.
         * @returns {boolean} True if the method caused a state transition.
         */
        evaluate(message: any, context: IContext, autoBootstrap?: boolean): boolean;
    }
    /**
     * @class Transition
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     */
    class Transition {
        private source;
        private target;
        static isElse: Guard;
        guard: Guard;
        private transitionBehavior;
        traverse: Behavior;
        /**
         * Creates a new instance of the Transition class.
         * @param source {Vertex} The source of the transtion.
         * @param target {Vertex} The target of the transtion; omit for internal transitions.
         */
        constructor(source: Vertex, target?: Vertex);
        /**
        * @method completion
         * Turns a transtion into a completion transition.
         * @returns {Transition}
         */
        completion(): Transition;
        /**
         * @method else
         * Turns a transition into an else transition.
         * @returns {Transition}
         */
        else(): Transition;
        /**
         * @method when
         * Defines the guard condition for the transition.
         * @param guard {Guard} The guard condition that must evaluate true for the transition to be traversed.
         * @returns {Transition}
         */
        when(guard: Guard): Transition;
        /**
         * @method effect
         * Add behaviour to a transition.
         * @param transitionAction {Action} The bahaviour to add to the transition.
         * @returns {Transition}
         */
        effect<TMessage>(transitionAction: Action): Transition;
        bootstrap(): void;
    }
    /**
     * @class Context
     * Default working implementation of a state machine context class.
     */
    class Context implements IContext {
        isTerminated: boolean;
        private last;
        /**
         * @method setCurrent
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        /**
         * @method getCurrent
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }
}
