/** Type signature for logging; this type signature allows for the default console to be used. */
export type Logger = {
	log(message?: any, ...optionalParams: any[]): void;
	error(message?: any, ...optionalParams: any[]): void;
}

/** The object used for loggin error messages. By default, log messages are ignored and errors throw exceptions. */
export let logger: Logger = {
	log(message?: any, ...optionalParams: any[]): void { },
	error(message?: any, ...optionalParams: any[]): void { throw message; }
};

/**
 * Replace the default logger with custom logging.
 * @param newLogger An object to send log and error messages to. This must implement the [[Logger]] type.
 * @returns Returns the previous implementation of the logger.
 */
export function setLogger(newLogger: Logger): Logger {
	const result = logger;

	logger = newLogger;

	return result;
}

/** Type signature for random number generation. */
export type Random = (max: number) => number;

/** Random number generation method. */
export let random: Random = (max: number) => Math.floor(Math.random() * max);

/**
 * Sets the random number generation method.
 * @param newRandom A method to generate random numbers. This must conform to the [[Random]] type.
 * @returns Returns the previous implementation of the random number generator.
 */
export function setRandom(newRandom: Random): Random {
	const result = random;

	random = newRandom;

	return result;
}

/** Flag to control completion transition behaviour of internal transitions. */
export var internalTransitionsTriggerCompletion: boolean = false;

/**
 * Change completion transition behaviour of internal transitions.
 * @param value True to have internal transitions triggering completin transitions.
 */
export function setInternalTransitionsTriggerCompletion(value: boolean): void {
	internalTransitionsTriggerCompletion = value;
}

/** Prototype of transition guard condition callbacks. */
export type Guard = (message: any, instance: IInstance) => boolean;

/** Prototype of state and transition behavior callbacks. */
export type Action = (message: any, instance: IInstance, deepHistory?: boolean) => void;

/** Class that the behavior built up for state transitions. */
export class Actions {
	/** Container for all the behaviour. */
	private readonly actions: Array<Action> = [];

	/**
	 * Creates a new instance of the [[Action]] class.
	 * @param actions An optional existing [[Action]] to seed the initial behavior from; use this when a copy constructor is required.
	 */
	constructor(actions?: Actions) {
		if (actions) {
			this.push(actions);
		}
	}

	/**
	 * Appends the [[Action]] with the contents of another [[Action]] or [[Action]].
	 * @param action The [[Actions]] or [[Action]] to append.
	 */
	push(action: Actions | Action): void {
		if (action instanceof Actions) {
			for (const item of action.actions) {
				this.actions.push(item);
			}
		} else {
			this.actions.push(action);
		}
	}

	/**
	 * Calls each [[Action]] in turn with the supplied parameters upon a state transtion.
	 * @param message The message that caused the state transition.
	 * @param instance The state machine instance.
	 * @param deepHistory For internal use only.
	 */
	invoke(message: any, instance: IInstance, deepHistory: boolean): void {
		for (const action of this.actions) {
			action(message, instance, deepHistory);
		}
	}
}

/** An enumeration used to dictate the behavior of instances of the [[PseudoState]] class. Use these constants as the `kind` parameter when creating new [[PseudoState]] instances. */
export enum PseudoStateKind {
	Choice,
	DeepHistory,
	Initial,
	Junction,
	ShallowHistory
}

export enum TransitionKind {
	External,
	Internal,
	Local
}

/** Common interface for all nodes within a state machine model. */
export interface Element {
	/** Returns an array of all the ancestors of the [[Element]], from the root of the state machine model to the [[Element]] instance itself. */
	getAncestors(): Array<Element>;

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
export abstract class NamedElement<TParent extends Element> implements Element {
	/** The string used to seperate [[Element]]s within a fully qualifiedName; this may be updated if required. */
	public static namespaceSeparator = ".";

	/** The fully qualified name of the [[Element]]. */
	public readonly qualifiedName: string;

	/**
	 * Creates a new instance of the [[NamedElement]].
	 * @param name The name of the [[NamedElement]].
	 * @param parent The parent [[NamedElement]] of this [[NamedElement]].
	 */
	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.qualifiedName = parent ? parent.toString() + NamedElement.namespaceSeparator + name : name;
	}

	/** Returns an array of all the ancestors of the element, from the root of the state machine model to the element itself. */
	public getAncestors(): Array<Element> {
		return this.parent.getAncestors().concat(this);
	}

	/** Returns the root [[StateMachine]] element. */
	public getRoot(): StateMachine {
		return this.parent.getRoot();
	}

