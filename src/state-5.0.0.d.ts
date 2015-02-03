declare module state {
    /**
     * Enumeration describing the various types of PseudoState allowed.
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
     */
    interface Guard {
        (message: any, context: IContext): Boolean;
    }
    /**
     * Type signature for an action performed durin Transitions.
     */
    interface Action {
        (message: any, context: IContext, history: Boolean): any;
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
        isTerminated: Boolean;
        setCurrent(region: Region, value: State): void;
        getCurrent(region: Region): State;
    }
    /**
     * An abstract class that can be used as the base for any elmeent with a state machine.
     */
    class Element {
        name: string;
        static namespaceSeperator: string;
        root: StateMachine;
        leave: Behavior;
        beginEnter: Behavior;
        endEnter: Behavior;
        enter: Behavior;
        parent: () => Element;
        constructor(name: string, element: Element);
        ancestors(): Array<Element>;
        reset(): void;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        toString(): string;
    }
    /**
     * An element within a state machine model that is a container of Vertices.
     */
    class Region extends Element {
        state: State;
        static defaultName: string;
        vertices: Array<Vertex>;
        initial: PseudoState;
        constructor(name: string, state: State);
        isComplete(context: IContext): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        evaluate(message: any, context: IContext): Boolean;
    }
    /**
     * An element within a state machine model that can be the source or target of a transition.
     */
    class Vertex extends Element {
        region: Region;
        private transitions;
        private selector;
        constructor(name: string, element: Region, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition);
        constructor(name: string, element: State, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition);
        to(target?: Vertex): Transition;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        evaluateCompletions(message: any, context: IContext, history: Boolean): void;
        isFinal(): Boolean;
        isComplete(context: IContext): Boolean;
        evaluate(message: any, context: IContext): Boolean;
    }
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    class PseudoState extends Vertex {
        kind: PseudoStateKind;
        constructor(name: string, element: Region, kind: PseudoStateKind);
        constructor(name: string, element: State, kind: PseudoStateKind);
        isHistory(): Boolean;
        isInitial(): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
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
        isSimple(): Boolean;
        isComposite(): Boolean;
        isOrthogonal(): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: Element): void;
        evaluate(message: any, context: IContext): Boolean;
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
        clean: Boolean;
        constructor(name: string);
        bootstrap(deepHistoryAbove: Boolean): void;
        initialise(context: IContext, autoBootstrap?: boolean): void;
        evaluate(message: any, context: IContext): Boolean;
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
        isTerminated: Boolean;
        private last;
        setCurrent(region: Region, value: State): void;
        getCurrent(region: Region): State;
    }
}
