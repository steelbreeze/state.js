/**
 * @module state
 * 
 * a finite state machine library
 * 
 * @copyright (c) 2014-7 David Mesquita-Morris
 * 
 * Licensed under the MIT and GPL v3 licences
 */

/** Import other packages */
import * as Tree from "./tree";
import { create as delegate, Delegate } from "./delegate";

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
 * Default logger implementation.
 * @hidden
 */
let logger: ILogger = {
	log(message?: any, ...optionalParams: any[]): void { },
	error(message?: any, ...optionalParams: any[]): void { throw message; }
};

/**
 * Overrides the current logging object.
 * @param value An object to pass log and error messages to.
 * @returns Returns the previous logging object in use.
 */
export function setLogger(value: ILogger): ILogger {
	const result = logger;

	logger = value;

	return result;
}

/**
 * Default random number implementation.
 * @hidden
 */
let random = (max: number) => Math.floor(Math.random() * max);

/**
 * Sets a custom random number generator for state.js.
 * 
 * The default implementation uses [Math.floor(Math.random() * max)]{@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random}.
 * @param value The new method to generate random numbers.
 * @return Returns the previous random number generator in use.
 */
export function setRandom(value: (max: number) => number): (max: number) => number {
	const result = random;

	random = value;

	return result;
}

/**
 * Default setting for completion transition behavior.
 * @hidden
 */
let internalTransitionsTriggerCompletion: boolean = false;

/**
 * Sets a flag controlling completion transition behavior for internal transitions.
 * @param value True to have internal transitions trigger completion transitions.
 * @return Returns the previous setting in use.
 */
export function setInternalTransitionsTriggerCompletion(value: boolean): boolean {
	const result = internalTransitionsTriggerCompletion;

	internalTransitionsTriggerCompletion = value;

	return result;
}

/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
let namespaceSeparator: string = ".";

/**
 * Sets the symbol used as the delimiter in fully qualified element names.
 * @param value The symbol used as the delimiter in fully qualified element names.
 * @return Returns the previous symbol used as the delimiter in fully qualified element names.
 */
export function setNamespaceSeparator(value: string): string {
	const result = namespaceSeparator;

	namespaceSeparator = value;

	return result;
}

/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
let defaultRegionName: string = "default";

/**
 * Sets the default name to use when implicitly creating regions.
 * @param value The new default region name.
 * @return Returns the previous default region name.
 */
export function setDefaultRegionName(value: string): string {
	const result = defaultRegionName;

	defaultRegionName = value;

	return result;
}

/**
 * Enumeration used to define the semantics of [pseudo states]{@link PseudoState}.
 */
export enum PseudoStateKind {
	/*** Turns the [pseudo state]{@link PseudoState} into a dynamic conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated after the transition into the [pseudo state]{@link PseudoState} is traversed. */
	Choice,

	/** Turns on deep history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will cascade through all child [regions]{@link Region}. */
	DeepHistory,

	/*** Turns the [pseudo state]{@link PseudoState} into an initial [vertex]{@link Vertex}, meaning is is the default point when the parent [region]{@link Region} is entered. */
	Initial,

	/*** Turns the [pseudo state]{@link PseudoState} into a static conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated before the transition into the [pseudo state]{@link PseudoState} is traversed. */
	Junction,

	/** Turns on shallow history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will only apply to the parent [region]{@link Region}. */
	ShallowHistory
}

export namespace PseudoStateKind {
	/**
	 * Tests a [pseudo state kind]{@link PseudoStateKind} to see if it is one of the history kinds.
	 * @param kind The [pseudo state kind]{@link PseudoStateKind} to test.
	 * @return Returns true if the [pseudo state kind]{@link PseudoStateKind} is [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}
	 */
	export function isHistory(kind: PseudoStateKind): boolean {
		return kind === PseudoStateKind.DeepHistory || kind === PseudoStateKind.ShallowHistory;
	}

	/**
	 * Tests a [pseudo state kind]{@link PseudoStateKind} to see if it is one of the initial kinds.
	 * @param kind The [pseudo state kind]{@link PseudoStateKind} to test.
	 * @return Returns true if the [pseudo state kind]{@link PseudoStateKind} is [Initial]{@link PseudoStateKind.Initial}, [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}
	 */
	export function isInitial(kind: PseudoStateKind): boolean {
		return kind === PseudoStateKind.DeepHistory || kind === PseudoStateKind.Initial || kind === PseudoStateKind.ShallowHistory;
	}
}

