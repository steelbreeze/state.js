/**
 * @module state
 * state: a finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */
import * as Tree from "./tree";

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
 * Sets a custom random number generator for state.js. The default implementation uses Math.floor(Math.random() * max).
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

/** The callback prototype for [state machine]{@link StateMachine} [transition]{@link Transition} guard conditions. */
export type Guard = (instance: IInstance, ...message: Array<any>) => boolean;

/** The callback prototype for [state machine]{@link StateMachine} behavior during a state transition; used in [state]{@link State} entry, exit and [transition]{@link Transition} effect. */
export type Behavior = (instance: IInstance, ...message: Array<any>) => any;

/**
 * Internal class used to build and cache [transition]{@link Transition} behavior.
 * @hidden 
 */
export type Actions = Array<(instance: IInstance, deepHistory: boolean, ...message: Array<any>) => any>;

/**
 * Internal class used to execute [transition]{@link Transition} behavior.
 * @hidden
 */ function invoke(actions: Actions, instance: IInstance, deepHistory: boolean, ...message: Array<any>): void {
	for (const action of actions) {
		action(instance, deepHistory, ...message);
	}
}

/**
 * Enumeration used to control the precise semantics of [pseudo states]{@link PseudoState}.
 */
export enum PseudoStateKind {
	/*** Turns the [pseudo state]{@link PseudoState} into a dynamic conditional branch; the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated dynamically once the [pseudo state]{@link PseudoState} is reached. */
	Choice,

	DeepHistory,

	/*** Turns the [pseudo state]{@link PseudoState} into an initial [vertex]{@link Vertex}, meaning is is the default point when the parent [region]{@link Region} is entered. */
	Initial,

	/*** Turns the [pseudo state]{@link PseudoState} into a static conditional branch; the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated prior to the [pseudo state]{@link PseudoState} being reached. */
	Junction,
	ShallowHistory
}

export enum TransitionKind {
	External,
	Internal,
	Local
}

export interface IElement {
	parent: IElement;
	name: string;
}

export abstract class Element<TParent extends IElement> implements IElement {
	public static namespaceSeparator = ".";
	public readonly qualifiedName: string;

	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.qualifiedName = parent ? parent.toString() + Element.namespaceSeparator + name : name; // TODO: could this be deferred to the model initialisation?
	}

	public toString(): string {
		return this.qualifiedName;
	}
}

/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex}. */
export class Region extends Element<State | StateMachine> implements IElement {
	public static defaultName = "default";
	public readonly children = new Array<Vertex>();

	public constructor(name: string, parent: State | StateMachine) {
		super(name, parent);

		this.parent.children.push(this);
		this.invalidate();
	}

	/** @internal */ invalidate(): void {
		this.parent.invalidate();
	}

	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance);
	}

	public isComplete(instance: IInstance): boolean {
		const currentState = instance.getLastKnownState(this);

		return currentState !== undefined && currentState.isFinal();
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitRegion(this, ...args);
	}
}

/** The source or target of a [[Transition]] within a [[StateMachine]] model. A vertex can be either a [[State]] or a [[PseudoState]]. */
export class Vertex extends Element<Region> {
	public readonly outgoing = new Array<Transition>();
	public readonly incoming = new Array<Transition>();

	protected constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent instanceof Region ? parent : defaultRegion(parent));

		this.parent.children.push(this);
		this.invalidate();
	}

	/** @internal */ invalidate(): void {
		this.parent.invalidate();
	}

	public to(target?: Vertex, kind: TransitionKind = TransitionKind.External): Transition {
		return new Transition(this, target, kind);
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitVertex(this, ...args);
	}
}

/** A [[Vertex]] in a [[StateMachine]] machine model that has the form of a state but does not behave as a full state; it is always transient; it may be the source or target of transitions but has no entry or exit behavior */
export class PseudoState extends Vertex {
	public constructor(name: string, parent: Region | State | StateMachine, public readonly kind: PseudoStateKind = PseudoStateKind.Initial) {
		super(name, parent);
	}

	public isHistory(): boolean {
		return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
	}

	public isInitial(): boolean {
		return this.kind === PseudoStateKind.Initial || this.isHistory();
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitPseudoState(this, ...args);
	}
}