	/**
	 * Determines if an [[Element]] is currently active for a given state machine instance.
	 * @param instance The state machine instance.
	 * @returns Returs true if the [[Element]] is active within the given state machine instance.
	 */
	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance);
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	public accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitElement(this, arg);
	}

	/** Returns the name of the [[Element]]. */
	public toString(): string {
		return this.qualifiedName;
	}
}

/** A [[Region]] is a container of [[Vertex]] instances within a state machine hierarchy. [[Region]] instances will be injected automatically when creating composite [[State]]s; alternatively, then may be created explicitly. */
export class Region extends NamedElement<State | StateMachine> {
	/** The default name for automatically created [[Region]] instances. */
	public static defaultName = "default";

	/** The child [[Vertex]] instances that are the children of this [[Region]]. */
	public readonly vertices = new Array<Vertex>();

	/**
	 * Creates a new instance of the [[Region]] class.
	 * @param name The short name for the [[Region]] instance; this will form part of fully qualified names of child [[Vertex]] and [[Region]] instances.
	 * @param parent The parent [[State]] or [[StateMachine]] instance.
	 */
	public constructor(name: string, parent: State | StateMachine) {
		super(name, parent);

		this.parent.regions.push(this);
		this.getRoot().clean = false;
	}

	/**
	 * Tests a state machine instance to see if a specific [[Region]] is deemed to be complete; having been entered and exited.
	 * @param The state machine instance.
	 * @returns True if the [[Region]] is complete for the given state machine instance.
	 */
	public isComplete(instance: IInstance): boolean {
		const currentState = instance.getLastKnownState(this);

		return currentState !== undefined && currentState.isFinal();
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	public accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitRegion(this, arg);
	}
}

/** Represents a node with the graph that forms one part of a state machine model. */
export class Vertex extends NamedElement<Region> {
	readonly outgoing = new Array<Transition>();
	readonly incoming = new Array<Transition>();

	constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent instanceof Region ? parent : parent.getDefaultRegion());

		this.parent.vertices.push(this);
		this.getRoot().clean = false;
	}

	to(target?: Vertex, kind: TransitionKind = TransitionKind.External): Transition {
		return new Transition(this, target, kind);
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitVertex(this, arg);
	}
}

export class PseudoState extends Vertex {
	constructor(name: string, parent: Region | State | StateMachine, public readonly kind: PseudoStateKind = PseudoStateKind.Initial) {
		super(name, parent);
	}

	isHistory(): boolean {
		return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
	}

	isInitial(): boolean {
		return this.kind === PseudoStateKind.Initial || this.isHistory();
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitPseudoState(this, arg);
	}
}

export class State extends Vertex {
	readonly regions = new Array<Region>();
	readonly entryBehavior = new Actions();
	readonly exitBehavior = new Actions();
	defaultRegion: Region;

	constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent);
	}

	getDefaultRegion(): Region {
		return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
	}

	isFinal(): boolean {
		return this.outgoing.length === 0;
	}

	isSimple(): boolean {
		return this.regions.length === 0;
	}

	isComposite(): boolean {
		return this.regions.length > 0;
	}

	isOrthogonal(): boolean {
		return this.regions.length > 1;
	}

	/**
	 * Determines if an [[Element]] is currently active for a given state machine instance.
	 * @param instance The state machine instance.
	 * @returns Returs true if the [[Element]] is active within the given state machine instance.
	 */
	isActive(instance: IInstance): boolean {
		return super.isActive(instance) && instance.getLastKnownState(this.parent) === this;
	}

	isComplete(instance: IInstance): boolean {
		return this.regions.every(region => region.isComplete(instance));
	}

	exit(action: Action) {
		this.exitBehavior.push(action);

		this.getRoot().clean = false;

		return this;
	}

	entry(action: Action) {
		this.entryBehavior.push(action);

		this.getRoot().clean = false;

		return this;
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitState(this, arg);
	}
}

export class StateMachine implements Element {
	readonly regions = new Array<Region>();
	defaultRegion: Region | undefined = undefined;
	clean: boolean = false;
	readonly onInitialise = new Actions();

	constructor(public readonly name: string) {
	}

	getDefaultRegion(): Region {
		return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
	}

	/** Returns an array of all the ancestors of the element, from the root of the state machine model to the element itself. */
	getAncestors(): Array<Element> {
		return [this];
	}

	/** Returns the root [[StateMachine]] element. */
	getRoot(): StateMachine {
		return this;
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitStateMachine(this, arg);
	}

	/**
	 * Determines if an [[Element]] is currently active for a given state machine instance.
	 * @param instance The state machine instance.
	 * @returns Returs true if the [[Element]] is active within the given state machine instance.
	 */
	isActive(instance: IInstance): boolean {
		return true;
	}