/**
 * Enumeration used to define the semantics of [transitions]{@link Transition}.
 */
export enum TransitionKind {
	/** An external [transition]{@link Transition} is the default transition type; the source [vertex]{@link Vertex} is exited, [transition]{@link Transition} behavior called and target [vertex]{@link Vertex} entered. Where the source and target [vertices]{@link Vertex} are in different parent [regions]{@link Region} the source ancestry is exited up to but not including the least common ancestor; likewise the targe ancestry is enterd. */
	External,

	/**
	 * An internal [transition]{@link Transition} executes without exiting or entering the [state]{@link State} in which it is defined.
	 * @note The target vertex of an internal [transition]{@link Transition} must be undefined.
	 */
	Internal,

	/** A local [transition]{@link Transition} is one where the target [vertex]{@link Vertex} is a child of the source [vertex]{@link Vertex}; the source [vertex]{@link Vertex} is not exited. */
	Local
}

/**
 * Common properties of all elements that make up a [state machine model]{@link StateMachine}.
 */
export interface IElement {
	/** The parent [element]{@link IElement} of this element. */
	parent: any;

	/** Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation. */
	invalidate(): void;
}

/**
 * Common base class for [regions]{@link Region} and [vertices]{@link Vertex} within a [state machine model]{@link StateMachine}.
 * @param TParent The type of the element's parent.
 */
export abstract class NamedElement<TParent extends IElement> implements IElement {
	/**
	 * Creates a new instance of the [[NamedElement]] class.
	 * @param name The name of this [element]{@link NamedElement}.
	 * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
	 */
	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.invalidate();
	}

	/**
	 * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
	 * @hidden
	 */
	invalidate(): void {
		this.parent.invalidate();
	}

	/** Returns the fully qualified name of the [element]{@link NamedElement}. */
	public toString(): string {
		return this.parent + namespaceSeparator + this.name;
	}
}

/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex} and has no behavior associated with it. */
export class Region extends NamedElement<State | StateMachine> implements IElement {
	/** The child [vertices]{@link Vertex} of this [region]{@link Region}. */
	public readonly children = new Array<Vertex>();

	/**
	 * Creates a new instance of the [[Region]] class.
	 * @param name The name of this [element]{@link NamedElement}.
	 * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
	 */
	public constructor(name: string, parent: State | StateMachine) {
		super(name, parent);

		this.parent.children.push(this);
	}

	/**
	 * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is active. A [region]{@link Region} is active when it has been entered but not exited.
	 * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is active within.
	 * @return Returns true if the [region]{@link Region} is active.
	 */
	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance);
	}

	/**
	 * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is complete. A [region]{@link Region} is complete when it's current active [state]{@link State} is a [final state]{@link State.isFinal} (one that has no outbound [transitions]{@link Transition}.
	 * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is complete within.
	 * @return Returns true if the [region]{@link Region} is complete.
	 */
	public isComplete(instance: IInstance): boolean {
		const currentState = instance.getLastKnownState(this);

		return currentState !== undefined && currentState.isFinal();
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitRegion(this, ...args);
	}
}

/** The source or target of a [transition]{@link Transition} within a [state machine model]{@link StateMachine}. A vertex can be either a [[State]] or a [[PseudoState]]. */
export abstract class Vertex extends NamedElement<Region> {
	/** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the source of. */
	public readonly outgoing = new Array<Transition>();

	/** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the target of. */
	public readonly incoming = new Array<Transition>();

	/**
	 * Creates a new instance of the [[Vertex]] class.
	 * @param name The name of this [vertex]{@link Vertex}.
	 * @param parent The parent [element]{@link IElement} of this [vertex]{@link Vertex}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
	 */
	protected constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent instanceof Region ? parent : parent.defaultRegion() || new Region(defaultRegionName, parent));

		this.parent.children.push(this);
	}

	/**
	 * Creates a new [transition]{@link Transition} from this [vertex]{@link Vertex}.
	 * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
	 * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
	 */
	public to(target?: Vertex, kind: TransitionKind = TransitionKind.External): Transition {
		return new Transition(this, target, kind);
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitVertex(this, ...args);
	}
}