export class State extends Vertex {
	public readonly children = new Array<Region>();
	/** @internal */ readonly entryBehavior: Actions = [];
	/** @internal */ readonly exitBehavior: Actions = [];

	public isFinal(): boolean {
		return this.outgoing.length === 0;
	}

	public isSimple(): boolean {
		return this.children.length === 0;
	}

	public isComposite(): boolean {
		return this.children.length > 0;
	}

	public isOrthogonal(): boolean {
		return this.children.length > 1;
	}

	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance) && instance.getLastKnownState(this.parent) === this;
	}

	public isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
	}

	public exit(action: Behavior) {
		this.exitBehavior.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			action(instance, ...message);
		});

		this.invalidate();

		return this;
	}

	public entry(action: Behavior) {
		this.entryBehavior.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			action(instance, ...message);
		});

		this.invalidate();

		return this;
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitState(this, ...args);
	}
}

export class StateMachine implements IElement {
	public readonly parent: any = undefined;
	public readonly children = new Array<Region>();
	private clean: boolean = false;
	private onInitialise: Actions = [];

	public constructor(public readonly name: string) {
	}

	/** @internal */invalidate(): void {
		this.clean = false;
	}

	public isActive(instance: IInstance): boolean {
		return true;
	}

	public isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
	}

	public initialise(instance?: IInstance): void {
		if (instance) {
			if (this.clean === false) {
				this.initialise();
			}

			logger.log(`initialise ${instance}`);

			invoke(this.onInitialise, instance, false, undefined);
		} else {
			logger.log(`initialise ${this}`);

			this.accept(new InitialiseStateMachine(), false, this.onInitialise);

			this.clean = true;
		}
	}

	public evaluate(instance: IInstance, ...message: Array<any>): boolean {
		if (this.clean === false) {
			this.initialise();
		}

		logger.log(`${instance} evaluate message: ${message}`);

		return evaluate(this, instance, ...message);
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitStateMachine(this, ...args);
	}

	public toString(): string {
		return this.name;
	}
}

export class Transition {
	private static Else: Guard = (instance: IInstance, ...message: Array<any>) => false;
	/** @internal */ effectBehavior: Actions = [];
	/** @internal */ onTraverse: Actions = [];
	private guard: Guard;

	/**
	 * 
	 * @param source 
	 * @param target 
	 * @param kind The [kind]{@link TransitionKind} of the transition that defines its transition semantics. Note that the kind is validated and overriden if necessary.
	 */
	public constructor(public readonly source: Vertex, public readonly target?: Vertex, public readonly kind: TransitionKind = TransitionKind.External) {
		this.guard = source instanceof PseudoState ? (instance: IInstance, ...message: Array<any>) => true : (instance: IInstance, ...message: Array<any>) => message[0] === this.source;
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

	public isElse(): boolean {
		return this.guard === Transition.Else;
	}

	public else() { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		this.guard = Transition.Else;

		return this;
	}

	public when(guard: Guard) { // NOTE: no need to invalidate the machine as the transition actions have not changed.
		this.guard = guard;

		return this;
	}

	public effect(action: Behavior) {
		this.effectBehavior.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			action(instance, ...message);
		});

		this.source.invalidate();

		return this;
	}

	/** @internal */ evaluate(instance: IInstance, ...message: Array<any>): boolean {
		return this.guard(instance, ...message);
	}

	public accept(visitor: Visitor, ...args: Array<any>) {
		visitor.visitTransition(this, ...args);
	}

	public toString(): string {
		return TransitionKind[this.kind] + "(" + (this.kind === TransitionKind.Internal ? this.source : (this.source + " -> " + this.target)) + ")";
	}
}

export class Visitor {
	visitElement(element: IElement, ...args: Array<any>): void {
	}

	visitRegion(region: Region, ...args: Array<any>): void {
		for (const vertex of region.children) {
			vertex.accept(this, ...args);
		}

		this.visitElement(region, ...args);
	}

	visitVertex(vertex: Vertex, ...args: Array<any>): void {
		for (const transition of vertex.outgoing) {
			transition.accept(this, ...args);
		}

		this.visitElement(vertex, ...args);
	}

	visitPseudoState(pseudoState: PseudoState, ...args: Array<any>): void {
		this.visitVertex(pseudoState, ...args);
	}

