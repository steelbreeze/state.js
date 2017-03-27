import * as Tree from "./tree";

export type Logger = {
	log(message?: any, ...optionalParams: any[]): void;
	error(message?: any, ...optionalParams: any[]): void;
}

export let logger = {
	log(message?: any, ...optionalParams: any[]): void { },
	error(message?: any, ...optionalParams: any[]): void { throw message; }
};

export function setLogger(newLogger: Logger): Logger {
	const result = logger;

	logger = newLogger;

	return result;
}

export type Random = (max: number) => number;

export let random = (max: number) => Math.floor(Math.random() * max);

export function setRandom(newRandom: Random): Random {
	const result = random;

	random = newRandom;

	return result;
}

export var internalTransitionsTriggerCompletion = false;

export function setInternalTransitionsTriggerCompletion(value: boolean): boolean {
	const result = internalTransitionsTriggerCompletion;

	internalTransitionsTriggerCompletion = value;

	return result;
}

export type Guard = (message: any, instance: IInstance) => boolean;

export type Action = (message: any, instance: IInstance, deepHistory?: boolean) => any;

function invoke(actions: Array<Action>, message: any, instance: IInstance, deepHistory: boolean): void {
	for (const action of actions) {
		action(message, instance, deepHistory);
	}
}

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

export interface IElement extends Tree.INode {
	getRoot(): StateMachine;

	isActive(instance: IInstance): boolean; // TODO: remove from here
}

export abstract class Element<TParent extends IElement, TChildren extends IElement> implements IElement, Tree.Node<TParent, TChildren> {
	public static namespaceSeparator = ".";

	public readonly children = new Array<TChildren>();

	public readonly qualifiedName: string;

	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.qualifiedName = parent ? parent.toString() + Element.namespaceSeparator + name : name;
	}

	public getRoot(): StateMachine {
		return this.parent.getRoot();
	}

	public isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance);  // TODO: remove from here
	}

	public accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitElement(this, arg);
	}

	public toString(): string {
		return this.qualifiedName;
	}
}

export class Region extends Element<State | StateMachine, Vertex> {
	public static defaultName = "default";

	public constructor(name: string, parent: State | StateMachine) {
		super(name, parent);

		this.parent.children.push(this);
		this.getRoot().clean = false;
	}

	public isComplete(instance: IInstance): boolean {
		const currentState = instance.getLastKnownState(this);

		return currentState !== undefined && currentState.isFinal();
	}

	public accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitRegion(this, arg);
	}
}

export class Vertex extends Element<Region, Region> {
	readonly outgoing = new Array<Transition>();
	readonly incoming = new Array<Transition>();

	constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent instanceof Region ? parent : State.defaultRegion(parent));

		this.parent.children.push(this);
		this.getRoot().clean = false;
	}

	to(target?: Vertex, kind: TransitionKind = TransitionKind.External): Transition {
		return new Transition(this, target, kind);
	}

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

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitPseudoState(this, arg);
	}
}

export class State extends Vertex {
	static defaultRegion(state: State | StateMachine) {
		for (const region of state.children) {
			if (region.name === Region.defaultName) {
				return region;
			}
		}

		return new Region(Region.defaultName, state);
	}

	readonly entryBehavior = new Array<Action>();
	readonly exitBehavior = new Array<Action>();

	isFinal(): boolean {
		return this.outgoing.length === 0;
	}

	isSimple(): boolean {
		return this.children.length === 0;
	}

	isComposite(): boolean {
		return this.children.length > 0;
	}

	isOrthogonal(): boolean {
		return this.children.length > 1;
	}

	isActive(instance: IInstance): boolean {
		return super.isActive(instance) && instance.getLastKnownState(this.parent) === this;
	}

	isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
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

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitState(this, arg);
	}
}

export class StateMachine implements IElement {
	readonly children = new Array<Region>();
	clean: boolean = false;
	onInitialise = new Array<Action>();
	readonly parent = undefined;

	constructor(public readonly name: string) {
	}

	getRoot(): StateMachine {
		return this;
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitStateMachine(this, arg);
	}

	isActive(instance: IInstance): boolean {
		return true;
	}

	isComplete(instance: IInstance): boolean {
		return this.children.every(region => region.isComplete(instance));
	}