/** A [vertex]{@link Vertex} in a [state machine model]{@link StateMachine} that has the form of a [state]{@link State} but does not behave as a full [state]{@link State}; it is always transient; it may be the source or target of [transitions]{@link Transition} but has no entry or exit behavior. */
export class PseudoState extends Vertex {
	/**
	 * Creates a new instance of the [[PseudoState]] class.
	 * @param name The name of this [pseudo state]{@link PseudoState}.
	 * @param parent The parent [element]{@link IElement} of this [pseudo state]{@link PseudoState}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
	 * @param kind The semantics of this [pseudo state]{@link PseudoState}; see the members of the [pseudo state kind enumeration]{@link PseudoStateKind} for details.
	 */
	public constructor(name: string, parent: Region | State | StateMachine, public readonly kind: PseudoStateKind = PseudoStateKind.Initial) {
		super(name, parent);
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitPseudoState(this, ...args);
	}
}

/** A condition or situation during the life of an object, represented by a [state machine model]{@link StateMachine}, during which it satisfies some condition, performs some activity, or waits for some event. */
export class State extends Vertex {
	/** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
	public readonly children = new Array<Region>(); // TODO: pull out some commonality from state and state machine

	/**
	 * The state's entry behavior as defined by the user.
	 * @hidden
	 */
	entryBehavior = delegate();

	/**
	 * The state's exit behavior as defined by the user.
	 * @hidden
	 */
	exitBehavior = delegate();

	/**
	 * Creates a new instance of the [[State]] class.
	 * @param name The name of this [state]{@link State}.
	 * @param parent The parent [element]{@link IElement} of this [state]{@link State}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
	 */
	public constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent);
	}

	/**
	 * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
	 * @return Returns the default [region]{@link Region} if present or undefined.
	 */
	defaultRegion(): Region | undefined {
		return this.children.filter(region => region.name === defaultRegionName)[0];
	}

	/**
	 * Tests the [state]{@link State} to to see if it is a final state. Final states have no [outgoing]{@link State.outgoing} [transitions]{@link Transition} and cause their parent [region]{@link Region} to be considered [complete]{@link Region.isComplete}.
	 * @return Returns true if the [state]{@link State} is a final state.
	 */
	public isFinal(): boolean {
		return this.outgoing.length === 0;
	}

	/**
	 * Tests the [state]{@link State} to to see if it is a simple state. Simple states have no child [regions]{@link Region}.
	 * @return Returns true if the [state]{@link State} is a simple state.
	 */
	public isSimple(): boolean {
		return this.children.length === 0;
	}

	/**
	 * Tests the [state]{@link State} to to see if it is a composite state. Composite states have one or more child [regions]{@link Region}.
	 * @return Returns true if the [state]{@link State} is a composite state.
	 */
	public isComposite(): boolean {
		return this.children.length > 0;
	}

	/**
	 * Tests the [state]{@link State} to to see if it is an orthogonal state. Orthogonal states have two or more child [regions]{@link Region}.
	 * @return Returns true if the [state]{@link State} is an orthogonal state.
	 */
	public isOrthogonal(): boolean {
		return this.children.length > 1;
	}

	/**
	 * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is active. A [state]{@link State} is active when it has been entered but not exited.
	 * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is active within.
	 * @return Returns true if the [region]{@link Region} is active.
	 */
	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance) && instance.getLastKnownState(this.parent) === this;
	}

	/**
	 * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
	 * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
	 * @return Returns true if the [region]{@link Region} is complete.
	 */
	public isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
	}

	/**
	 * Sets user-definable behavior to execute every time the [state]{@link State} is exited.
	 * @param action The behavior to call upon [state]{@link State} exit. Mutiple calls to this method may be made to build complex behavior.
	 * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
	 */
	public exit(action: (instance: IInstance, ...message: any[]) => any) {
		this.exitBehavior = delegate(this.exitBehavior, (instance: IInstance, deepHistory: boolean, ...message: any[]) => { // TODO: test origional is not noOp
			return action(instance, ...message);
		});

		this.invalidate();

		return this;
	}

	/**
	 * Sets user-definable behavior to execute every time the [state]{@link State} is entered.
	 * @param action The behavior to call upon [state]{@link State} entry. Mutiple calls to this method may be made to build complex behavior.
	 * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
	 */
	public entry(action: (instance: IInstance, ...message: any[]) => any) {
		this.entryBehavior = delegate(this.entryBehavior, (instance: IInstance, deepHistory: boolean, ...message: any[]) => { // TODO: test origional is not noOp
			return action(instance, ...message);
		});

		this.invalidate();

		return this;
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitState(this, ...args);
	}
}