	visitState(state: State, ...args: Array<any>): void {
		for (const region of state.children) {
			region.accept(this, ...args);
		}

		this.visitVertex(state, ...args);
	}

	visitStateMachine(stateMachine: StateMachine, ...args: Array<any>): void {
		for (const region of stateMachine.children) {
			region.accept(this, ...args);
		}

		this.visitElement(stateMachine, ...args);
	}

	visitTransition(transition: Transition, ...args: Array<any>): void {
	}
}

export interface IInstance {
	setCurrent(region: Region, vertex: Vertex): void;

	getCurrent(region: Region): Vertex | undefined;

	getLastKnownState(region: Region): State | undefined;
}

export class DictionaryInstance implements IInstance {
	/** @internal */ readonly current: { [id: string]: Vertex } = {};
	/** @internal */ readonly activeStateConfiguration: { [id: string]: State } = {};

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

/** @hidden */
class ElementActions {
	leave: Actions = [];
	beginEnter: Actions = [];
	endEnter: Actions = [];
}

/** @hidden */
class InitialiseStateMachine extends Visitor {
	readonly elementActions: { [id: string]: ElementActions } = {};
	readonly transitions = new Array<Transition>();

	getActions(elemenet: IElement): ElementActions {
		return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = new ElementActions());
	}

	visitElement(element: IElement, deepHistoryAbove: boolean): void {
		this.getActions(element).leave.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => logger.log(`${instance} leave ${element}`));
		this.getActions(element).beginEnter.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => logger.log(`${instance} enter ${element}`));
	}

	visitRegion(region: Region, deepHistoryAbove: boolean): void {
		const regionInitial = region.children.reduce<PseudoState | undefined>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result, undefined);

		this.getActions(region).leave.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			const currentState = instance.getCurrent(region);

			if (currentState) {
				invoke(this.getActions(currentState).leave, instance, false, ...message);
			}
		});

		super.visitRegion(region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it

		if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
			this.getActions(region).endEnter.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
				const actions = this.getActions((deepHistory || regionInitial!.isHistory()) ? instance.getLastKnownState(region) || regionInitial! : regionInitial!);
				const history = deepHistory || regionInitial!.kind === PseudoStateKind.DeepHistory;

				invoke(actions.beginEnter, instance, history, ...message);
				invoke(actions.endEnter, instance, history, ...message);
			});
		} else {
			this.getActions(region).endEnter.push(...this.getActions(regionInitial).beginEnter, ...this.getActions(regionInitial).endEnter);
		}
	}

	visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
		super.visitVertex(vertex, deepHistoryAbove);

		this.getActions(vertex).beginEnter.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			instance.setCurrent(vertex.parent, vertex);
		});
	}

	visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
		super.visitPseudoState(pseudoState, deepHistoryAbove);

		if (pseudoState.isInitial()) {
			this.getActions(pseudoState).endEnter.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
				if (instance.getLastKnownState(pseudoState.parent)) {
					invoke(this.getActions(pseudoState).leave, instance, false, ...message);

					const currentState = instance.getLastKnownState(pseudoState.parent);

					if (currentState) {
						invoke(this.getActions(currentState).beginEnter, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory, ...message);
						invoke(this.getActions(currentState).endEnter, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory, ...message);
					}
				} else {
					traverse(pseudoState.outgoing[0], instance, false);
				}
			});
		}
	}

	visitState(state: State, deepHistoryAbove: boolean) {
		for (const region of state.children) {
			region.accept(this, deepHistoryAbove);

			this.getActions(state).leave.push(...this.getActions(region).leave);
			this.getActions(state).endEnter.push(...this.getActions(region).beginEnter, ...this.getActions(region).endEnter);
		}

		this.visitVertex(state, deepHistoryAbove);

		this.getActions(state).leave.push(...state.exitBehavior);
		this.getActions(state).beginEnter.push(...state.entryBehavior);
	}

	visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean, onInitialise: Actions): void {
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

		for (const region of stateMachine.children) {
			onInitialise.push(...this.getActions(region).beginEnter, ...this.getActions(region).endEnter);
		}
	}

	visitTransition(transition: Transition, deepHistoryAbove: boolean) {
		super.visitTransition(transition, deepHistoryAbove);

		this.transitions.push(transition);
	}

	visitInternalTransition(transition: Transition): void {
		transition.onTraverse.push(...transition.effectBehavior);

		if (internalTransitionsTriggerCompletion) {
			transition.onTraverse.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
				if (transition.source instanceof State && transition.source.isComplete(instance)) {
					evaluate(transition.source, instance, transition.source);
				}
			});
		}
	}

	visitLocalTransition(transition: Transition): void {
		transition.onTraverse.push((instance: IInstance, deepHistory: boolean, ...message: Array<any>) => {
			let vertex: Vertex | StateMachine = transition.target!;
			const actions: Actions = [...this.getActions(transition.target!).endEnter];

			while (vertex !== transition.source) {
				actions.unshift(...this.getActions(vertex).beginEnter);

				if (vertex.parent.parent === transition.source) {
					actions.unshift(...transition.effectBehavior, ...this.getActions(instance.getCurrent(vertex.parent)!).leave);
				} else {
					actions.unshift(...this.getActions(vertex.parent).beginEnter, ); // TODO: validate this is the correct place for region entry
				}

				vertex = vertex.parent.parent;
			}

			invoke(actions, instance, deepHistory, ...message);
		});
	}

	visitExternalTransition(transition: Transition): void {
		const sourceAncestors = Tree.ancestors<IElement>(transition.source);
		const targetAncestors = Tree.ancestors<IElement>(transition.target!);
		let i = Tree.lowestCommonAncestorIndex(sourceAncestors, targetAncestors);

		if (sourceAncestors[i] instanceof Region) {
			i += 1;
		}

		transition.onTraverse.push(...this.getActions(sourceAncestors[i]).leave, ...transition.effectBehavior);

		while (i < targetAncestors.length) {
			transition.onTraverse.push(...this.getActions(targetAncestors[i++]).beginEnter);
		}

		transition.onTraverse.push(...this.getActions(transition.target!).endEnter);
	}
}

