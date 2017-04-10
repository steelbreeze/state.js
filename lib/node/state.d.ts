// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export declare type Logger = {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
};
export declare let logger: Logger;
export declare function setLogger(newLogger: Logger): Logger;
export declare type Random = (max: number) => number;
export declare let random: Random;
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
export interface IElement {
    parent: IElement;
    name: string;
}
export declare abstract class Element<TParent extends IElement> implements IElement {
    readonly name: string;
    readonly parent: TParent;
    static namespaceSeparator: string;
    readonly qualifiedName: string;
    protected constructor(name: string, parent: TParent);
    toString(): string;
}
/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex}. */
export declare class Region extends Element<State | StateMachine> implements IElement {
    static defaultName: string;
    readonly children: Vertex[];
    constructor(name: string, parent: State | StateMachine);
    /** @ignore */ invalidate(): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** The source or target of a [[Transition]] within a [[StateMachine]] model. A vertex can be either a [[State]] or a [[PseudoState]]. */
export declare class Vertex extends Element<Region> {
    readonly outgoing: Transition[];
    readonly incoming: Transition[];
    protected constructor(name: string, parent: Region | State | StateMachine);
    /** @ignore */ invalidate(): void;
    to(target?: Vertex, kind?: TransitionKind): Transition;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** A [[Vertex]] in a [[StateMachine]] machine model that has the form of a state but does not behave as a full state; it is always transient; it may be the source or target of transitions but has no entry or exit behavior */
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    isHistory(): boolean;
    isInitial(): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
}
export declare class State extends Vertex {
    readonly children: Region[];
    /** @ignore */ readonly entryBehavior: Actions;
    /** @ignore */ readonly exitBehavior: Actions;
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
export declare class StateMachine implements IElement {
    readonly name: string;
    readonly parent: any;
    readonly children: Region[];
    private clean;
    private onInitialise;
    constructor(name: string);
    /** @ignore */ invalidate(): void;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    initialise(instance?: IInstance): void;
    evaluate(instance: IInstance, ...message: Array<any>): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
    toString(): string;
}
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    private static Else;
    /** @ignore */ effectBehavior: Actions;
    /** @ignore */ onTraverse: Actions;
    private guard;
    /**
     *
     * @param source
     * @param target
     * @param kind The [kind]{@link TransitionKind} of the transition that defines its transition semantics. Note that the kind is validated and overriden if necessary.
     */
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    isElse(): boolean;
    else(): this;
    when(guard: Guard): this;
    effect(action: Behavior): this;
    evaluate(instance: IInstance, ...message: Array<any>): boolean;
    accept(visitor: Visitor, ...args: Array<any>): void;
    toString(): string;
}
export declare class Visitor {
    visitElement(element: IElement, ...args: Array<any>): void;
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