/** A specification of the sequences of [states]{@link State} that an object goes through in response to events during its life, together with its responsive actions. */
export class StateMachine implements IElement {

	/**
	 * The parent element of the state machine; always undefined.
	 * @hidden
	 */
	readonly parent = undefined;

	/** The child [region(s)]{@link Region} if this [state machine]{@link StateMachine}. */
	public readonly children = new Array<Region>();

	/**
	 * The set of actions to perform when initialising a state machine instance; enters all the child regions.
	 * @hidden
	 */
	private onInitialise = delegate();

	/**
	 * Creates a new instance of the [[StateMachine]] class.
	 * @param name The name of the [state machine]{@link StateMachine}.
	 */
	public constructor(public readonly name: string) {
	}

	/**
	 * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
	 * @hidden
	 */
	invalidate(): void {
		this.onInitialise = delegate();
	}

	/**
	 * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state machine]{@link StateMachine} as its parent.
	 * @return Returns the default [region]{@link Region} if present or undefined.
	 */
	defaultRegion(): Region | undefined {
		return this.children.filter(region => region.name === defaultRegionName)[0];
	}

	/**
	 * Tests the [state machine instance]{@link IInstance} to see if it is active. As a [state machine]{@link StateMachine} is the root of the model, it will always be active.
	 * @param instance The [state machine instance]{@link IInstance} to test.
	 * @returns Always returns true.
	 */
	public isActive(instance: IInstance): boolean {
		return true;
	}

	/**
	 * Tests a given [state machine instance]{@link IInstance} to see if it is complete. A [state machine]{@link StateMachine} is complete when all its [child]{@link StateMachine.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
	 * @param instance The [state machine instance]{@link IInstance} to test.
	 * @return Returns true if the [state machine instance]{@link IInstance} is complete.
	 */
	public isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
	}

	/**
	 * Initialises a [state machine model]{@link StateMachine} or a [state machine instance]{@link IInstance}.
	 * @param instance The [state machine instance]{@link IInstance} to initialise; if omitted, the [state machine model]{@link StateMachine} is initialised.
	 */
	public initialise(instance?: IInstance): void {
		if (instance) {
			if (this.onInitialise === delegate()) {
				this.initialise();
			}

			logger.log(`initialise ${instance}`);

			this.onInitialise(instance, false);
		} else {
			logger.log(`initialise ${this}`);

			this.onInitialise = this.accept(new Runtime(), false, this.onInitialise);
		}
	}

	/**
	 * Passes a message to the [state machine model]{@link StateMachine} for evaluation within the context of a specific [state machine instance]{@link IInstance}.
	 * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
	 * @param message An arbitory number of objects that form the message. These will be passed to the [guard conditions]{@link Guard} of the appropriate [transitions]{@link Transition} and if a state transition occurs, to the behaviour specified on [states]{@link State} and [transitions]{@link Transition}.
	 */
	public evaluate(instance: IInstance, ...message: any[]): boolean {
		if (this.onInitialise === delegate()) {
			this.initialise();
		}

		logger.log(`${instance} evaluate message: ${message}`);

		return Runtime.evaluate(this, instance, ...message);
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitStateMachine(this, ...args);
	}

	/** Returns the fully name of the [state machine]{@link StateMachine}. */
	public toString(): string {
		return this.name;
	}
}

/** A relationship within a [state machine model]{@link StateMachine} between two [vertices]{@link Vertex} that will effect a state transition in response to an event when its [guard condition]{@link Transition.when} is satisfied. */
export class Transition {

	/**
	 * A guard to represent else transitions.
	 * @hidden
	 */
	private static Else = (): boolean => false;

