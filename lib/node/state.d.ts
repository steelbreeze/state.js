/**
 * Type definitions for state.js
 * Project: state.js
 * Definitions by: David Mesquita-Morris <http://state.software>
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

/** Interface used by state.js for managing log and error messages. */
export interface ILogger {
    /**
     * Passes a log (informational) message.
     * @param message Any number of objects constituting the log message.
     */
    log(message?: any, ...optionalParams: any[]): void;
    /**
     * Passes an erorr message.
     * @param message Any number of objects constituting the error message.
     */
    error(message?: any, ...optionalParams: any[]): void;
}
/**
 * Overrides the current logging object.
 * @param value An object to pass log and error messages to.
 * @returns Returns the previous logging object in use.
 */
export declare function setLogger(value: ILogger): ILogger;
/**
 * Sets a custom random number generator for state.js.
 *
 * The default implementation uses [Math.floor(Math.random() * max)]{@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random}.
 * @param value The new method to generate random numbers.
 * @return Returns the previous random number generator in use.
 */
export declare function setRandom(value: (max: number) => number): (max: number) => number;
/**
 * Sets a flag controlling completion transition behavior for internal transitions.
 * @param value True to have internal transitions trigger completion transitions.
 * @return Returns the previous setting in use.
 */
export declare function setInternalTransitionsTriggerCompletion(value: boolean): boolean;
/**
 * Sets the symbol used as the delimiter in fully qualified element names.
 * @param value The symbol used as the delimiter in fully qualified element names.
 * @return Returns the previous symbol used as the delimiter in fully qualified element names.
 */
export declare function setNamespaceSeparator(value: string): string;
/**
 * The callback prototype for [state machine]{@link StateMachine} [transition]{@link Transition} guard conditions.
 * @param instance The [state machine instance]{@link IInstance} to test the [transition]{@link Transition} guard condition against.
 * @param message The message to test the [transition]{@link Transition} guard condition against.
 */
export declare type Guard = (instance: IInstance, ...message: Array<any>) => boolean;
/**
 * The callback prototype for [state machine]{@link StateMachine} behavior during a state transition; used in [state]{@link State} entry, exit and [transition]{@link Transition} effect.
 * @param instance The [state machine instance]{@link IInstance} that the [transition]{@link Transition} is causing a state transition in.
 * @param message The message that caused the state transition.
 */
export declare type Behavior = (instance: IInstance, ...message: Array<any>) => any;
/**
 * The callback prototype for internal actions used in state transition compilation.
 * @hidden
 */
export interface Action {
    (instance: IInstance, deepHistory: boolean, ...message: Array<any>): any;
}
/**
 * Enumeration used to define the semantics of [pseudo states]{@link PseudoState}.
 */
export declare enum PseudoStateKind {
    /*** Turns the [pseudo state]{@link PseudoState} into a dynamic conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated after the transition into the [pseudo state]{@link PseudoState} is traversed. */
    Choice = 0,
    /** Turns on deep history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will cascade through all child [regions]{@link Region}. */
    DeepHistory = 1,
    /*** Turns the [pseudo state]{@link PseudoState} into an initial [vertex]{@link Vertex}, meaning is is the default point when the parent [region]{@link Region} is entered. */
    Initial = 2,
    /*** Turns the [pseudo state]{@link PseudoState} into a static conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated before the transition into the [pseudo state]{@link PseudoState} is traversed. */
    Junction = 3,
    /** Turns on shallow history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will only apply to the parent [region]{@link Region}. */
    ShallowHistory = 4,
}
/**
 * Enumeration used to define the semantics of [transitions]{@link Transition}.
 */
export declare enum TransitionKind {
    /** An external [transition]{@link Transition} is the default transition type; the source [vertex]{@link Vertex} is exited, [transition]{@link Transition} behavior called and target [vertex]{@link Vertex} entered. Where the source and target [vertices]{@link Vertex} are in different parent [regions]{@link Region} the source ancestry is exited up to but not including the least common ancestor; likewise the targe ancestry is enterd. */
    External = 0,
    /**
     * An internal [transition]{@link Transition} executes without exiting or entering the [state]{@link State} in which it is defined.
     * @note The target vertex of an internal [transition]{@link Transition} must be undefined.
     */
    Internal = 1,
    /** A local [transition]{@link Transition} is one where the target [vertex]{@link Vertex} is a child of the source [vertex]{@link Vertex}; the source [vertex]{@link Vertex} is not exited. */
    Local = 2,
}
/**
 * Common properties of all elements that make up a [state machine model]{@link StateMachine}.
 */
