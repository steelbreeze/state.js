/**
 * Finite state machine classes
 */
declare module state {
    /**
     * Enumeration describing the various types of PseudoState allowed.
     */
    enum PseudoStateKind {
        /** Semantic free vertex used to chain transitions together; if multiple outbound transitions guards evaluate true, an arbitary one is chosen. */
        Choice = 0,
        /** The initial vertex selected when the parent region is enterd for the first time, then triggers entry of the last known state for subsiquent entries; history cascades through all child hierarchy. */
        DeepHistory = 1,
        /** The initial vertex selected when the parent region is enterd. */
        Initial = 2,
        /** Semantic free vertex used to chain transitions together; if multiple outbound transitions guards evaluate true, an exception is thrown. */
        Junction = 3,
        /** The initial vertex selected when the parent region is enterd for the first time, then triggers entry of the last known state for subsiquent entries. */
        ShallowHistory = 4,
        /** Terminates the execution of the containing state machine; the machine will not evaluate any further messages. */
        Terminate = 5,
    }
    /**
     * Type signature for guard conditions used by Transitions.
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     * @returns {boolean}
     */
    interface Guard {
        (message: any, context: IContext): boolean;
    }
    /**
     * Type signature for methods used to select the outbound transition from a given type of vertex.
     * @param transitions {Array<Transition>} The set of transitions to evaluage.
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     */
    interface Selector {
        (transitions: Array<Transition>, message: any, context: IContext): Transition;
    }
    /**
     * Type signature for an action performed durin Transitions.
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
     */
    interface Behavior extends Array<Action> {
    }
    /**
     * Interface for the state machine context; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
     */
    interface IContext {
        /**
         * Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
         */
        isTerminated: boolean;
        /**
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        /**
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }
    /**
     * An abstract class that can be used as the base for any elmeent with a state machine.
     */
    class Element {
        name: string;
        /**
         * The symbol used to seperate element names within a fully qualified name.
         */
        static namespaceSeperator: string;
        leave: Behavior;
        beginEnter: Behavior;
        endEnter: Behavior;
        enter: Behavior;
        /**
         * Creates an new instance of an Element.
         * @param name {string} The name of the element.
         * @param element {Element} the parent element of this element.
         */
        constructor(name: string);
        /**
         * Returns the elements immediate parent element.
         * @returns {Element}
         */
        parent(): Element;
        /**
         * Returns the state machine that this element forms a part of.
         * @returns {StateMachine}
         */
        root(): StateMachine;
        /**
         * Returns the ancestry of elements from the root state machine this element.
         * @returns {Array<Element}}
         */
        ancestors(): Array<Element>;
        reset(): void;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        /**
         * Returns a the element name as a fully qualified namespace.
         */
        toString(): string;
    }
    /**
     * An element within a state machine model that is a container of Vertices.
     */
    class Region extends Element {
        state: State;
        /**
         * Name given to regions thare are created automatically when a state is passed as a vertex's parent.
         */
        static defaultName: string;
        /**
         * The set of child vertices under this region.
         */
        vertices: Array<Vertex>;
        /**
         * The pseudo state used as the initial stating vertex when entering the region.
         */
        initial: PseudoState;
        /**
         * Creates a new instance of the region class.
         * @param name {string} The name of the region.
         * @param state {State} The parent state that the new region is a part of.
        */
        constructor(name: string, state: State);
        /**
         * Returns the elements immediate parent element.
         * @returns {Element}
         */
        parent(): Element;
        /**
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
     * An element within a state machine model that can be the source or target of a transition.
     */
    class Vertex extends Element {
        /**
         * The parent region that this vertex belongs to.
         */
        region: Region;
        private transitions;
        private selector;
        /**
         * Creates a new instance of the Vertex class.
         * @constructor
         * @param name {string} The name of the vertex.
         * @param region {Region} The parent region that owns the vertex.
         * @param selector {Selector} The method used to select a transition for a given message.
         */
        constructor(name: string, region: Region, selector: Selector);
        /**
         * Creates a new instance of the Vertex class.
         * @constructor
         * @param name {string} The name of the vertex.
         * @param state {State} The parent state that owns the vertex.
         * @param selector {Selector} The method used to select a transition for a given message.
         */
        constructor(name: string, state: State, selector: Selector);
        /**
         * Returns the elements immediate parent element.
         * @returns {Element}
         */
        parent(): Element;
        /**
         * True if the vertex is a final vertex that has no outbound transitions.
         * @returns {boolean}
         */
        isFinal(): boolean;
        /**
         * True of the vertex is deemed to be complete; always true for pseuso states and simple states, true for composite states whose child regions all are complete.
         */
        isComplete(context: IContext): boolean;
        /**
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
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    class PseudoState extends Vertex {
        /**
         * The specific kind of the pesudo state that drives its behaviour.
         */
        kind: PseudoStateKind;
        /**
         * Creates a new instance of the PseudoState class.
         * @constructor
         * @param name {string} The name of the pseudo state.
         * @param region {Region} The parent region that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, region: Region, kind: PseudoStateKind);
        /**
         * Creates a new instance of the PseudoState class.
         * @constructor
         * @param name {string} The name of the pseudo state.
         * @param state {State} The parent state that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, state: State, kind: PseudoStateKind);
        /**
         * True if the pseudo state is one of the history kinds (DeepHistory or ShallowHistory).
         * @returns {boolean}
         */
        isHistory(): boolean;
        /**
         * True if the pseudo state is one of the initial kinds (Initial, DeepHistory or ShallowHistory).
         * @returns {boolean}
         */
        isInitial(): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
    }
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     */
    class State extends Vertex {
        private static selector(transitions, message, context);
        regions: Array<Region>;
        private exitBehavior;
        private entryBehavior;
        constructor(name: string, element: Region);
        constructor(name: string, element: State);
        defaultRegion(): Region;
        exit<TMessage>(exitAction: Action): State;
        entry<TMessage>(entryAction: Action): State;
        isSimple(): boolean;
        isComposite(): boolean;
        isOrthogonal(): boolean;
        bootstrap(deepHistoryAbove: boolean): void;
        bootstrapTransitions(): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     */
    class FinalState extends State {
        constructor(name: string, element: Region);
        constructor(name: string, element: State);
        to(target?: Vertex): Transition;
    }
    /**
     * An element within a state machine model that represents the root of the state machine model.
     */
    class StateMachine extends State {
        clean: boolean;
        constructor(name: string);
        /**
         * Returns the state machine that this element forms a part of.
         * @returns {StateMachine}
         */
        root(): StateMachine;
        bootstrap(deepHistoryAbove: boolean): void;
        initialise(context: IContext, autoBootstrap?: boolean): void;
        evaluate(message: any, context: IContext): boolean;
    }
    /**
     * An element within a state machine model that represents a valid transition between vertices in response to a message.
     */
    class Transition {
        private source;
        private target;
        static isElse: Guard;
        guard: Guard;
        private transitionBehavior;
        traverse: Behavior;
        constructor(source: Vertex, target?: Vertex);
        completion(): Transition;
        else(): Transition;
        when(guard: Guard): Transition;
        effect<TMessage>(transitionAction: Action): Transition;
        bootstrap(): void;
    }
    /**
     * Default working implementation of a state machine context class.
     */
    class Context implements IContext {
        isTerminated: boolean;
        private last;
        setCurrent(region: Region, state: State): void;
        getCurrent(region: Region): State;
    }
}