	/**
	 * The transition's behavior as defined by the user.
	 * @hidden
	 */
	effectBehavior = delegate();

	/**
	 * The compiled behavior to effect the state transition.
	 * @hidden
	 */
	onTraverse: Delegate;

	/**
	 * The transition's guard condition; initially a completion transition, but may be overriden by the user with calls to when and else.
	 * @hidden
	 */
	private guard: (instance: IInstance, ...message: any[]) => boolean;

	/**
	 * Creates an instance of the [[Transition]] class.
	 * @param source The [vertex]{@link Vertex} to [transition]{@link Transition} from.
	 * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
	 * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
	 */
	public constructor(public readonly source: Vertex, public readonly target?: Vertex, public readonly kind: TransitionKind = TransitionKind.External) {
		this.guard = source instanceof PseudoState ? (): boolean => true : (instance: IInstance, ...message: any[]): boolean => message[0] === this.source;
		this.source.outgoing.push(this);

		// validate and repair if necessary the user supplied transition kind
		if (this.target) {
			this.target.incoming.push(this);

			if (this.kind === TransitionKind.Local) {
				if (!Tree.isChild<IElement>(this.target, this.source)) {
					this.kind = TransitionKind.External;
				}
			}
		}
		else {
			this.kind = TransitionKind.Internal;
		}

		this.source.invalidate();
	}

	/**
	 * Tests the [transition]{@link Transition} to see if it is an [else transition]{@link Transition.else}.
	 * @return Returns true if the [transition]{@link Transition} is an [else transition]{@link Transition.else}.
	 */
	public isElse(): boolean {
		return this.guard === Transition.Else;
	}

	/**
	 * Turns the [transition]{@link Transition} into an [else transition]{@link Transition.isElse}.
	 * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
	 */
	public else() { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		// TODO: validate that the source is a choice or junction.

		this.guard = Transition.Else;

		return this;
	}

	/**
	 * Create a user defined [guard condition]{@link Guard} for the [transition]{@link Transition}.
	 * @param guard The new [guard condition]{@link Guard}.
	 * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
	 */
	public when(guard: (instance: IInstance, ...message: any[]) => boolean) { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		this.guard = guard;

		return this;
	}

	/**
	 * Sets user-definable behavior to execute every time the [transition]{@link Transition} is traversed.
	 * @param action The behavior to call upon [transition]{@link Transition} traversal. Mutiple calls to this method may be made to build complex behavior.
	 * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
	 */
	public effect(action: (instance: IInstance, ...message: any[]) => any) {
		this.effectBehavior = delegate(this.effectBehavior, (instance: IInstance, deepHistory: boolean, ...message: any[]) => {
			return action(instance, ...message);
		});

		this.source.invalidate();

		return this;
	}

	/**
	 * Evaulates the [transitions]{@link Transition} guard condition.
	 * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
	 * @param message An arbitory number of objects that form the message.
	 * @hidden
	 */
	evaluate(instance: IInstance, ...message: any[]): boolean {
		return this.guard(instance, ...message);
	}

	/**
	 * Accepts a [visitor]{@link Visitor} object.
	 * @param visitor The [visitor]{@link Visitor} object.
	 * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
	 */
	public accept(visitor: Visitor, ...args: any[]): any {
		return visitor.visitTransition(this, ...args);
	}
}

/** Base class for vistors that will walk the [state machine model]{@link StateMachine}; used in conjunction with the [accept]{@linkcode StateMachine.accept} methods on all [elements]{@link IElement}. Visitor is an mplementation of the [visitor pattern]{@link https://en.wikipedia.org/wiki/Visitor_pattern}. */
export abstract class Visitor {

