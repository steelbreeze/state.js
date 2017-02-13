// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/** The object used for log, warning and error messages. By default, log messages are ignored and errors throw exceptions. */
export declare let console: {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
};
/**
 * Replace the default console object to implement custom logging.
 * @param newConsole An object to send log, warning and error messages to. THis must implement log and error methods as per the global console object.
 */
export declare function setConsole(newConsole: {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
}): void;
/**Random number generation method. */
export declare let random: (max: number) => number;
/**
 * Sets the  random number generation method.
 * @param value A methos to generate random numbers.
 */
export declare function setRandom(value: (max: number) => number): void;
/** Flag to control completion transition behaviour of internal transitions. */
export declare var internalTransitionsTriggerCompletion: boolean;
/**
 * Change completion transition behaviour of internal transitions.
 * @param value True to have internal transitions triggering completin transitions.
 */
export declare function setInternalTransitionsTriggerCompletion(value: boolean): void;
/** Prototype of transition guard condition callbacks. */
export interface Guard {
    (message: any, instance: IInstance): boolean;
}
/** Prototype of state and transition beh callbacks. */
export interface Behavior {
    (message: any, instance: IInstance): void;
}
export interface Action {
    (message: any, instance: IInstance, deepHistory: boolean): void;
}
/** Class that the behavior built up for state transitions. */
export declare class Actions {
    private readonly actions;
    /**
     * Creates a new instance of the [[Action]] class.
     * @param actions An optional existing [[Action]] to seed the initial behavior from; use this when a copy constructor is required.
     */
    constructor(actions?: Actions);
    /**
     * Appends the [[Action]] with the contents of another [[Action]] or [[Action]].
     * @param action The [[Actions]] or [[Action]] to append.
     */
    push(action: Actions | Action): void;
    /**
     * Calls each [[Action]] in turn with the supplied parameters upon a state transtion.
     * @param message The message that caused the state transition.
     * @param instance The state machine instance.
     * @param deepHistory For internal use only.
     */
    invoke(message: any, instance: IInstance, deepHistory: boolean): void;
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
    readonly entryBehavior: Actions;
    readonly exitBehavior: Actions;
    defaultRegion: Region;
    constructor(name: string, parent: Region | State | StateMachine);
    getDefaultRegion(): Region;
    isFinal(): boolean;
    isSimple(): boolean;
    isComposite(): boolean;
    isOrthogonal(): boolean;
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    exit(action: Behavior): this;
    entry(action: Behavior): this;
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class StateMachine implements Element {
    readonly name: string;
    readonly regions: Region[];
    defaultRegion: Region | undefined;
    clean: boolean;
    readonly onInitialise: Actions;
    constructor(name: string);
    getDefaultRegion(): Region;
    getAncestors(): Array<Element>;
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
    readonly effectBehavior: Actions;
    readonly onTraverse: Actions;
    guard: Guard;
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
