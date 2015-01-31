/** State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */
module FSM {
    /**
     * Enumeration describing the various types of PseudoState allowed.
     */
    export enum PseudoStateKind {
        Choice,
        DeepHistory,
        Initial,
        Junction,
        ShallowHistory,
        Terminate
    }

    /**
     * Type signature for guard conditions used by Transitions.
     */
    export interface Guard {
        (message: any, context: IContext): Boolean;
    }

    /**
     * Type signature for an action performed durin Transitions.
     */
    export interface Action {
        (message: any, context: IContext, history: Boolean): any;
    }

    /**
     * Type signature for a set of actions performed during Transitions.
     */
    export interface Behavior extends Array<Action> {
    }

    /**
     * Interface for the state machine context; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
     */
    export interface IContext {
        isTerminated: Boolean;
        setCurrent(region: Region, value: State): void;
        getCurrent(region: Region): State;
    }

    /**
     * An abstract class that can be used as the base for any elmeent with a state machine.
     */
    export class Element {
        public static namespaceSeperator = ".";
        public root: StateMachine;
        leave: Behavior = [];
        beginEnter: Behavior= [];
        endEnter: Behavior =[];
        enter: Behavior = [];
        parent: () => Element; // NOTE: an apprach to an abstract method, implemented by both immediate subclasses

        constructor(public name: string, element: Element) {    
            if(element) {
                this.root = element.root;
                this.root.clean = false;
            }
        }
        
        ancestors(): Array<Element> {
            return (this.parent() ? this.parent().ancestors() : []).concat(this);
        }

        reset(): void {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            // Put these lines back for debugging
            //this.leave.push((message: any, context: IContext) => { console.log(context + " leave " + this); });
            //this.beginEnter.push((message: any, context: IContext) => { console.log(context + " enter " + this); });

            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapEnter(add: (additional: Behavior) => void, next: Element) {
            add(this.beginEnter);
        }
        
         toString(): string {
            return this.ancestors().map<string>((e)=> { return e.name; }).join(Element.namespaceSeperator); // NOTE: while this may look costly, only used at runtime rarely if ever
        }
    }

    /**
     * An element within a state machine model that is a container of Vertices.
     */
    export class Region extends Element {
        public static defaultName: string = "default";
        public  vertices: Array<Vertex> = [];
        public initial: PseudoState;
        
        constructor(name: string, public state: State) {
            super(name, state);
            
            state.regions.push(this);
                        
            this.parent = () => { return this.state; };
        }
        
        isComplete(context: IContext): Boolean {
            return context.getCurrent(this).isFinal();
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            for( var i:number = 0, l:number = this.vertices.length; i < l; i++) {
                this.vertices[i].reset();
                this.vertices[i].bootstrap(deepHistoryAbove || (this.initial && this.initial.kind === PseudoStateKind.DeepHistory));
            }

            this.leave.push((message: any, context: IContext, history: Boolean) => { var current = context.getCurrent(this); if (current.leave) { invoke(current.leave, message, context, history); } });

            if (deepHistoryAbove || !this.initial || this.initial.isHistory()) {
                this.endEnter.push((message: any, context: IContext, history: Boolean) => { var ini:Vertex = this.initial; if (history || this.initial.isHistory()) {ini = context.getCurrent(this) || this.initial;} invoke(ini.enter, message, context, history || (this.initial.kind === PseudoStateKind.DeepHistory)); });
            } else {
                this.endEnter = this.endEnter.concat(this.initial.enter);
            }

            super.bootstrap(deepHistoryAbove);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.vertices.length; i < l; i++) {
                this.vertices[i].bootstrapTransitions();
            }
        }
        
        evaluate(message: any, context: IContext): Boolean {
            return context.getCurrent(this).evaluate(message, context);
        }
    }

