/** The object used for log, warning and error messages. By default, log messages are ignored and errors throw exceptions. */
export let console = {
	log(message?: any, ...optionalParams: any[]): void { },
	error(message?: any, ...optionalParams: any[]): void { throw message; }
};

/**
 * Replace the default console object to implement custom logging.
 * @param newConsole An object to send log, warning and error messages to. THis must implement log and error methods as per the global console object.
 */
export function setConsole(newConsole: {
	log(message?: any, ...optionalParams: any[]): void;
	error(message?: any, ...optionalParams: any[]): void;
}): void {
	console = newConsole;
}

/**Random number generation method. */
export let random: (max: number) => number = (max: number) => Math.floor(Math.random() * max);

/**
 * Sets the  random number generation method.
 * @param value A methos to generate random numbers. 
 */
export function setRandom(value: (max: number) => number): void {
	random = value;
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
export class Actions {
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

export interface Element {
	getAncestors(): Array<Element>;
	getRoot(): StateMachine;
	isActive(instance: IInstance): boolean;
	toString(): string;
}

export abstract class NamedElement<TParent extends Element> implements Element {
	static namespaceSeparator = ".";
	readonly qualifiedName: string;

	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.qualifiedName = parent ? parent.toString() + NamedElement.namespaceSeparator + name : name;
	}

	getAncestors(): Array<Element> {
		return this.parent.getAncestors().concat(this);
	}

	getRoot(): StateMachine {
		return this.parent.getRoot();
	}

	isActive(instance: IInstance): boolean {
		return this.parent.isActive(instance);
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitElement(this, arg);
	}

	toString(): string {
		return this.qualifiedName;
	}
}

export class Region extends NamedElement<State | StateMachine> {
	static defaultName = "default";

	readonly vertices = new Array<Vertex>();

	constructor(name: string, parent: State | StateMachine) {
		super(name, parent);

		this.parent.regions.push(this);
		this.getRoot().clean = false;
	}

	isComplete(instance: IInstance): boolean {
		const currentState = instance.getLastKnownState(this);

		return currentState !== undefined && currentState.isFinal();
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitRegion(this, arg);
	}
}

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

	isActive(instance: IInstance): boolean {
		return super.isActive(instance) && instance.getLastKnownState(this.parent) === this;
	}

	isComplete(instance: IInstance): boolean {
		return this.regions.every(region => region.isComplete(instance));
	}

	exit(action: Behavior) {
		this.exitBehavior.push(action);

		this.getRoot().clean = false;

		return this;
	}

	entry(action: Behavior) {
		this.entryBehavior.push(action);

		this.getRoot().clean = false;

		return this;
	}

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

	getAncestors(): Array<Element> {
		return [this];
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
		return this.regions.every(region => region.isComplete(instance));
	}

	initialise(instance?: IInstance, autoInitialiseModel: boolean = true): void {
		if (instance) {
			if (autoInitialiseModel && this.clean === false) {
				this.initialise();
			}

			console.log(`initialise ${instance}`);

			this.onInitialise.invoke(undefined, instance, false);
		} else {
			console.log(`initialise ${this}`);

			this.accept(new InitialiseStateMachine());

			this.clean = true;
		}
	}

	evaluate(instance: IInstance, message: any, autoInitialiseModel: boolean = true): boolean {
		// initialise the state machine model if necessary
		if (autoInitialiseModel && this.clean === false) {
			this.initialise();
		}

		console.log(`${instance} evaluate message: ${message}`);

		return evaluateStateM(this, instance, message);
	}

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

	effect(action: Behavior) {
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
		this.getActions(element).leave.push((message, instance) => console.log(`${instance} leave ${element}`));
		this.getActions(element).beginEnter.push((message, instance) => console.log(`${instance} enter ${element}`));
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
					evaluateState(transition.source, instance, transition.source);
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

function selectTransition(pseudoState: PseudoState, instance: IInstance, message: any): Transition {
	const transitions = pseudoState.outgoing.filter(transition => transition.guard(message, instance));

	if (pseudoState.kind === PseudoStateKind.Choice) {
		return transitions.length !== 0 ? transitions[random(transitions.length)] : findElse(pseudoState);
	}

	if (transitions.length > 1) {
		console.error(`Multiple outbound transition guards returned true at ${pseudoState} for ${message}`);
	}

	return transitions[0] || findElse(pseudoState);
}

function findElse(pseudoState: PseudoState): Transition {
	return pseudoState.outgoing.filter(transition => transition.guard === Transition.Else)[0];
}

function evaluateStateM(state: StateMachine, instance: IInstance, message: any): boolean {
	let result = false;

	// delegate to child regions first if a non-continuation
	state.regions.every(region => {
		const currentState = instance.getLastKnownState(region);

		if (currentState && evaluateState(currentState, instance, message)) {
			result = true;

			return state.isActive(instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
		}

		return true; // NOTE: this just controls the every loop
	});

	return result;
}


function evaluateState(state: State, instance: IInstance, message: any): boolean {
	let result = false;

	// delegate to child regions first if a non-continuation
	if (message !== state) {
		state.regions.every(region => {
			const currentState = instance.getLastKnownState(region);

			if (currentState && evaluateState(currentState, instance, message)) {
				result = true;

				return state.isActive(instance); // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
			}

			return true; // NOTE: this just controls the every loop
		});
	}

	// if a transition occured in a child region, check for completions
	if (result) {
		if ((message !== state) && state.isComplete(instance)) {
			evaluateState(state, instance, state);
		}
	} else {
		// otherwise look for a transition from this state
		const transitions = state.outgoing.filter(transition => transition.guard(message, instance));

		if (transitions.length === 1) {
			// execute if a single transition was found
			result = traverse(transitions[0], instance, message);
		} else if (transitions.length > 1) {
			// error if multiple transitions evaluated true
			console.error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
		}
	}

	return result;
}

function traverse(origin: Transition, instance: IInstance, message?: any): boolean {
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
			evaluateState(transition.target, instance, transition.target);
		}
	}

	return true;
}
