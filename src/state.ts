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
	getRoot(): StateMachine;
	toString(): string;
}

export abstract class NamedElement<TParent extends Element> implements Element {
	static namespaceSeparator = ".";
	readonly qualifiedName: string;

	protected constructor(public readonly name: string, public readonly parent: TParent) {
		this.qualifiedName = parent ? parent.toString() + NamedElement.namespaceSeparator + name : name;

		console.log("created " + this);
	}

	getRoot(): StateMachine {
		return this.parent.getRoot();
	}

	toString(): string {
		return this.qualifiedName;
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitElement(this, arg);
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

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitPseudoState(this, arg);
	}
}

export class State extends Vertex {
	readonly regions = new Array<Region>();
	defaultRegion: Region;

	constructor(name: string, parent: Region | State | StateMachine) {
		super(name, parent);
	}

	getDefaultRegion(): Region {
		return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitState(this, arg);
	}
}

export class StateMachine implements Element {
	readonly regions = new Array<Region>();
	defaultRegion: Region | undefined = undefined;
	clean: boolean = false;

	constructor(public readonly name: string) {
	}

	getDefaultRegion(): Region {
		return this.defaultRegion || (this.defaultRegion = new Region(Region.defaultName, this));
	}

	getRoot(): StateMachine {
		return this;
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitStateMachine(this, arg);
	}

	toString(): string {
		return this.name;
	}
}

export class Transition {
	guard: (message: any, instance: IInstance) => boolean;

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

		console.log("created transition from " + source + " to " + target);
	}

	when(guard: (message: any, instance: IInstance) => boolean) {
		this.guard = guard;

		return this;
	}

	accept<TArg>(visitor: Visitor<TArg>, arg?: TArg) {
		visitor.visitTransition(this, arg);
	}
}

export class Visitor<TArg> {
	visitElement(element: Element, arg?: TArg): void {
		console.log("visiting " + element.toString());
	}

	visitRegion(region: Region, arg?: TArg): void {
		this.visitElement(region, arg);
	}

	visitVertex(vertex: Vertex, arg?: TArg): void {
		this.visitElement(vertex, arg);
	}

	visitPseudoState(pseudoState: PseudoState, arg?: TArg): void {
		this.visitVertex(pseudoState, arg);
	}

	visitState(state: State, arg?: TArg): void {
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
	setCurrent(region: Region, state: State): void;

	getCurrent(region: Region): State;
}