    /**
     * An element within a state machine model that can be the source or target of a transition.
     */
    export class Vertex extends Element {
        /* protected when I get IDE support */region: Region;
        private transitions: Array<Transition> = [];
        private selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition;      

        constructor(name: string, element: Region, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition);
        constructor(name: string, element: State, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition);
        constructor(name: string, element: any, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition) {
            super(name, element);

            this.selector = selector;
            
            if (element instanceof Region) {                
                this.region = <Region>element;
            } else if (element instanceof State) {
                this.region = (<State>element).defaultRegion();
            }
            
            if (this.region) {
                this.region.vertices.push(this);                
            }
            
            this.parent = () => { return this.region; };
        }
        
        to(target?: Vertex): Transition {
            var transition = new Transition(this, target);

            this.transitions.push(transition);
            this.root.clean = false;

            return transition;
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            super.bootstrap(deepHistoryAbove);

            this.endEnter.push((message: any, context: IContext, history: Boolean) => { this.evaluateCompletions(message, context, history); });
            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.transitions.length; i < l; i++) {
                this.transitions[i].bootstrap();
            }
        }

        evaluateCompletions(message: any, context: IContext, history: Boolean) {
            if (this.isComplete(context)) {
                this.evaluate(this, context);
            }
        }

        isFinal(): Boolean {
            return this.transitions.length === 0;
        }
        
        isComplete(context: IContext): Boolean {
            return true;
        }