	/**
	 * Visits an [element]{@link IElement} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [elements]{@link IElement}.
	 * @param element The [element]{@link IElement} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitElement<TElement extends IElement>(element: TElement, ...args: any[]): any {
	}

	/**
	 * Visits a [region]{@link Region} within a [state machine model]{@link StateMachine}.
	 * @param element The [reigon]{@link Region} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitRegion(region: Region, ...args: any[]): any {
		for (const vertex of region.children) {
			vertex.accept(this, ...args);
		}

		return this.visitElement(region, ...args);
	}

	/**
	 * Visits a [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [vertices]{@link Vertex}.
	 * @param vertex The [vertex]{@link Vertex} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitVertex(vertex: Vertex, ...args: any[]): any {
		for (const transition of vertex.outgoing) {
			transition.accept(this, ...args);
		}

		return this.visitElement(vertex, ...args);
	}

	/**
	 * Visits a [pseudo state]{@link PseudoState} within a [state machine model]{@link StateMachine}.
	 * @param element The [pseudo state]{@link PseudoState} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitPseudoState(pseudoState: PseudoState, ...args: any[]): any {
		return this.visitVertex(pseudoState, ...args);
	}

	/**
	 * Visits a [state]{@link State} within a [state machine model]{@link StateMachine}.
	 * @param element The [state]{@link State} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitState(state: State, ...args: any[]): any {
		for (const region of state.children) {
			region.accept(this, ...args);
		}

		return this.visitVertex(state, ...args);
	}

	/**
	 * Visits a [state machine]{@link StateMachine} within a [state machine model]{@link StateMachine}.
	 * @param element The [state machine]{@link StateMachine} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitStateMachine(stateMachine: StateMachine, ...args: any[]): any {
		for (const region of stateMachine.children) {
			region.accept(this, ...args);
		}

		return this.visitElement(stateMachine, ...args);
	}

	/**
	 * Visits a [transition]{@link Transition} within a [state machine model]{@link StateMachine}.
	 * @param element The [transition]{@link Transition} being visited.
	 * @param args The arguments passed to the initial accept call.
	 */
	visitTransition(transition: Transition, ...args: any[]): any {
	}
}

/** Interface to manage the active state configuration of a [state machine instance]{@link IInstance}. Create implementations of this interface to provide control over considerations such as persistence and/or transactionallity. */
export interface IInstance {
	/**
	 * Called by state.js upon entry to any [vertex]{@link Vertex}; must store both the current [vertex]{@link Vertex} and last known [state]{@link State} for the [region]{@link Region}.
	 * @param vertex The [vertex]{@link Vertex} to record against its parent [region]{@link Region}.
	 */
	setCurrent(vertex: Vertex): void;

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

/**
 * Active state configuration of an individual [region]{@link Region}.
 * @hidden
 */
type RegionActiveStateConfiguration = {
	/** The current active [vertex]{@link Vertex} within a given [region]{@link Region} */
	currentVertex: Vertex | undefined;

	/** The last known [state]{@link State} of a . */
	lastKnownState: State | undefined;
}

/** Simple implementation of [[IInstance]]; manages the active state configuration in a dictionary. */
export class DictionaryInstance implements IInstance {
	private readonly asc: { [id: string]: RegionActiveStateConfiguration } = {};

	constructor(public readonly name: string) { }

	private find(region: Region): RegionActiveStateConfiguration {
		let asc = this.asc[region.toString()];

		if (!asc) {
			asc = { currentVertex: undefined, lastKnownState: undefined };
			this.asc[region.toString()] = asc;
		}

		return asc;
	}

	setCurrent(vertex: Vertex): void {
		let asc = this.find(vertex.parent);

		asc.currentVertex = vertex;

		if (vertex instanceof State) {
			asc.lastKnownState = vertex;
		}
	}

	getCurrent(region: Region): Vertex | undefined {
		return this.find(region).currentVertex;
	}

	getLastKnownState(region: Region): State | undefined {
		return this.find(region).lastKnownState;
	}

	toString(): string {
		return this.name;
	}
}

/** @hidden */
class RuntimeActions {
	leave = delegate();
	beginEnter = delegate();
	endEnter = delegate();
}

/** @hidden */
class Runtime extends Visitor {
	readonly actions: { [id: string]: RuntimeActions } = {};
	readonly transitions = new Array<Transition>();

	getActions(elemenet: IElement): RuntimeActions {
		return this.actions[elemenet.toString()] || (this.actions[elemenet.toString()] = new RuntimeActions());
	}

	visitElement<TElement extends IElement>(element: TElement, deepHistoryAbove: boolean): void {
		this.getActions(element).leave = delegate(this.getActions(element).leave, (instance: IInstance) => logger.log(`${instance} leave ${element}`));
		this.getActions(element).beginEnter = delegate(this.getActions(element).beginEnter, (instance: IInstance) => logger.log(`${instance} enter ${element}`));
	}

