/* State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */

/**
 * Finite state machine classes
 */
module state {
    /**
     * Enumeration describing the various types of PseudoState allowed.
     */
    export enum PseudoStateKind {
        /** Semantic free vertex used to chain transitions together; if multiple outbound transitions guards evaluate true, an arbitary one is chosen. */
        Choice,
        
        /** The initial vertex selected when the parent region is enterd for the first time, then triggers entry of the last known state for subsiquent entries; history cascades through all child hierarchy. */
        DeepHistory,

        /** The initial vertex selected when the parent region is enterd. */
        Initial,

        /** Semantic free vertex used to chain transitions together; if multiple outbound transitions guards evaluate true, an exception is thrown. */
        Junction,

        /** The initial vertex selected when the parent region is enterd for the first time, then triggers entry of the last known state for subsiquent entries. */
        ShallowHistory,
        
        /** Terminates the execution of the containing state machine; the machine will not evaluate any further messages. */
        Terminate
    }

    /**
     * Type signature for guard conditions used by Transitions.
     * @param message {any} The message injected into the state machine for evaluation
     * @param context {IContext} The object representing a particualr state machine instance
     * @returns {boolean}
     */
    export interface Guard {
        (message: any, context: IContext): boolean;
    }

    /**
     * Type signature for an action performed durin Transitions.
     * @param message {any} The message injected into the state machine for evaluation
     * @param context {IContext} The object representing a particualr state machine instance
     * @param history {boolean} For internal use only. 
     * @returns {any} Note that the any return type is used to indicate that the state machine runtime does not care what the return type of actions are.
     */
    export interface Action {
        (message: any, context: IContext, history: boolean): any;
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
        /**
         * Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
         */
        isTerminated: boolean;
        
        /**
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        
        /**
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }

    /**
     * An abstract class that can be used as the base for any elmeent with a state machine.
     */
    export class Element {
        /**
         * The symbol used to seperate element names within a fully qualified name.
         */
        public static namespaceSeperator = ".";
        
        /**
         * The parent state machine that ultimately owns this element.
         */
        public root: StateMachine;
        
        /**
         * The immediate parent element of this element.
         * @returns {Element}
         */
        parent: () => Element; // NOTE: an apprach to an abstract method, implemented by both immediate subclasses

        leave: Behavior = [];
        beginEnter: Behavior= [];
        endEnter: Behavior =[];
        enter: Behavior = [];