        evaluate(message: any, context: IContext): Boolean {
            var transition: Transition = this.selector(this.transitions, message, context);
            
            if (!transition) {
                return false;
            }
            
            invoke(transition.traverse, message, context, false);
                
            return true;
        }
    }

    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    export class PseudoState extends Vertex {
        kind: PseudoStateKind;
        
        constructor(name: string, element: Region, kind: PseudoStateKind);
        constructor(name: string, element: State, kind: PseudoStateKind);
        constructor(name: string, element: any, kind: PseudoStateKind) {
            super(name, element, pseudoState(kind));
            
            this.kind = kind;

            if (this.isInitial()) {
                this.region.initial = this;
            }
        }

        isHistory(): Boolean {
            return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
        }

        isInitial(): Boolean {
            return this.kind === PseudoStateKind.Initial || this.isHistory();
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            super.bootstrap(deepHistoryAbove);

            if (this.kind === PseudoStateKind.Terminate) {
                this.enter.push((message: any, context: IContext, history: Boolean) => { context.isTerminated = true; });
            }
        }
    }

    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     */
    export class State extends Vertex {
        private static selector(transitions: Array<Transition>, message: any, context: IContext): Transition {
            var result: Transition;
                
            for (var i:number = 0, l:number = transitions.length; i < l; i++) {
                if(transitions[i].guard(message, context)) {
                    if(result) {
                        throw "Multiple outbound transitions evaluated true";
                    }

                    result = transitions[i];
                }
            }
        
            return result;
        }
        
        public regions: Array<Region> = [];
        private exitBehavior: Behavior = [];
        private entryBehavior: Behavior = [];

        constructor(name: string, element: Region);
        constructor(name: string, element: State);
        constructor(name: string, element: any) {
            super(name, element, State.selector);
        }

        defaultRegion(): Region {
            var region: Region;            
            
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i].name === Region.defaultName) {
                    region = this.regions[i];
                }
            }
            
            if (!region) {
                region = new Region(Region.defaultName, this);
            }
            
            return region;
        }
        
        exit<TMessage>(exitAction: Action): State {
            this.exitBehavior.push(exitAction);

            this.root.clean = false;

            return this;
        }

        entry<TMessage>(entryAction: Action): State {
            this.entryBehavior.push(entryAction);

            this.root.clean = false;

            return this;
        }

        isSimple(): Boolean {
            return this.regions.length === 0;
        }

        isComposite(): Boolean {
            return this.regions.length > 0;
        }

        isOrthogonal(): Boolean {
            return this.regions.length > 1;
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                var region: Region = this.regions[i]; // regadless of TypeScript, still need this in this instance
                region.reset();
                region.bootstrap(deepHistoryAbove);

                this.leave.push((message: any, context: IContext, history: Boolean) => { invoke(region.leave, message, context, history); });

                this.endEnter = this.endEnter.concat(region.enter);
            }

            super.bootstrap(deepHistoryAbove);

            this.leave = this.leave.concat(this.exitBehavior);
            this.beginEnter = this.beginEnter.concat(this.entryBehavior);

            this.beginEnter.push((message: any, context: IContext, history: Boolean) => { if (this.region) { context.setCurrent(this.region, this); } });

            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                this.regions[i].bootstrapTransitions();
            }

            super.bootstrapTransitions();
        }

        bootstrapEnter(add: (additional: Behavior) => void, next: Element) {
            super.bootstrapEnter(add, next);

            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                if (this.regions[i] !== next) {
                    add(this.regions[i].enter);
                }
            }
        }
        
        evaluate(message: any, context: IContext): Boolean {
            var processed: Boolean = false;
            
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {                
                if(this.regions[i].evaluate(message, context)) {
                    processed = true;
                }
            }
            
            if(processed === false) {
                processed = super.evaluate(message, context);
            }
            
            if(processed === true && message !== this) {
                this.evaluateCompletions(this, context, false);
            }
            
            return processed;
        }
    }

    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     */
    export class FinalState extends State {
        constructor(name: string, element: Region);
        constructor(name: string, element: State);
        constructor(name: string, element: any) {
            super(name, element);
        }
        
        to(target?: Vertex): Transition {
            throw "A FinalState cannot be the source of a transition.";
        }
    }

    /**
     * An element within a state machine model that represents the root of the state machine model.
     */
    export class StateMachine extends State {
        clean: Boolean = true;

        constructor(name: string) {
            super(name, undefined);

            this.root = this;
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            super.bootstrap(deepHistoryAbove);
            super.bootstrapTransitions();

            this.clean = true;
        }

        initialise(context: IContext, autoBootstrap: boolean = true): void {
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }

            invoke(this.enter, undefined, context, false);
        }
        
        evaluate(message: any, context: IContext): Boolean {
            if (context.isTerminated) {
                return false;
            }
            
            return super.evaluate(message, context);
        }
    }

    /**
     * An element within a state machine model that represents a valid transition between vertices in response to a message.
     */
    export class Transition {        
        static isElse: Guard = (message: any, context: IContext): Boolean => { return false; };
        
        public guard: Guard;
        private transitionBehavior: Behavior = [];
        public traverse: Behavior = [];

        constructor(private source: Vertex, private target?: Vertex) {
            this.completion(); // default the transition to a completion transition
        }

        completion(): Transition {
            this.guard = (message: any, context: IContext): Boolean => { return message === this.source; };

            return this;
        }

        else(): Transition {
            this.guard = Transition.isElse;
            
            return this;
        }
        
        when<TMessage>(guard: Guard): Transition {
            this.guard = guard;

            return this;
        }

        effect<TMessage>(transitionAction: Action): Transition {
            this.transitionBehavior.push(transitionAction);

            this.source.root.clean = false;

            return this;
        }

        bootstrap(): void {
            if (this.target === null) { // internal transitions: just the actions
                this.traverse = this.transitionBehavior;
            } else if (this.target.parent() === this.source.parent()) { // local transitions: exit and enter with no complexity
                this.traverse = this.source.leave.concat(this.transitionBehavior).concat(this.target.enter);
            } else { // complex external transition
                var sourceAncestors = this.source.ancestors();
                var targetAncestors = this.target.ancestors();
                var sourceAncestorsLength = sourceAncestors.length;
                var targetAncestorsLength = targetAncestors.length;
                var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);

                // find the index of the first uncommon ancestor
                while((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    i++;
                }

                // validate transition does not cross sibling regions boundaries
                assert(!(sourceAncestors[i] instanceof Region), "Transitions may not cross sibling orthogonal region boundaries");

                // leave the first uncommon ancestor
                this.traverse = (i < sourceAncestorsLength ? sourceAncestors[i] : this.source).leave.slice(0);

                // perform the transition action
                this.traverse = this.traverse.concat(this.transitionBehavior);

                if (i >= targetAncestorsLength ) {
                    this.traverse = this.traverse.concat(this.target.beginEnter);
                }
                                
                // enter the target ancestry
                while(i < targetAncestorsLength) {
                    targetAncestors[i++].bootstrapEnter((additional: Behavior) => { this.traverse = this.traverse.concat(additional); }, targetAncestors[i]);
                }

                // trigger cascade
                this.traverse = this.traverse.concat(this.target.endEnter);
            }
        }
    }

    function pseudoState(kind: PseudoStateKind): (transitions: Array<Transition>, message: any, context: IContext) => Transition {
        switch(kind) {
            
        case PseudoStateKind.Initial:
        case PseudoStateKind.DeepHistory:
        case PseudoStateKind.ShallowHistory:
            return initial;
        
        case PseudoStateKind.Junction:
            return junction;
        
        case PseudoStateKind.Choice:
            return choice;
            
        case PseudoStateKind.Terminate:
            return terminate;
        }
    }
            
    function initial(transitions: Array<Transition>, message: any, context: IContext): Transition {
        if(transitions.length === 1) {
            return transitions[0];
        } else {
            throw "Initial transition must have a single outbound transition";
        }
    }
    
    function junction(transitions: Array<Transition>, message: any, context: IContext): Transition {
        var result: Transition, i: number, l: number = transitions.length;
        
        for(i = 0; i < l; i++) {
            if(transitions[i].guard(message, context) === true) {
                if(result) {
                        throw "Multiple outbound transitions evaluated true";
                }

                result = transitions[i];
            }
        }
        
        if (!result) {
            for(i = 0; i < l; i++) {
                if(transitions[i].guard === Transition.isElse) {
                    if(result) {
                            throw "Multiple outbound transitions evaluated true";
                    }

                    result = transitions[i];
                }
            }
        }
        
        return result;
    }
    
    function choice(transitions: Array<Transition>, message: any, context: IContext): Transition {
        var results: Array<Transition> = [], result: Transition, i: number, l: number = transitions.length;
                
        for(i = 0; i < l; i++) {
            if(transitions[i].guard(message, context) === true) {
                results.push(transitions[i]);
            }
        }

        if (results.length !== 0) {
            result = results[Math.round((results.length - 1) * Math.random())];            
        }
        
        if (!result) {
            for(i = 0; i < l; i++) {
                if(transitions[i].guard === Transition.isElse) {
                    if(result) {
                            throw "Multiple outbound transitions evaluated true";
                    }

                    result = transitions[i];
                }
            }
        }
        
        return result;
    }
    
    function terminate(transitions: Array<Transition>, message: any, context: IContext): Transition {        
        return;
    }
        
    function invoke(behavior: Behavior, message: any, context: IContext, history: Boolean): void {
        for (var i = 0, l = behavior.length; i < l; i++) {
            behavior[i](message, context, history);
        }
    }
      
    function assert(condition: Boolean, error: string): void {
        if (!condition) {
            throw error;
        }
    }
    
    // private interface used within the Context
    interface StateDictionary {
        [index: string]: State;
    }
    
    /**
     * Default working implementation of a state machine context class.
     */
    export class Context implements IContext {
        public isTerminated: Boolean = false;
        private last: StateDictionary = {};

        setCurrent(region: Region, value: State): void {            
            this.last[region.toString()] = value;
        }

        getCurrent(region: Region): State {            
            return this.last[region.toString()];
        }
    }
}
