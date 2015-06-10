declare module StateJS {
    interface Guard {
        (message?: any, instance?: IActiveStateConfiguration): boolean;
    }
}
declare module StateJS {
    interface Action {
        (message?: any, instance?: IActiveStateConfiguration, history?: boolean): any;
    }
}
declare module StateJS {
    enum PseudoStateKind {
        Initial = 0,
        ShallowHistory = 1,
        DeepHistory = 2,
        Choice = 3,
        Junction = 4,
        Terminate = 5,
    }
}
declare module StateJS {
    class Element {
        static namespaceSeparator: string;
        name: string;
        qualifiedName: string;
        constructor(name: string);
        getParent(): Element;
        getRoot(): StateMachine;
        ancestors(): Array<Element>;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
        toString(): string;
    }
}
declare module StateJS {
    class Region extends Element {
        static defaultName: string;
        state: State;
        vertices: Array<Vertex>;
        initial: PseudoState;
        constructor(name: string, state: State);
        getParent(): Element;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    class Vertex extends Element {
        region: Region;
        transitions: Array<Transition>;
        constructor(name: string, parent: Region);
        constructor(name: string, parent: State);
        getParent(): Element;
        to(target?: Vertex): Transition;
    }
}
declare module StateJS {
    class PseudoState extends Vertex {
        kind: PseudoStateKind;
        constructor(name: string, parent: Region, kind: PseudoStateKind);
        constructor(name: string, parent: State, kind: PseudoStateKind);
        isHistory(): boolean;
        isInitial(): boolean;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    class State extends Vertex {
        exitBehavior: Array<Action>;
        entryBehavior: Array<Action>;
        regions: Array<Region>;
        constructor(name: string, parent: Region);
        constructor(name: string, parent: State);
        defaultRegion(): Region;
        isFinal(): boolean;
        isSimple(): boolean;
        isComposite(): boolean;
        isOrthogonal(): boolean;
        exit<TMessage>(exitAction: Action): State;
        entry<TMessage>(entryAction: Action): State;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    class FinalState extends State {
        constructor(name: string, parent: Region);
        constructor(name: string, parent: State);
        to(target?: Vertex): Transition;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    class StateMachine extends State {
        clean: boolean;
        onInitialise: Array<Action>;
        logger: Console;
        constructor(name: string);
        getRoot(): StateMachine;
        setLogger(value?: Console): StateMachine;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    class Transition {
        source: Vertex;
        target: Vertex;
        static isElse: () => boolean;
        guard: Guard;
        transitionBehavior: Array<Action>;
        traverse: Array<Action>;
        constructor(source: Vertex, target?: Vertex);
        else(): Transition;
        when(guard: Guard): Transition;
        effect<TMessage>(transitionAction: Action): Transition;
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
    class Visitor<TArg1> {
        visitElement(element: Element, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitRegion(region: Region, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitVertex(vertex: Vertex, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitPseudoState(pseudoState: PseudoState, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitState(state: State, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitFinalState(finalState: FinalState, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitStateMachine(stateMachine: StateMachine, arg1?: TArg1, arg2?: any, arg3?: any): any;
        visitTransition(transition: Transition, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    interface IActiveStateConfiguration {
        isTerminated: boolean;
        setCurrent(region: Region, state: State): void;
        getCurrent(region: Region): State;
    }
}
declare module StateJS {
    class StateMachineInstance implements IActiveStateConfiguration {
        name: string;
        private last;
        isTerminated: boolean;
        constructor(name?: string);
        setCurrent(region: Region, state: State): void;
        getCurrent(region: Region): State;
        toString(): string;
    }
}
declare module StateJS {
    function initialise(stateMachineModel: StateMachine, stateMachineInstance?: IActiveStateConfiguration, autoInitialiseModel?: boolean): void;
    function evaluate(stateMachineModel: StateMachine, stateMachineInstance: IActiveStateConfiguration, message: any, autoInitialiseModel?: boolean): boolean;
    function isComplete(vertex: Vertex, stateMachineInstance: IActiveStateConfiguration): boolean;
}
declare var module: any;
