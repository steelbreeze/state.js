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
export declare type Guard = (instance: IInstance, ...message: Array<any>) => boolean;
export declare type Behavior = (instance: IInstance, ...message: Array<any>) => any;
export declare type Actions = Array<(instance: IInstance, deepHistory: boolean, ...message: Array<any>) => any>;
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
export declare abstract class Element<TParent extends Tree.INode, TChildren extends Tree.INode> implements Tree.Node<TParent, TChildren> {
    readonly name: string;
    readonly parent: TParent;
    static namespaceSeparator: string;
    readonly children: TChildren[];
    readonly qualifiedName: string;
    protected constructor(name: string, parent: TParent);
    toString(): string;
}
export declare class Region extends Element<State | StateMachine, Vertex> {
    static defaultName: string;
    constructor(name: string, parent: State | StateMachine);
    invalidate(): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
export declare class Vertex extends Element<Region, Region> {
    readonly outgoing: Transition[];
    readonly incoming: Transition[];
    constructor(name: string, parent: Region | State | StateMachine);
    invalidate(): void;
    to(target?: Vertex, kind?: TransitionKind): Transition;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    isHistory(): boolean;
    isInitial(): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
export declare class State extends Vertex {
    static defaultRegion(state: State | StateMachine): Region;
    readonly entryBehavior: Actions;
    readonly exitBehavior: Actions;
    isFinal(): boolean;
    isSimple(): boolean;
    isComposite(): boolean;
    isOrthogonal(): boolean;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    exit(action: Behavior): this;
    entry(action: Behavior): this;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
export declare class StateMachine {
    readonly name: string;
    readonly parent: undefined;
    readonly children: Region[];
    private clean;
    onInitialise: Actions;
    constructor(name: string);
    invalidate(): void;
    accept(visitor: Visitor, ...args: Array<any>): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    initialise(instance?: IInstance): void;
    evaluate(instance: IInstance, ...message: Array<any>): boolean;
    toString(): string;
}
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    static Else: Guard;
    effectBehavior: Actions;
    onTraverse: Actions;
    guard: Guard;
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    else(): this;
    when(guard: Guard): this;
    effect(action: Behavior): this;
    accept(visitor: Visitor, ...args: Array<any>): void;
    toString(): string;
}
export declare class Visitor {
    visitElement(element: StateMachine | Region | Vertex, ...args: Array<any>): void;
    visitRegion(region: Region, ...args: Array<any>): void;
    visitVertex(vertex: Vertex, ...args: Array<any>): void;
    visitPseudoState(pseudoState: PseudoState, ...args: Array<any>): void;
    visitState(state: State, ...args: Array<any>): void;
    visitStateMachine(stateMachine: StateMachine, ...args: Array<any>): void;
    visitTransition(transition: Transition, ...args: Array<any>): void;
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