	visitRegion(region: Region, deepHistoryAbove: boolean): void {
		const regionInitial = region.children.reduce<PseudoState | undefined>((result, vertex) => vertex instanceof PseudoState && PseudoStateKind.isInitial(vertex.kind) && (result === undefined || PseudoStateKind.isHistory(result.kind)) ? vertex : result, undefined);

		this.getActions(region).leave = delegate(this.getActions(region).leave, (instance: IInstance, deepHistory: boolean, ...message: any[]) => {
			this.getActions(instance.getCurrent(region)!).leave(instance, deepHistory, ...message);
		});

		super.visitRegion(region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it

		if (deepHistoryAbove || !regionInitial || PseudoStateKind.isHistory(regionInitial.kind)) {
			this.getActions(region).endEnter = delegate(this.getActions(region).endEnter, (instance: IInstance, deepHistory: boolean, ...message: any[]) => {
				const actions = this.getActions((deepHistory || PseudoStateKind.isHistory(regionInitial!.kind)) ? instance.getLastKnownState(region) || regionInitial! : regionInitial!);
				const history = deepHistory || regionInitial!.kind === PseudoStateKind.DeepHistory;

				actions.beginEnter(instance, history, ...message);
				actions.endEnter(instance, history, ...message);
			});
		} else {
			this.getActions(region).endEnter = delegate(this.getActions(region).endEnter, this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
		}
	}

	visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
		super.visitVertex(vertex, deepHistoryAbove);

		this.getActions(vertex).beginEnter = delegate(this.getActions(vertex).beginEnter, (instance: IInstance) => {
			instance.setCurrent(vertex);
		});
	}

	visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
		super.visitPseudoState(pseudoState, deepHistoryAbove);

		if (PseudoStateKind.isInitial(pseudoState.kind)) {
			this.getActions(pseudoState).endEnter = delegate(this.getActions(pseudoState).endEnter, (instance: IInstance, deepHistory: boolean, ...message: any[]) => {
				if (instance.getLastKnownState(pseudoState.parent)) {
					this.getActions(pseudoState).leave(instance, false, ...message);

					const currentState = instance.getLastKnownState(pseudoState.parent);

					if (currentState) {
						this.getActions(currentState).beginEnter(instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory, ...message);
						this.getActions(currentState).endEnter(instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory, ...message);
					}
				} else {
					Runtime.traverse(pseudoState.outgoing[0], instance, false);
				}
			});
		}
	}

	visitState(state: State, deepHistoryAbove: boolean) {
		for (const region of state.children) {
			region.accept(this, deepHistoryAbove);

			this.getActions(state).leave = delegate(this.getActions(state).leave, this.getActions(region).leave);
			this.getActions(state).endEnter = delegate(this.getActions(state).endEnter, this.getActions(region).beginEnter, this.getActions(region).endEnter);
		}

		this.visitVertex(state, deepHistoryAbove);

		this.getActions(state).leave = delegate(this.getActions(state).leave, state.exitBehavior);
		this.getActions(state).beginEnter = delegate(this.getActions(state).beginEnter, state.entryBehavior);
	}

	visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean): Delegate {
		super.visitStateMachine(stateMachine, deepHistoryAbove);

		for (const transition of this.transitions) {
			switch (transition.kind) {
				case TransitionKind.Internal:
					this.visitInternalTransition(transition);
					break;

				case TransitionKind.Local:
					this.visitLocalTransition(transition);
					break;

				case TransitionKind.External:
					this.visitExternalTransition(transition);
					break;
			}
		}

		return delegate(...stateMachine.children.map(region => delegate(this.getActions(region).beginEnter, this.getActions(region).endEnter)));
	}

	visitTransition(transition: Transition, deepHistoryAbove: boolean) {
		super.visitTransition(transition, deepHistoryAbove);

		this.transitions.push(transition);
	}

	visitInternalTransition(transition: Transition): void {
		transition.onTraverse = delegate(transition.effectBehavior);

		if (internalTransitionsTriggerCompletion) {
			transition.onTraverse = delegate(transition.onTraverse, (instance: IInstance, deepHistory: boolean, ...message: any[]) => {
				if (transition.source instanceof State && transition.source.isComplete(instance)) {
					Runtime.evaluate(transition.source, instance, transition.source);
				}
			});
		}
	}