        /**
         * Creates an new instance of an Element.
         * @param name {string} The name of the element.
         * @param element {Element} the parent element of this element.
         */
        constructor(public name: string, element?: Element) {    
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

        bootstrap(deepHistoryAbove: boolean): void {
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
        
        isComplete(context: IContext): boolean {
            return context.getCurrent(this).isFinal();
        }

        bootstrap(deepHistoryAbove: boolean): void {
            for( var i:number = 0, l:number = this.vertices.length; i < l; i++) {
                this.vertices[i].reset();
                this.vertices[i].bootstrap(deepHistoryAbove || (this.initial && this.initial.kind === PseudoStateKind.DeepHistory));
            }

            this.leave.push((message: any, context: IContext, history: boolean) => { var current = context.getCurrent(this); if (current.leave) { invoke(current.leave, message, context, history); } });

            if (deepHistoryAbove || !this.initial || this.initial.isHistory()) {
                this.endEnter.push((message: any, context: IContext, history: boolean) => { var ini:Vertex = this.initial; if (history || this.initial.isHistory()) {ini = context.getCurrent(this) || this.initial;} invoke(ini.enter, message, context, history || (this.initial.kind === PseudoStateKind.DeepHistory)); });
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
        
        evaluate(message: any, context: IContext): boolean {
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

        bootstrap(deepHistoryAbove: boolean): void {
            super.bootstrap(deepHistoryAbove);

            this.endEnter.push((message: any, context: IContext, history: boolean) => { this.evaluateCompletions(message, context, history); });
            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.transitions.length; i < l; i++) {
                this.transitions[i].bootstrap();
            }
        }

        evaluateCompletions(message: any, context: IContext, history: boolean) {
            if (this.isComplete(context)) {
                this.evaluate(this, context);
            }
        }

        isFinal(): boolean {
            return this.transitions.length === 0;
        }
        
        isComplete(context: IContext): boolean {
            return true;
        }

        evaluate(message: any, context: IContext): boolean {
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

        isHistory(): boolean {
            return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
        }

        isInitial(): boolean {
            return this.kind === PseudoStateKind.Initial || this.isHistory();
        }

        bootstrap(deepHistoryAbove: boolean): void {
            super.bootstrap(deepHistoryAbove);

            if (this.kind === PseudoStateKind.Terminate) {
                this.enter.push((message: any, context: IContext, history: boolean) => { context.isTerminated = true; });
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

        isSimple(): boolean {
            return this.regions.length === 0;
        }

        isComposite(): boolean {
            return this.regions.length > 0;
        }

        isOrthogonal(): boolean {
            return this.regions.length > 1;
        }

        bootstrap(deepHistoryAbove: boolean): void {
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                var region: Region = this.regions[i]; // regadless of TypeScript, still need this in this instance
                region.reset();
                region.bootstrap(deepHistoryAbove);

                this.leave.push((message: any, context: IContext, history: boolean) => { invoke(region.leave, message, context, history); });

                this.endEnter = this.endEnter.concat(region.enter);
            }

            super.bootstrap(deepHistoryAbove);

            this.leave = this.leave.concat(this.exitBehavior);
            this.beginEnter = this.beginEnter.concat(this.entryBehavior);

            this.beginEnter.push((message: any, context: IContext, history: boolean) => { if (this.region) { context.setCurrent(this.region, this); } });

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
        
        evaluate(message: any, context: IContext): boolean {
            var processed: boolean = false;
            
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
        clean: boolean = true;

        constructor(name: string) {
            super(name, undefined);

            this.root = this;
        }

        bootstrap(deepHistoryAbove: boolean): void {
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
        
        evaluate(message: any, context: IContext): boolean {
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
        static isElse: Guard = (message: any, context: IContext): boolean => { return false; };
        
        public guard: Guard;
        private transitionBehavior: Behavior = [];
        public traverse: Behavior = [];

        constructor(private source: Vertex, private target?: Vertex) {
            this.completion(); // default the transition to a completion transition
        }

        completion(): Transition {
            this.guard = (message: any, context: IContext): boolean => { return message === this.source; };

            return this;
        }

        else(): Transition {
            this.guard = Transition.isElse;
            
            return this;
        }
        
        when(guard: Guard): Transition {
            this.guard = guard;

            return this;
        }

        effect<TMessage>(transitionAction: Action): Transition {
            this.transitionBehavior.push(transitionAction);

            this.source.root.clean = false;

            return this;
        }

        bootstrap(): void {
            // internal transitions: just perform the actions; no exiting or entering states
            if (this.target === null) {
                this.traverse = this.transitionBehavior;
                
            // local transtions (within the same parent region): simple exit, transition and entry
            } else if (this.target.parent() === this.source.parent()) {
                this.traverse = this.source.leave.concat(this.transitionBehavior).concat(this.target.enter);
                
            // external transitions (crossing region boundaries): exit to the LCA, transition, enter from the LCA
            } else {
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
        
    function invoke(behavior: Behavior, message: any, context: IContext, history: boolean): void {
        for (var i = 0, l = behavior.length; i < l; i++) {
            behavior[i](message, context, history);
        }
    }
      
    function assert(condition: boolean, error: string): void {
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
        public isTerminated: boolean = false;
        private last: StateDictionary = {};

        setCurrent(region: Region, state: State): void {            
            this.last[region.toString()] = state;
        }

        getCurrent(region: Region): State {            
            return this.last[region.toString()];
        }
    }
}