	isComplete(instance: IInstance): boolean {
		return this.regions.every(region => region.isComplete(instance));
	}

	initialise(instance?: IInstance, autoInitialiseModel: boolean = true): void {
		if (instance) {
			if (autoInitialiseModel && this.clean === false) {
				this.initialise();
			}

			logger.log(`initialise ${instance}`);

			this.onInitialise.invoke(undefined, instance, false);
		} else {
			logger.log(`initialise ${this}`);

			this.accept(new InitialiseStateMachine());

			this.clean = true;
		}
	}

	evaluate(instance: IInstance, message: any, autoInitialiseModel: boolean = true): boolean {
		// initialise the state machine model if necessary
		if (autoInitialiseModel && this.clean === false) {
			this.initialise();
		}

		logger.log(`${instance} evaluate message: ${message}`);

		return evaluate(this, instance, message);
	}

	/** Returns the name of the [[Element]]. */
	toString(): string {
		return this.name;
	}
}

export class Transition {
	static Else = (message: any, instance: IInstance) => false;
	readonly effectBehavior = new Actions();
	readonly onTraverse = new Actions();
	guard: Guard;

	constructor(public readonly source: Vertex, public readonly target?: Vertex, public readonly kind: TransitionKind = TransitionKind.External) {
		this.guard = source instanceof PseudoState ? () => true : message => message === this.source;
		this.source.outgoing.push(this);
		this.source.getRoot().clean = false;

		if (this.target) {
			this.target.incoming.push(this);
		}
		else {
			this.kind = TransitionKind.Internal;
		}
	}

	else() { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		this.guard = Transition.Else;

		return this;
	}

	when(guard: Guard) { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		this.guard = guard;

		return this;
	}

	effect(action: Action) {
		this.effectBehavior.push(action);

		this.source.getRoot().clean = false;

		return this;
	}

	/**
	 * Accepts a [[Visitor]] instance and walks the state machine model hierarchy from this node down; create custom visitors by overriding the [[Visitor]] class.
	 * @param TArg The type of and optional argument that will be passed back to the [[Visitor]] instance.
	 * @param visitor The [[Visitor]] instance.
	 * @param TArg An optional argument that will be passed back to the [[Visitor]] instance.
	 */
	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitTransition(this, arg);
	}

	toString(): string {
		return TransitionKind[this.kind] + "(" + (this.kind === TransitionKind.Internal ? this.source : (this.source + " -> " + this.target)) + ")";
	}
}

export class Visitor<TArg> {
	visitElement(element: Element, arg?: TArg): void {
	}

	visitRegion(region: Region, arg?: TArg): void {
		for (const vertex of region.vertices) {
			vertex.accept(this, arg);
		}

		this.visitElement(region, arg);
	}

	visitVertex(vertex: Vertex, arg?: TArg): void {
		for (const transition of vertex.outgoing) {
			transition.accept(this, arg);
		}

		this.visitElement(vertex, arg);
	}

	visitPseudoState(pseudoState: PseudoState, arg?: TArg): void {
		this.visitVertex(pseudoState, arg);
	}

	visitState(state: State, arg?: TArg): void {
		for (const region of state.regions) {
			region.accept(this, arg);
		}

		this.visitVertex(state, arg);
	}

	visitStateMachine(stateMachine: StateMachine, arg?: TArg): void {
		for (const region of stateMachine.regions) {
			region.accept(this, arg);
		}

		this.visitElement(stateMachine, arg);
	}

	visitTransition(transition: Transition, arg?: TArg): void {
	}
}

export interface IInstance {
	setCurrent(region: Region, vertex: Vertex): void;

	getCurrent(region: Region): Vertex | undefined;

	getLastKnownState(region: Region): State | undefined;
}

export class DictionaryInstance implements IInstance {
	readonly current: { [id: string]: Vertex } = {};
	readonly activeStateConfiguration: { [id: string]: State } = {};

	constructor(public readonly name: string) { }

	setCurrent(region: Region, vertex: Vertex): void {
		this.current[region.qualifiedName] = vertex;

		if (vertex instanceof State) {
			this.activeStateConfiguration[region.qualifiedName] = vertex;
		}
	}

	getCurrent(region: Region): Vertex | undefined {
		return this.current[region.qualifiedName];
	}

	getLastKnownState(region: Region): State | undefined {
		return this.activeStateConfiguration[region.qualifiedName];
	}

	toString(): string {
		return this.name;
	}
}

class ElementActions {
	readonly leave = new Actions();
	readonly beginEnter = new Actions();
	readonly endEnter = new Actions();
}

