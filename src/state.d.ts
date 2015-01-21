declare module FSM {
    enum PseudoStateKind {
        Choice = 0,
        DeepHistory = 1,
        Initial = 2,
        Junction = 3,
        ShallowHistory = 4,
        Terminate = 5,
    }
    interface Guard {
        (message: any, context: IContext): Boolean;
    }
    interface Action {
        (message: any, context: IContext, history: Boolean): any;
    }
    interface Behavior extends Array<Action> {
    }
    interface IContext {
        isTerminated: Boolean;
        setCurrent(region: Region, value: State): void;
        getCurrent(region: Region): State;
    }
    class Context implements IContext {
        isTerminated: Boolean;
        setCurrent(region: StateMachineElement, value: State): void;
        getCurrent(region: StateMachineElement): any;
    }
    class NamedElement {
        name: string;
        static namespaceSeperator: string;
        qualifiedName: string;
        constructor(name: string, element: NamedElement);
        toString(): String;
    }
    class StateMachineElement extends NamedElement {
        root: StateMachine;
        leave: Behavior;
        beginEnter: Behavior;
        endEnter: Behavior;
        enter: Behavior;
        constructor(name: string, parentElement: StateMachineElement);
        parent(): StateMachineElement;
        ancestors(): StateMachineElement[];
        reset(): void;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: StateMachineElement): void;
    }
    class Vertex extends StateMachineElement {
        region: Region;
        transitions: Transition[];
        selector: (transitions: Transition[], message: any, context: IContext) => Transition;
        constructor(name: string, region: Region, selector: (transitions: Transition[], message: any, context: IContext) => Transition);
        parent(): StateMachineElement;
        To(target?: Vertex): Transition;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        evaluateCompletions(message: any, context: IContext, history: Boolean): void;
        isFinal(): Boolean;
        isComplete(context: IContext): Boolean;
        evaluate(message: any, context: IContext): Boolean;
    }
    class Region extends StateMachineElement {
        state: State;
        static defaultName: string;
        vertices: Vertex[];
        initial: PseudoState;
        constructor(name: string, state: State);
        parent(): StateMachineElement;
        isComplete(context: IContext): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        evaluate(message: any, context: IContext): Boolean;
    }
    class PseudoState extends Vertex {
        kind: PseudoStateKind;
        constructor(name: string, region: Region, kind: PseudoStateKind);
        isHistory(): Boolean;
        isInitial(): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
    }
    class State extends Vertex {
        private static selector(transitions, message, context);
        regions: Region[];
        private exitBehavior;
        private entryBehavior;
        constructor(name: string, region: Region);
        exit<TMessage>(exitAction: Action): State;
        entry<TMessage>(entryAction: Action): State;
        isFinal(): Boolean;
        isSimple(): Boolean;
        isComposite(): Boolean;
        isOrthogonal(): Boolean;
        bootstrap(deepHistoryAbove: Boolean): void;
        bootstrapTransitions(): void;
        bootstrapEnter(add: (additional: Behavior) => void, next: StateMachineElement): void;
        evaluate(message: any, context: IContext): Boolean;
    }
    class FinalState extends State {
        constructor(name: string, region: Region);
        isFinal(): Boolean;
    }
    class StateMachine extends State {
        clean: Boolean;
        constructor(name: string);
        bootstrap(deepHistoryAbove: Boolean): void;
        initialise(context: IContext, autoBootstrap?: boolean): void;
    }
    class Transition {
        private source;
        private target;
        static isElse: Guard;
        guard: Guard;
        transitionBehavior: Behavior;
        traverse: Behavior;
        constructor(source: Vertex, target?: Vertex);
        completion(): Transition;
        else(): Transition;
        when<TMessage>(guard: Guard): Transition;
        effect<TMessage>(transitionAction: Action): Transition;
        bootstrap(): void;
    }
}