	initialise(instance?: IInstance, autoInitialiseModel: boolean = true): void {
		if (instance) {
			if (autoInitialiseModel && this.clean === false) {
				this.initialise();
			}

			logger.log(`initialise ${instance}`);

			invoke(this.onInitialise, undefined, instance, false);
		} else {
			logger.log(`initialise ${this}`);

			this.accept(new InitialiseStateMachine());

			this.clean = true;
		}
	}

	evaluate(instance: IInstance, message: any, autoInitialiseModel: boolean = true): boolean {
		if (autoInitialiseModel && this.clean === false) {
			this.initialise();
		}

		logger.log(`${instance} evaluate message: ${message}`);

		return evaluate(this, instance, message);
	}

	toString(): string {
		return this.name;
	}
}

export class Transition {
	static Else = (message: any, instance: IInstance) => false;
	effectBehavior = new Array<Action>();
	onTraverse = new Array<Action>();
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

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitTransition(this, arg);
	}

	toString(): string {
		return TransitionKind[this.kind] + "(" + (this.kind === TransitionKind.Internal ? this.source : (this.source + " -> " + this.target)) + ")";
	}
}

export class Visitor<TArg> {
	visitElement(element: IElement, arg?: TArg): void {
	}

	visitRegion(region: Region, arg?: TArg): void {
		for (const vertex of region.children) {
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
		for (const region of state.children) {
			region.accept(this, arg);
		}

		this.visitVertex(state, arg);
	}

	visitStateMachine(stateMachine: StateMachine, arg?: TArg): void {
		for (const region of stateMachine.children) {
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
	leave = new Array<Action>();
	beginEnter = new Array<Action>();
	endEnter = new Array<Action>();
}

class InitialiseStateMachine extends Visitor<boolean> {
	readonly elementActions: { [id: string]: ElementActions } = {};
	readonly transitions = new Array<Transition>();

	getActions(elemenet: IElement): ElementActions {
		return this.elementActions[elemenet.toString()] || (this.elementActions[elemenet.toString()] = new ElementActions());
	}

	visitElement(element: IElement, deepHistoryAbove: boolean): void {
		this.getActions(element).leave.push((message, instance) => logger.log(`${instance} leave ${element}`));
		this.getActions(element).beginEnter.push((message, instance) => logger.log(`${instance} enter ${element}`));
	}

	visitRegion(region: Region, deepHistoryAbove: boolean): void {
		const regionInitial = region.children.reduce<PseudoState | undefined>((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() && (result === undefined || result.isHistory()) ? vertex : result, undefined);

		this.getActions(region).leave.push((message, instance) => {
			const currentState = instance.getCurrent(region);

			if (currentState) {
				invoke(this.getActions(currentState).leave, message, instance, false);
			}
		});

		super.visitRegion(region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it

		if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
			this.getActions(region).endEnter.push((message, instance, deepHistory) => {
				const actions = this.getActions((deepHistory || regionInitial!.isHistory()) ? instance.getLastKnownState(region) || regionInitial! : regionInitial!);
				const history = deepHistory || regionInitial!.kind === PseudoStateKind.DeepHistory;

				invoke(actions.beginEnter, message, instance, history);
				invoke(actions.endEnter, message, instance, history);
			});
		} else {
			this.getActions(region).endEnter = [...this.getActions(region).endEnter, ...this.getActions(regionInitial).beginEnter, ...this.getActions(regionInitial).endEnter];
		}
	}

	visitVertex(vertex: Vertex, deepHistoryAbove: boolean) {
		super.visitVertex(vertex, deepHistoryAbove);

		this.getActions(vertex).beginEnter.push((message, instance) => {
			instance.setCurrent(vertex.parent, vertex);
		});
	}

	visitPseudoState(pseudoState: PseudoState, deepHistoryAbove: boolean) {
		super.visitPseudoState(pseudoState, deepHistoryAbove);

		if (pseudoState.isInitial()) {
			this.getActions(pseudoState).endEnter.push((message, instance, deepHistory) => {
				if (instance.getLastKnownState(pseudoState.parent)) {
					invoke(this.getActions(pseudoState).leave, message, instance, false);

					const currentState = instance.getLastKnownState(pseudoState.parent);

					if (currentState) {
						invoke(this.getActions(currentState).beginEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
						invoke(this.getActions(currentState).endEnter, message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
					}
				} else {
					traverse(pseudoState.outgoing[0], instance);
				}
			});
		}
	}

	visitState(state: State, deepHistoryAbove: boolean) {
		for (const region of state.children) {
			region.accept(this, deepHistoryAbove);

			this.getActions(state).leave = [...this.getActions(state).leave, ...this.getActions(region).leave];
			this.getActions(state).endEnter = [...this.getActions(state).endEnter, ...this.getActions(region).beginEnter, ...this.getActions(region).endEnter];
		}

		this.visitVertex(state, deepHistoryAbove);

		this.getActions(state).leave = [...this.getActions(state).leave, ...state.exitBehavior];
		this.getActions(state).beginEnter = [...this.getActions(state).beginEnter, ...state.entryBehavior];
	}

	visitStateMachine(stateMachine: StateMachine, deepHistoryAbove: boolean): void {
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
			stateMachine.onInitialise = [...stateMachine.onInitialise, ...this.getActions(region).beginEnter, ...this.getActions(region).endEnter];
		}
	}

	visitTransition(transition: Transition, deepHistoryAbove: boolean) {
		super.visitTransition(transition, deepHistoryAbove);

		this.transitions.push(transition);
	}

	visitInternalTransition(transition: Transition): void {
		transition.onTraverse = [...transition.onTraverse, ...transition.effectBehavior];

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
			const targetAncestors = Tree.Ancestors(transition.target!);
			let i = 0;

			while (targetAncestors[i].isActive(instance)) {
				i++;
			}

			if (targetAncestors[i] instanceof Region) {
				throw "Need to implement Region logic";
			}

			const firstToEnter = targetAncestors[i] as State;
			const firstToExit = instance.getCurrent(firstToEnter.parent);

			invoke(this.getActions(firstToExit!).leave, message, instance, false);

			invoke(transition.effectBehavior, message, instance, false);

			while (i < targetAncestors.length) {
				invoke(this.getActions(targetAncestors[i++]).beginEnter, message, instance, false);
			}

			invoke(this.getActions(transition.target!).endEnter, message, instance, false);
		});
	}

	visitExternalTransition(transition: Transition): void {
		const sourceAncestors = Tree.Ancestors(transition.source);
		const targetAncestors = Tree.Ancestors(transition.target!);
		let i = Tree.LCA(sourceAncestors, targetAncestors);

		if (sourceAncestors[i] instanceof Region) {
			i += 1;
		}

		transition.onTraverse = [...transition.onTraverse, ...this.getActions(sourceAncestors[i]).leave, ...transition.effectBehavior];

		while (i < targetAncestors.length) {
			transition.onTraverse = [...transition.onTraverse, ...this.getActions(targetAncestors[i++]).beginEnter];
		}

		transition.onTraverse = [...transition.onTraverse, ...this.getActions(transition.target!).endEnter];
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

function evaluate(state: StateMachine | State, instance: IInstance, message: any): boolean {
	let result = false;

	if (message !== state) {
		state.children.every(region => {
			const currentState = instance.getLastKnownState(region);

			if (currentState && evaluate(currentState, instance, message)) {
				result = true;

				return state.isActive(instance);
			}

			return true;
		});
	}

	if (state instanceof State) {
		if (result) {
			if ((message !== state) && state.isComplete(instance)) {
				evaluate(state, instance, state);
			}
		} else {
			const transitions = state.outgoing.filter(transition => transition.guard(message, instance));

			if (transitions.length === 1) {
				traverse(transitions[0], instance, message);

				result = true;
			} else if (transitions.length > 1) {
				logger.error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
			}
		}
	}

	return result;
}

function traverse(origin: Transition, instance: IInstance, message?: any) {
	let onTraverse = [...origin.onTraverse];
	let transition: Transition = origin;

	while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
		transition = selectTransition(transition.target, instance, message);

		onTraverse = [...onTraverse, ...transition.onTraverse];
	}

	invoke(onTraverse, message, instance, false);

	if (transition.target) {
		if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
			traverse(selectTransition(transition.target, instance, message), instance, message);
		}

		else if (transition.target instanceof State && transition.target.isComplete(instance)) {
			evaluate(transition.target, instance, transition.target);
		}
	}
}