class InitialiseStateMachine extends Visitor<boolean> {
	readonly elementActions: { [id: string]: ElementActions } = {};
	readonly transitions = new Array<Transition>();

	getActions(elemenet: Element): ElementActions {
		return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = new ElementActions());
	}

	visitElement(element: Element, deepHistoryAbove: boolean): void {
		this.getActions(element).leave.push((message, instance) => logger.log(`${instance} leave ${element}`));
		this.getActions(element).beginEnter.push((message, instance) => logger.log(`${instance} enter ${element}`));
	}

	visitRegion(region: Region, deepHistoryAbove: boolean): void {
		// find the initial pseudo state of this region
		const regionInitial = region.vertices.reduce<PseudoState | undefined>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result, undefined);

		// leave the curent active child state when exiting the region
		this.getActions(region).leave.push((message, instance) => {
			const currentState = instance.getCurrent(region);

			if (currentState) {
				this.getActions(currentState).leave.invoke(message, instance, false);
			}
		});

		// cascade to child vertices
		super.visitRegion(region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it

		// enter the appropriate child vertex when entering the region
		if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) { // NOTE: history needs to be determined at runtime
			this.getActions(region).endEnter.push((message, instance, deepHistory) => {
				const actions = this.getActions((deepHistory || regionInitial!.isHistory()) ? instance.getLastKnownState(region) || regionInitial! : regionInitial!);
				const history = deepHistory || regionInitial!.kind === PseudoStateKind.DeepHistory;

				actions.beginEnter.invoke(message, instance, history);
				actions.endEnter.invoke(message, instance, history);
			});
		} else {
			// TODO: validate initial region
			this.getActions(region).endEnter.push(this.getActions(regionInitial).beginEnter);
			this.getActions(region).endEnter.push(this.getActions(regionInitial).endEnter);
		}
	}

	visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
		super.visitVertex(vertex, deepHistoryAbove);

		// update the parent regions current state
		this.getActions(vertex).beginEnter.push((message, instance) => {
			instance.setCurrent(vertex.parent, vertex);
		});
	}

	visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
		super.visitPseudoState(pseudoState, deepHistoryAbove);

		// evaluate comppletion transitions once vertex entry is complete
		if (pseudoState.isInitial()) {
			this.getActions(pseudoState).endEnter.push((message, instance, deepHistory) => {
				if (instance.getLastKnownState(pseudoState.parent)) {
					this.getActions(pseudoState).leave.invoke(message, instance, false);

					const currentState = instance.getLastKnownState(pseudoState.parent);

					if (currentState) {
						this.getActions(currentState).beginEnter.invoke(message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
						this.getActions(currentState).endEnter.invoke(message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
					}
				} else {
					traverse(pseudoState.outgoing[0], instance);
				}
			});
		}
	}

	visitState(state: State, deepHistoryAbove: boolean) {
		// NOTE: manually iterate over the child regions to control the sequence of initialisation
		for (const region of state.regions) {
			region.accept(this, deepHistoryAbove);

			this.getActions(state).leave.push(this.getActions(region).leave);
			this.getActions(state).endEnter.push(this.getActions(region).beginEnter);
			this.getActions(state).endEnter.push(this.getActions(region).endEnter);
		}

		this.visitVertex(state, deepHistoryAbove);

		// add the user defined behavior when entering and exiting states
		this.getActions(state).leave.push(state.exitBehavior);
		this.getActions(state).beginEnter.push(state.entryBehavior);
	}

	visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean): void {
		super.visitStateMachine(stateMachine, deepHistoryAbove);

		// initialise the transitions only once all elemenets have been initialised
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

		// enter each child region on state machine entry
		for (const region of stateMachine.regions) {
			stateMachine.onInitialise.push(this.getActions(region).beginEnter);
			stateMachine.onInitialise.push(this.getActions(region).endEnter);
		}
	}

	visitTransition(transition: Transition, deepHistoryAbove: boolean) {
		super.visitTransition(transition, deepHistoryAbove);

		this.transitions.push(transition);
	}

	visitInternalTransition(transition: Transition): void {
		// perform the transition behavior
		transition.onTraverse.push(transition.effectBehavior);

		// add a test for completion
		if (internalTransitionsTriggerCompletion) {
			transition.onTraverse.push((message, instance) => {
				if (transition.source instanceof State && transition.source.isComplete(instance)) {
					evaluate(transition.source, instance, transition.source);
				}
			});
		}
	}

	visitLocalTransition(transition: Transition): void {
		transition.onTraverse.push((message, instance, deepHistory) => {
			const targetAncestors = transition.target!.getAncestors(); // local transitions will have a target
			let i = 0;

			// find the first inactive element in the target ancestry
			while (targetAncestors[i].isActive(instance)) {
				i++;
			}

			// TODO: create a test to see if we need region logic
			if (targetAncestors[i] instanceof Region) {
				throw "Need to implement Region logic";
			}

			const firstToEnter = targetAncestors[i] as State;
			const firstToExit = instance.getCurrent(firstToEnter.parent);

			// exit the source state
			this.getActions(firstToExit!).leave.invoke(message, instance, false);

			// perform the transition behavior;
			transition.effectBehavior.invoke(message, instance, false);

			// enter the target ancestry
			while (i < targetAncestors.length) {
				this.getActions(targetAncestors[i++]).beginEnter.invoke(message, instance, false);
			}

			// trigger cascade
			this.getActions(transition.target!).endEnter.invoke(message, instance, false);
		});
	}

	visitExternalTransition(transition: Transition): void {
		const sourceAncestors = transition.source.getAncestors(), targetAncestors = transition.target!.getAncestors(); // external transtions always have a target
		let i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;

		// find the first uncommon ancestors
		while (sourceAncestors[i] !== targetAncestors[i]) { i -= 1; }

		if (sourceAncestors[i] instanceof Region) {
			i += 1;
		}

		// leave source ancestry and perform the transition behavior
		transition.onTraverse.push(this.getActions(sourceAncestors[i]).leave);
		transition.onTraverse.push(transition.effectBehavior);

		// enter the target ancestry
		while (i < targetAncestors.length) {
			transition.onTraverse.push(this.getActions(targetAncestors[i++]).beginEnter);
		}

		// trigger cascade
		transition.onTraverse.push(this.getActions(transition.target!).endEnter);
	}
}

