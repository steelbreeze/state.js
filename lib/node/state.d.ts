// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export declare let random: (max: number) => number;
export declare function setRandom(value: (max: number) => number): void;
export interface Action {
    (message: any, instance: IInstance, deepHistory: boolean): void;
}
export interface Behavior {
    (message: any, instance: IInstance): void;
}
export interface Guard {
    (message: any, instance: IInstance): boolean;
}
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
    getAncestors(): Array<Element>;
    getRoot(): StateMachine;
    isActive(instance: IInstance): boolean;
    toString(): string;
}
export declare abstract class NamedElement<TParent extends Element> implements Element {
    readonly name: string;
    readonly parent: TParent;
    static namespaceSeparator: string;
    readonly qualifiedName: string;
    protected constructor(name: string, parent: TParent);
    getAncestors(): Array<Element>;
    getRoot(): StateMachine;
    isActive(instance: IInstance): boolean;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    toString(): string;
}
export declare class Region extends NamedElement<State | StateMachine> {
    static defaultName: string;
    readonly vertices: Vertex[];
    constructor(name: string, parent: State | StateMachine);
    isComplete(instance: IInstance): boolean;
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
    isHistory(): boolean;
    isInitial(): boolean;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class State extends Vertex {
    readonly regions: Region[];
    defaultRegion: Region;
    entryBehavior: Behavior[];
    exitBehavior: Behavior[];
    constructor(name: string, parent: Region | State | StateMachine);
    getDefaultRegion(): Region;
    isFinal(): boolean;
    isSimple(): boolean;
    isComposite(): boolean;
    isOrthogonal(): boolean;
    exit(action: Behavior): this;
    enter(action: Behavior): this;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class StateMachine implements Element {
    readonly name: string;
    readonly regions: Region[];
    defaultRegion: Region | undefined;
    clean: boolean;
    onInitialise: Action[];
    constructor(name: string);
    getDefaultRegion(): Region;
    getAncestors(): Array<Element>;
    getRoot(): StateMachine;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    initialise(instance?: IInstance, autoInitialiseModel?: boolean): void;
    toString(): string;
}
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    guard: Guard;
    effectBehavior: Behavior[];
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    else(): this;
    when(guard: Guard): this;
    effect(action: Behavior): this;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    toString(): string;
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
    getCurrent(region: Region): State | undefined;
}
export declare class DictionaryInstance implements IInstance {
    readonly name: string;
    readonly activeStateConfiguration: {
        [id: string]: State;
    };
    constructor(name: string);
    setCurrent(region: Region, state: State): void;
    getCurrent(region: Region): State | undefined;
    toString(): string;
}