export interface IElement {
    /** The parent [element]{@link Element} of this element. */
    parent: IElement;
    /** The name of this element. */
    name: string;
}
/**
 * Common base class for [regions]{@link Region} and [vertices]{@link Vertex} within a [state machine model]{@link StateMachine}.
 * @param TParent The type of the element's parent.
 */
export declare abstract class Element<TParent extends IElement> implements IElement {
    readonly name: string;
    readonly parent: TParent;
    /** The fully qualified name of a [region]{@link Region} or [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}. */
    readonly qualifiedName: string;
    /**
     * Creates a new instance of the [[Element]] class.
     * @param name The name of this [element]{@link Element}.
     * @param parent The parent [element]{@link Element} of this [element]{@link Element}.
     */
    protected constructor(name: string, parent: TParent);
    /** Returns the fully qualified name of the [element]{@link Element}. */
    toString(): string;
}
/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex} and has no behavior associated with it. */
export declare class Region extends Element<State | StateMachine> implements IElement {
    /** The default for [regions]{@link Region} when they are implicitly created; this may be overriden. */
    static defaultName: string;
    /** The child [vertices]{@link Vertex} of this [region]{@link Region}. */
    readonly children: Vertex[];
    /**
     * Creates a new instance of the [[Region]] class.
     * @param name The name of this [element]{@link Element}.
     * @param parent The parent [element]{@link Element} of this [element]{@link Element}.
     */
    constructor(name: string, parent: State | StateMachine);
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    invalidate(): void;
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is active. A [region]{@link Region} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    isActive(instance: IInstance): boolean;
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is complete. A [region]{@link Region} is complete when it's current active [state]{@link State} is a [final state]{@link State.isFinal} (one that has no outbound [transitions]{@link Transition}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    isComplete(instance: IInstance): boolean;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** The source or target of a [transition]{@link Transition} within a [state machine model]{@link StateMachine}. A vertex can be either a [[State]] or a [[PseudoState]]. */
export declare abstract class Vertex extends Element<Region> {
    /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the source of. */
    readonly outgoing: Transition[];
    /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the target of. */
    readonly incoming: Transition[];
    /**
     * Creates a new instance of the [[Vertex]] class.
     * @param name The name of this [vertex]{@link Vertex}.
     * @param parent The parent [element]{@link Element} of this [vertex]{@link Vertex}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    protected constructor(name: string, parent: Region | State | StateMachine);
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    invalidate(): void;
    /**
     * Creates a new [transition]{@link Transition} from this [vertex]{@link Vertex}.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    to(target?: Vertex, kind?: TransitionKind): Transition;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** A [vertex]{@link Vertex} in a [state machine model]{@link StateMachine} that has the form of a [state]{@link State} but does not behave as a full [state]{@link State}; it is always transient; it may be the source or target of [transitions]{@link Transition} but has no entry or exit behavior. */
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    /**
     * Creates a new instance of the [[PseudoState]] class.
     * @param name The name of this [pseudo state]{@link PseudoState}.
     * @param parent The parent [element]{@link Element} of this [pseudo state]{@link PseudoState}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     * @param kind The semantics of this [pseudo state]{@link PseudoState}; see the members of the [pseudo state kind enumeration]{@link PseudoStateKind} for details.
     */
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    /**
     * Tests the [pseudo state]{@link PseudoState} to see if it is a history [pseudo state]{@link PseudoState}, one who's [kind]{@link PseudoStateKind} is [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}.
     * @returns Returns true if the [pseudo state]{@link PseudoState} to see if it is a history state.
     */
    isHistory(): boolean;
    /**
     * Tests the [pseudo state]{@link PseudoState} to see if it is an initial [pseudo state]{@link PseudoState}, one who's [kind]{@link PseudoStateKind} is [Initial]{@link PseudoStateKind.Initial}, [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}.
     * @returns Returns true if the [pseudo state]{@link PseudoState} to see if it is an initial state.
     */
    isInitial(): boolean;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** A condition or situation during the life of an object, represented by a [state machine model]{@link StateMachine}, during which it satisfies some condition, performs some activity, or waits for some event. */
export declare class State extends Vertex {
    /** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
    readonly children: Region[];
    /**
     * The state's entry behavior as defined by the user.
     * @hidden
     */
    readonly entryBehavior: Action[];
    /**
     * The state's exit behavior as defined by the user.
     * @hidden
     */
    readonly exitBehavior: Action[];
    /**
     * Creates a new instance of the [[State]] class.
     * @param name The name of this [state]{@link State}.
     * @param parent The parent [element]{@link Element} of this [state]{@link State}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    constructor(name: string, parent: Region | State | StateMachine);
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    defaultRegion(): Region | undefined;
    /**
     * Tests the [state]{@link State} to to see if it is a final state. Final states have no [outgoing]{@link State.outgoing} [transitions]{@link Transition} and cause their parent [region]{@link Region} to be considered [complete]{@link Region.isComplete}.
     * @return Returns true if the [state]{@link State} is a final state.
     */
    isFinal(): boolean;
    /**
     * Tests the [state]{@link State} to to see if it is a simple state. Simple states have no child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a simple state.
     */
    isSimple(): boolean;
    /**
     * Tests the [state]{@link State} to to see if it is a composite state. Composite states have one or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a composite state.
     */
    isComposite(): boolean;
    /**
     * Tests the [state]{@link State} to to see if it is an orthogonal state. Orthogonal states have two or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is an orthogonal state.
     */
    isOrthogonal(): boolean;
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is active. A [state]{@link State} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    isActive(instance: IInstance): boolean;
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    isComplete(instance: IInstance): boolean;
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is exited.
     * @param action The behavior to call upon [state]{@link State} exit. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    exit(action: Behavior): this;
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is entered.
     * @param action The behavior to call upon [state]{@link State} entry. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    entry(action: Behavior): this;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** A specification of the sequences of [states]{@link State} that an object goes through in response to events during its life, together with its responsive actions. */
export declare class StateMachine implements IElement {
    readonly name: string;
    /**
     * The parent element of the state machine; always undefined.
     * @hidden
     */
    readonly parent: any;
    /** The child [region(s)]{@link Region} if this [state machine]{@link StateMachine}. */
    readonly children: Region[];
    /**
     * A flag to denote that the state machine model required recompilation.
     * @hidden
     */
    private clean;
    /**
     * The set of actions to perform when initialising a state machine instance; enters all the child regions.
     * @hidden
     */
    private onInitialise;
    /**
     * Creates a new instance of the [[StateMachine]] class.
     * @param name The name of the [state machine]{@link StateMachine}.
     */
    constructor(name: string);
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    invalidate(): void;
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state machine]{@link StateMachine} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    defaultRegion(): Region | undefined;
    /**
     * Tests the [state machine instance]{@link IInstance} to see if it is active. As a [state machine]{@link StateMachine} is the root of the model, it will always be active.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @returns Always returns true.
     */
    isActive(instance: IInstance): boolean;
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if it is complete. A [state machine]{@link StateMachine} is complete when all its [child]{@link StateMachine.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @return Returns true if the [state machine instance]{@link IInstance} is complete.
     */
    isComplete(instance: IInstance): boolean;
    /**
     * Initialises a [state machine model]{@link StateMachine} or a [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to initialise; if omitted, the [state machine model]{@link StateMachine} is initialised.
     */
    initialise(instance?: IInstance): void;
    /**
     * Passes a message to the [state machine model]{@link StateMachine} for evaluation within the context of a specific [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message. These will be passed to the [guard conditions]{@link Guard} of the appropriate [transitions]{@link Transition} and if a state transition occurs, to the behaviour specified on [states]{@link State} and [transitions]{@link Transition}.
     */
    evaluate(instance: IInstance, ...message: Array<any>): boolean;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
    /** Returns the fully name of the [state machine]{@link StateMachine}. */
    toString(): string;
}
/** A relationship within a [state machine model]{@link StateMachine} between two [vertices]{@link Vertex} that will effect a state transition in response to an event when its [guard condition]{@link Transition.when} is satisfied. */
export declare class Transition {
    readonly source: Vertex;
    readonly target: Vertex;
    readonly kind: TransitionKind;
    /**
     * The transition's behavior as defined by the user.
     * @hidden
     */
    effectBehavior: Action[];
    /**
     * The compiled behavior to effect the state transition.
     * @hidden
     */
    onTraverse: Action[];
    /**
     * The transition's guard condition; initially a completion transition, but may be overriden by the user with calls to when and else.
     * @hidden
     */ private guard;
    /**
     * Creates an instance of the [[Transition]] class.
     * @param source The [vertex]{@link Vertex} to [transition]{@link Transition} from.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
    /**
     * Tests the [transition]{@link Transition} to see if it is an [else transition]{@link Transition.else}.
     * @return Returns true if the [transition]{@link Transition} is an [else transition]{@link Transition.else}.
     */
    isElse(): boolean;
    /**
     * Turns the [transition]{@link Transition} into an [else transition]{@link Transition.isElse}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    else(): this;
    /**
     * Create a user defined [guard condition]{@link Guard} for the [transition]{@link Transition}.
     * @param guard The new [guard condition]{@link Guard}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    when(guard: Guard): this;
    /**
     * Sets user-definable behavior to execute every time the [transition]{@link Transition} is traversed.
     * @param action The behavior to call upon [transition]{@link Transition} traversal. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    effect(action: Behavior): this;
    /**
     * Evaulates the [transitions]{@link Transition} guard condition.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message.
     * @hidden
     */
    evaluate(instance: IInstance, ...message: Array<any>): boolean;
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: Array<any>): void;
}
/** Base class for vistors that will walk the [state machine model]{@link StateMachine}; used in conjunction with the [accept]{@linkcode StateMachine.accept} methods on all [elements]{@link Element}. Visitor is an mplementation of the [visitor pattern]{@link https://en.wikipedia.org/wiki/Visitor_pattern}. */
export declare abstract class Visitor {
    /**
     * Visits an [element]{@link Element} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [elements]{@link Element}.
     * @param element The [element]{@link Element} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitElement(element: IElement, ...args: Array<any>): void;
    /**
     * Visits a [region]{@link Region} within a [state machine model]{@link StateMachine}.
     * @param element The [reigon]{@link Region} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitRegion(region: Region, ...args: Array<any>): void;
    /**
     * Visits a [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [vertices]{@link Vertex}.
     * @param element The [element]{@link Element} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitVertex(vertex: Vertex, ...args: Array<any>): void;
    /**
     * Visits a [pseudo state]{@link PseudoState} within a [state machine model]{@link StateMachine}.
     * @param element The [pseudo state]{@link PseudoState} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitPseudoState(pseudoState: PseudoState, ...args: Array<any>): void;
    /**
     * Visits a [state]{@link State} within a [state machine model]{@link StateMachine}.
     * @param element The [state]{@link State} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitState(state: State, ...args: Array<any>): void;
    /**
     * Visits a [state machine]{@link StateMachine} within a [state machine model]{@link StateMachine}.
     * @param element The [state machine]{@link StateMachine} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitStateMachine(stateMachine: StateMachine, ...args: Array<any>): void;
    /**
     * Visits a [transition]{@link Transition} within a [state machine model]{@link StateMachine}.
     * @param element The [transition]{@link Transition} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitTransition(transition: Transition, ...args: Array<any>): void;
}
/** Interface to manage the active state configuration of a [state machine instance]{@link IInstance}. Create implementations of this interface to provide control over considerations such as persistence and/or transactionallity. */
export interface IInstance {
    /**
     * Called by state.js upon entry to any [vertex]{@link Vertex}; must store both the current [vertex]{@link Vertex} and last known [state]{@link State} for the [region]{@link Region}.
     * @param region The [region]{@link Region} to record the current state of.
     * @param vertex The [vertex]{@link Vertex} to record against the [region]{@link Region}.
     */
    setCurrent(region: Region, vertex: Vertex): void;
    /**
     * Called by state.js during [transition]{@link Transition} processing; must return the current [vertex]{@link Vertex} of the [region]{@link Region}.
     * @param region The [region]{@link Region} to retrieve the current state ([vertex]{@link Vertex}) of.
     * @return Returns the current active [vertex]{@link Vertex}.
     */
    getCurrent(region: Region): Vertex | undefined;
    /**
     * Called by state.js during [region]{@link Region} entry; must return the last known [state]{@link State} of the [region]{@link Region}.
     * @param region The [region]{@link Region} to retrieve the last know [state]{@link State} of.
     * @return Returns the last know [state]{@link State}.
     */
    getLastKnownState(region: Region): State | undefined;
}
/** Simple implementation of [[IInstance]]; manages the active state configuration in a dictionary. */
export declare class DictionaryInstance implements IInstance {
    readonly name: string;
    private readonly asc;
    constructor(name: string);
    private find(region);
    setCurrent(region: Region, vertex: Vertex): void;
    getCurrent(region: Region): Vertex | undefined;
    getLastKnownState(region: Region): State | undefined;
    toString(): string;
}