/** @hidden */
function defaultRegion(state: State | StateMachine) {
	for (const region of state.children) {
		if (region.name === Region.defaultName) {
			return region;
		}
	}

	return new Region(Region.defaultName, state);
}

/** @hidden */
function findElse(pseudoState: PseudoState): Transition {
	return pseudoState.outgoing.filter(transition => transition.isElse())[0];
}

/** @hidden */
function selectTransition(pseudoState: PseudoState, instance: IInstance, ...message: Array<any>): Transition {
	const transitions = pseudoState.outgoing.filter(transition => transition.evaluate(instance, ...message));

	if (pseudoState.kind === PseudoStateKind.Choice) {
		return transitions.length !== 0 ? transitions[random(transitions.length)] : findElse(pseudoState);
	}

	if (transitions.length > 1) {
		logger.error(`Multiple outbound transition guards returned true at ${pseudoState} for ${message}`);
	}

	return transitions[0] || findElse(pseudoState);
}

/** @hidden */
function evaluate(state: StateMachine | State, instance: IInstance, ...message: Array<any>): boolean {
	let result = false;

	if (message[0] !== state) {
		state.children.every(region => {
			const currentState = instance.getLastKnownState(region);

			if (currentState && evaluate(currentState, instance, ...message)) {
				result = true;

				return state.isActive(instance);
			}

			return true;
		});
	}

	if (state instanceof State) {
		if (result) {
			if ((message[0] !== state) && state.isComplete(instance)) {
				evaluate(state, instance, state);
			}
		} else {
			const transitions = state.outgoing.filter(transition => transition.evaluate(instance, ...message));

			if (transitions.length === 1) {
				traverse(transitions[0], instance, ...message);

				result = true;
			} else if (transitions.length > 1) {
				logger.error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
			}
		}
	}

	return result;
}

/** @hidden */
function traverse(origin: Transition, instance: IInstance, ...message: Array<any>) {
	let onTraverse = [...origin.onTraverse];
	let transition: Transition = origin;

	while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
		transition = selectTransition(transition.target, instance, ...message);

		onTraverse.push(...transition.onTraverse);
	}

	invoke(onTraverse, instance, false, ...message);

	if (transition.target) {
		if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
			traverse(selectTransition(transition.target, instance, ...message), instance, ...message);
		}

		else if (transition.target instanceof State && transition.target.isComplete(instance)) {
			evaluate(transition.target, instance, transition.target);
		}
	}
}