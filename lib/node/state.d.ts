// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import * as Tree from "./tree";
export declare type Logger = {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
};
export declare let logger: {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
};
export declare function setLogger(newLogger: Logger): Logger;
export declare type Random = (max: number) => number;
export declare let random: (max: number) => number;
export declare function setRandom(newRandom: Random): Random;
export declare var internalTransitionsTriggerCompletion: boolean;
export declare function setInternalTransitionsTriggerCompletion(value: boolean): boolean;
export declare type Guard = (message: any, instance: IInstance) => boolean;
export declare type Action = (message: any, instance: IInstance, deepHistory?: boolean) => any;
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
export interface IElement extends Tree.INode {
    getRoot(): StateMachine;
    isActive(instance: IInstance): boolean;
}
export declare abstract class Element<TParent extends IElement, TChildren extends IElement> implements IElement, Tree.Node<TParent, TChildren> {
    readonly name: string;
    readonly parent: TParent;
    static namespaceSeparator: string;
    readonly children: TChildren[];
    readonly qualifiedName: string;
    protected constructor(name: string, parent: TParent);
    getRoot(): StateMachine;
    isActive(instance: IInstance): boolean;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    toString(): string;
}
export declare class Region extends Element<State | StateMachine, Vertex> {
    static defaultName: string;
    constructor(name: string, parent: State | StateMachine);
    isComplete(instance: IInstance): boolean;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class Vertex extends Element<Region, Region> {
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
    static defaultRegion(state: State | StateMachine): Region;
    readonly entryBehavior: Action[];
    readonly exitBehavior: Action[];
    isFinal(): boolean;
    isSimple(): boolean;
    isComposite(): boolean;
    isOrthogonal(): boolean;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    exit(action: Action): this;
    entry(action: Action): this;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class StateMachine implements IElement {
    readonly name: string;
    readonly children: Region[];
    clean: boolean;
    onInitialise: Action[];
    readonly parent: undefined;
    constructor(name: string);
    getRoot(): StateMachine;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    initialise(instance?: IInstance, autoInitialiseModel?: boolean): void;
    evaluate(instance: IInstance, message: any, autoInitialiseModel?: boolean): boolean;
    toString(): string;
}
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    static Else: (message: any, instance: IInstance) => boolean;
    effectBehavior: Action[];
    onTraverse: Action[];
    guard: Guard;
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    else(): this;
    when(guard: Guard): this;
    effect(action: Action): this;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    toString(): string;
}
export declare class Visitor<TArg> {
    visitElement(element: IElement, arg?: TArg): void;
    visitRegion(region: Region, arg?: TArg): void;
    visitVertex(vertex: Vertex, arg?: TArg): void;
    visitPseudoState(pseudoState: PseudoState, arg?: TArg): void;
    visitState(state: State, arg?: TArg): void;
    visitStateMachine(stateMachine: StateMachine, arg?: TArg): void;
    visitTransition(transition: Transition, arg?: TArg): void;
}
export interface IInstance {
    setCurrent(region: Region, vertex: Vertex): void;
    getCurrent(region: Region): Vertex | undefined;
    getLastKnownState(region: Region): State | undefined;
}
export declare class DictionaryInstance implements IInstance {
    readonly name: string;
    readonly current: {
        [id: string]: Vertex;
    };
    readonly activeStateConfiguration: {
        [id: string]: State;
    };
    constructor(name: string);
    setCurrent(region: Region, vertex: Vertex): void;
    getCurrent(region: Region): Vertex | undefined;
    getLastKnownState(region: Region): State | undefined;
    toString(): string;
}
