// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export declare enum PseudoStateKind {
    Choice = 0,
    DeepHistory = 1,
    Initial = 2,
    Junction = 3,
    ShallowHistory = 4,
}
export declare enum TransitionKind {
    External = 0,
    Internal = 1,
    Local = 2,
}
export interface Element {
    getRoot(): StateMachine;
    toString(): string;
}
export declare abstract class NamedElement<TParent extends Element> implements Element {
    readonly name: string;
    readonly parent: TParent;
    static namespaceSeparator: string;
    readonly qualifiedName: string;
    protected constructor(name: string, parent: TParent);
    getRoot(): StateMachine;
    toString(): string;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class Region extends NamedElement<State | StateMachine> {
    static defaultName: string;
    readonly vertices: Vertex[];
    constructor(name: string, parent: State | StateMachine);
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class Vertex extends NamedElement<Region> {
    readonly outgoing: Transition[];
    readonly incoming: Transition[];
    constructor(name: string, parent: Region | State | StateMachine);
    to(target?: Vertex, kind?: TransitionKind): Transition;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class State extends Vertex {
    readonly regions: Region[];
    defaultRegion: Region;
    constructor(name: string, parent: Region | State | StateMachine);
    getDefaultRegion(): Region;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class StateMachine implements Element {
    readonly name: string;
    readonly regions: Region[];
    defaultRegion: Region | undefined;
    clean: boolean;
    constructor(name: string);
    getDefaultRegion(): Region;
    getRoot(): StateMachine;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    toString(): string;
}
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    guard: (message: any, instance: IInstance) => boolean;
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    when(guard: (message: any, instance: IInstance) => boolean): this;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class Visitor<TArg> {
    visitElement(element: Element, arg?: TArg): void;
    visitRegion(region: Region, arg?: TArg): void;
    visitVertex(vertex: Vertex, arg?: TArg): void;
    visitPseudoState(pseudoState: PseudoState, arg?: TArg): void;
    visitState(state: State, arg?: TArg): void;
    visitStateMachine(stateMachine: StateMachine, arg?: TArg): void;
    visitTransition(transition: Transition, arg?: TArg): void;
}
export interface IInstance {
    setCurrent(region: Region, state: State): void;
    getCurrent(region: Region): State;
}