	visitLocalTransition(transition: Transition): void {
		transition.onTraverse = delegate((instance: IInstance, deepHistory: boolean, ...message: any[]) => {
			let vertex: Vertex | StateMachine = transition.target!;
			let actions = delegate(this.getActions(transition.target!).endEnter);

			while (vertex !== transition.source) {
				actions = delegate(this.getActions(vertex).beginEnter, actions);

				if (vertex.parent.parent === transition.source) {
					actions = delegate(transition.effectBehavior, this.getActions(instance.getCurrent(vertex.parent)!).leave, actions);
				} else {
					actions = delegate(this.getActions(vertex.parent).beginEnter, actions); // TODO: validate this is the correct place for region entry
				}

				vertex = vertex.parent.parent;
			}

			actions(instance, deepHistory, ...message);
		});
	}

	visitExternalTransition(transition: Transition): void {
		const sourceAncestors = Tree.ancestors<IElement>(transition.source);
		const targetAncestors = Tree.ancestors<IElement>(transition.target!);
		let i = Tree.lowestCommonAncestorIndex(sourceAncestors, targetAncestors);

		if (sourceAncestors[i] instanceof Region) {
			i += 1;
		}

		transition.onTraverse = delegate(this.getActions(sourceAncestors[i]).leave, transition.effectBehavior);

		while (i < targetAncestors.length) {
			transition.onTraverse = delegate(transition.onTraverse, this.getActions(targetAncestors[i++]).beginEnter);
		}

		transition.onTraverse = delegate(transition.onTraverse, this.getActions(transition.target!).endEnter);
	}

	static findElse(pseudoState: PseudoState): Transition {
		return pseudoState.outgoing.filter(transition => transition.isElse())[0];
	}

	static selectTransition(pseudoState: PseudoState, instance: IInstance, ...message: any[]): Transition {
		const transitions = pseudoState.outgoing.filter(transition => transition.evaluate(instance, ...message));

		if (pseudoState.kind === PseudoStateKind.Choice) {
			return transitions.length !== 0 ? transitions[random(transitions.length)] : this.findElse(pseudoState);
		}

		if (transitions.length > 1) {
			logger.error(`Multiple outbound transition guards returned true at ${pseudoState} for ${message}`);
		}

		return transitions[0] || this.findElse(pseudoState);
	}

	static evaluate(state: StateMachine | State, instance: IInstance, ...message: any[]): boolean {
		let result = false;

		if (message[0] !== state) {
			state.children.every(region => {
				const currentState = instance.getLastKnownState(region);

				if (currentState && Runtime.evaluate(currentState, instance, ...message)) {
					result = true;

					return state.isActive(instance);
				}

				return true;
			});
		}

		if (state instanceof State) {
			if (result) {
				if ((message[0] !== state) && state.isComplete(instance)) {
					Runtime.evaluate(state, instance, state);
				}
			} else {
				const transitions = state.outgoing.filter(transition => transition.evaluate(instance, ...message));

				if (transitions.length === 1) {
					Runtime.traverse(transitions[0], instance, ...message);

					result = true;
				} else if (transitions.length > 1) {
					logger.error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
				}
			}
		}

		return result;
	}

	static traverse(transition: Transition, instance: IInstance, ...message: any[]) {
		let onTraverse = delegate(transition.onTraverse);

		// create the compound transition while the target is a junction pseudo state (static conditional branch)
		while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
			transition = Runtime.selectTransition(transition.target, instance, ...message);

			onTraverse = delegate(onTraverse, transition.onTraverse);
		}

		// call the transition behavior.
		onTraverse(instance, false, ...message);

		if (transition.target) {
			// recurse to perform outbound transitions when the target is a choice pseudo state (dynamic conditional branch)
			if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
				Runtime.traverse(Runtime.selectTransition(transition.target, instance, ...message), instance, ...message);
			}

			// trigger compeltions transitions when the target is a state as required
			else if (transition.target instanceof State && transition.target.isComplete(instance)) {
				Runtime.evaluate(transition.target, instance, transition.target);
			}
		}
	}
}