function findElse(pseudoState: PseudoState): Transition {
	return pseudoState.outgoing.filter(transition => transition.guard === Transition.Else)[0];
}

function selectTransition(pseudoState: PseudoState, instance: IInstance, message: any): Transition {
	const transitions = pseudoState.outgoing.filter(transition => transition.guard(message, instance));

	if (pseudoState.kind === PseudoStateKind.Choice) {
		return transitions.length !== 0 ? transitions[random(transitions.length)] : findElse(pseudoState);
	}

	if (transitions.length > 1) {
		logger.error(`Multiple outbound transition guards returned true at ${pseudoState} for ${message}`);
	}

	return transitions[0] || findElse(pseudoState);
}

/**
 * Passes a message to a state and state machine instance combination for evaluation; tests guard conditions and evaluates transitions as needed.
 * @returns Returns true if a state transition occured.
 */
function evaluate(state: StateMachine | State, instance: IInstance, message: any): boolean {
	let result = false;

	// delegate to child regions first if a non-continuation
	if (message !== state) {
		state.regions.every(region => {
			const currentState = instance.getLastKnownState(region);

			if (currentState && evaluate(currentState, instance, message)) {
				result = true;

				return state.isActive(instance);
			}

			return true;
		});
	}

	if (state instanceof State) {
		// if a transition occured in a child region, check for completions
		if (result) {
			if ((message !== state) && state.isComplete(instance)) {
				evaluate(state, instance, state);
			}
		} else {
			// otherwise look for a transition from this state
			const transitions = state.outgoing.filter(transition => transition.guard(message, instance));

			if (transitions.length === 1) {
				// execute if a single transition was found
				traverse(transitions[0], instance, message);

				result = true;
			} else if (transitions.length > 1) {
				// error if multiple transitions evaluated true
				logger.error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
			}
		}
	}

	return result;
}

/**
 * Traverses a transition; implements dynamic and static conditional branching and completion transition chaining.
 * @param origin The transition to traverse.
 * @param instance The state machin instance.
 * @param message The message that caused the state transition.
 */
function traverse(origin: Transition, instance: IInstance, message?: any) {
	let onTraverse = new Actions(origin.onTraverse);
	let transition: Transition = origin;

	// process static conditional branches - build up all the transition actions prior to executing
	while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
		// proceed to the next transition
		transition = selectTransition(transition.target, instance, message);

		// concatenate actions before and after junctions
		onTraverse.push(transition.onTraverse);
	}

	// execute the transition actions
	onTraverse.invoke(message, instance, false);

	if (transition.target) {
		// process dynamic conditional branches if required
		if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
			traverse(selectTransition(transition.target, instance, message), instance, message);
		}

		// test for completion transitions
		else if (transition.target instanceof State && transition.target.isComplete(instance)) {
			evaluate(transition.target, instance, transition.target);
		}
	}
}