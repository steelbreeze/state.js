// Type definitions for state.js
// Project: state,js
// Definitions by: David Mesquita-Morris <http://state.software>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import * as Tree from "./tree";
/** Type signature for logging; this type signature allows for the default console to be used. */
export declare type Logger = {
    log(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
};
/** The object used for loggin error messages. By default, log messages are ignored and errors throw exceptions. */
export declare let logger: Logger;
/**
 * Replace the default logger with custom logging.
 * @param newLogger An object to send log and error messages to. This must implement the [[Logger]] type.
 * @returns Returns the previous implementation of the logger.
 */
export declare function setLogger(newLogger: Logger): Logger;
/** Type signature for random number generation. */
export declare type Random = (max: number) => number;
/** Random number generation method. */
export declare let random: Random;
/**
 * Sets the random number generation method.
 * @param newRandom A method to generate random numbers. This must conform to the [[Random]] type.
 * @returns Returns the previous implementation of the random number generator.
 */
export declare function setRandom(newRandom: Random): Random;
/** Flag to control completion transition behaviour of internal transitions. */
export declare var internalTransitionsTriggerCompletion: boolean;
/**
 * Change completion transition behaviour of internal transitions.
 * @param value True to have internal transitions triggering completin transitions.
 */
export declare function setInternalTransitionsTriggerCompletion(value: boolean): void;
/** Prototype of transition guard condition callbacks. */
export declare type Guard = (message: any, instance: IInstance) => boolean;
/** Prototype of state and transition behavior callbacks. */
export declare type Action = (message: any, instance: IInstance, deepHistory?: boolean) => void;
/** Class that the behavior built up for state transitions. */
export declare class Actions {
    /** Container for all the behaviour. */
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
/** An enumeration used to dictate the behavior of instances of the [[PseudoState]] class. Use these constants as the `kind` parameter when creating new [[PseudoState]] instances. */
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
/** Common interface for all nodes within a state machine model. */
export interface IElement extends Tree.INode {
    /** Returns the root [[StateMachine]] [[Element]]. */
    getRoot(): StateMachine;
    /**
     * Determines if an [[Element]] is currently active for a given state machine instance.
     * @param instance The state machin instance.
     * @returns Returs true if the [[Element]] is active within the given state machine instance.
     */
    isActive(instance: IInstance): boolean;
}
/** Common base class for all nodes within a state machine model that have a name. */
export declare abstract class Element<TElement extends IElement> implements IElement, Tree.Node<TElement> {
    readonly name: string;
    readonly parent: TElement;
    /** The string used to seperate [[Element]]s within a fully qualifiedName; this may be updated if required. */
    static namespaceSeparator: string;
    /** The fully qualified name of the [[Element]]. */
    readonly qualifiedName: string;
    /**
     * Creates a new instance of the [[NamedElement]].
     * @param name The name of the [[NamedElement]].
     * @param parent The parent [[NamedElement]] of this [[NamedElement]].
     */
    protected constructor(name: string, parent: TElement);
    /** Returns the root [[StateMachine]] element. */
    getRoot(): StateMachine;
    /**
     * Determines if an [[Element]] is currently active for a given state machine instance.
     * @param instance The state machine instance.
     * @returns Returs true if the [[Element]] is active within the given state machine instance.
     */
    isActive(instance: IInstance): boolean;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    /** Returns the name of the [[Element]]. */
    toString(): string;
}
/** A [[Region]] is a container of [[Vertex]] instances within a state machine hierarchy. [[Region]] instances will be injected automatically when creating composite [[State]]s; alternatively, then may be created explicitly. */
export declare class Region extends Element<State | StateMachine> {
    /** The default name for automatically created [[Region]] instances. */
    static defaultName: string;
    /** The child [[Vertex]] instances that are the children of this [[Region]]. */
    readonly children: Vertex[];
    /**
     * Creates a new instance of the [[Region]] class.
     * @param name The short name for the [[Region]] instance; this will form part of fully qualified names of child [[Vertex]] and [[Region]] instances.
     * @param parent The parent [[State]] or [[StateMachine]] instance.
     */
    constructor(name: string, parent: State | StateMachine);
    /**
     * Tests a state machine instance to see if a specific [[Region]] is deemed to be complete; having been entered and exited.
     * @param The state machine instance.
     * @returns True if the [[Region]] is complete for the given state machine instance.
     */
    isComplete(instance: IInstance): boolean;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
/** Represents a node with the graph that forms one part of a state machine model. */
export declare class Vertex extends Element<Region> {
    readonly outgoing: Transition[];
    readonly incoming: Transition[];
    constructor(name: string, parent: Region | State | StateMachine);
    to(target?: Vertex, kind?: TransitionKind): Transition;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    isHistory(): boolean;
    isInitial(): boolean;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class State extends Vertex {
    readonly children: Region[];
    readonly entryBehavior: Actions;
    readonly exitBehavior: Actions;
    getDefaultRegion(): Region;
    isFinal(): boolean;
    isSimple(): boolean;
    isComposite(): boolean;
    isOrthogonal(): boolean;
    /**
     * Determines if an [[Element]] is currently active for a given state machine instance.
     * @param instance The state machine instance.
     * @returns Returs true if the [[Element]] is active within the given state machine instance.
     */
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    exit(action: Action): this;
    entry(action: Action): this;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
}
export declare class StateMachine implements IElement {
    readonly name: string;
    readonly children: Region[];
    clean: boolean;
    readonly onInitialise: Actions;
    readonly parent: undefined;
    constructor(name: string);
    getDefaultRegion(): Region;
    /** Returns the root [[StateMachine]] element. */
    getRoot(): StateMachine;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
    accept<TArg>(visitor: Visitor<TArg>, arg?: TArg): void;
    /**
     * Determines if an [[Element]] is currently active for a given state machine instance.
     * @param instance The state machine instance.
     * @returns Returs true if the [[Element]] is active within the given state machine instance.
     */
    isActive(instance: IInstance): boolean;
    isComplete(instance: IInstance): boolean;
    initialise(instance?: IInstance, autoInitialiseModel?: boolean): void;
    evaluate(instance: IInstance, message: any, autoInitialiseModel?: boolean): boolean;
    /** Returns the name of the [[Element]]. */
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
    effect(action: Action): this;
    /**
     * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
     * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
     * @param visitor The [[Visitor]] instance.
     * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
     */
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
