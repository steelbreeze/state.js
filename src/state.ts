/**
 * state.js version 5 finite state machine.
 * @module state
 */
module state {
    /**
     * An enumeration that dictates the precise behaviour of the PseudoState objects.
     * @enum PseudoStateKind
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
     * @interface Guard
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     * @returns {boolean}
     */
    export interface Guard {
        (message: any, context: IContext): boolean;
    }

    /**
     * Type signature for an action performed durin Transitions.
     * @interface Action
     * @param message {any} The message injected into the state machine for evaluation.
     * @param context {IContext} The object representing a particualr state machine instance.
     * @param history {boolean} For internal use only. 
     * @returns {any} Note that the any return type is used to indicate that the state machine runtime does not care what the return type of actions are.
     */
    export interface Action {
        (message: any, context: IContext, history: boolean): any;
    }

    /**
     * Type signature for a set of actions performed during Transitions.
     * @interface Behavior
     */
    export interface Behavior extends Array<Action> {
    }

    export interface Selector {
        (transitions: Array<Transition>, message: any, context: IContext): Transition;
    }

    /**
     * Interface for the state machine context; an object used as each instance of a state machine (as the classes in this library describe a state machine model).
     * @interface IContext
     */
    export interface IContext {
        /**
         * @member {boolean} isTerminated Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
         */
        isTerminated: boolean;
        
        /**
         * @method setCurrent
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        
        /**
         * @method getCurrent
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }

    /**
     * An abstract class used as the base for regions and vertices (states and pseudo states) with a state machine model.
     * @class Element
     */
    export class Element {
        /**
         * @member {string} namespaceSeperator The symbol used to seperate element names within a fully qualified name.
         */
        public static namespaceSeperator = ".";

        leave: Behavior = [];
        beginEnter: Behavior= [];
        endEnter: Behavior =[];
        enter: Behavior = [];

        constructor(public name: string) {         
        }
        
        parent(): Element {
            return;
        }
        
        root(): StateMachine {
            return this.parent().root();
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

        /**
         * @method toString
         * Returns a the element name as a fully qualified namespace.
         * @returns {string}
         */
         toString(): string {
            return this.ancestors().map<string>((e)=> { return e.name; }).join(Element.namespaceSeperator); // NOTE: while this may look costly, only used at runtime rarely if ever
        }
    }

    /**
     * @class Region
     * An element within a state machine model that is a container of Vertices.
     */
    export class Region extends Element {
        /**
         * @member {string} defaultName The name given to regions thare are created automatically when a state is passed as a vertex's parent.
         */
        public static defaultName: string = "default";
        
        vertices: Array<Vertex> = [];
        initial: PseudoState;

        /**
         * Creates a new instance of the region class.
         * @param name {string} The name of the region.
         * @param state {State} The parent state that the new region is a part of.
        */
        constructor(name: string, public state: State) {
            super(name);
            
            state.regions.push(this);
            
            state.root().clean = false;
        }
        
        parent(): Element {
            return this.state;
        }
        
        /**
         * @method isComplete
         * True if the region is complete; a region is deemed to be complete if its current state is final (having on outbound transitions).
         * @param context {IContext} The object representing a particualr state machine instance.
         * @returns {boolean}
         */
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
     * @class Vertex
     * An element within a state machine model that can be the source or target of a transition.
     */
    export class Vertex extends Element {
        region: Region;

        private transitions: Array<Transition> = [];
        private selector: Selector;      

        constructor(name: string, region: Region, selector: Selector);
        constructor(name: string, state: State, selector: Selector);
        constructor(name: string, element: any, selector: Selector) {
            super(name);

            this.selector = selector;
            
            if (element instanceof Region) {                
                this.region = <Region>element;
            } else if (element instanceof State) {
                this.region = (<State>element).defaultRegion();
            }
            
            if (this.region) {
                this.region.vertices.push(this);
                this.region.root().clean = false;
            }            
        }
        
        parent(): Element {
            return this.region;
        }
        
        /**
         * @method isFinal
         * Tests the vertex to see if it is a final vertex that has no outbound transitions.
         * @returns {boolean}
         */
        isFinal(): boolean {
            return this.transitions.length === 0;
        }
        
        /**
         @method isComplete
         * True of the vertex is deemed to be complete; always true for pseuso states and simple states, true for composite states whose child regions all are complete.
         * @returns {boolean}
         */
        isComplete(context: IContext): boolean {
            return true;
        }

        /**
         * @method to
         * Creates a new transtion from this vertex to the target vertex.
         * @param target {Vertex} The destination of the transition; omit for internal transitions.
         * @returns {Transition}
         */
        to(target?: Vertex): Transition {
            var transition = new Transition(this, target);

            this.transitions.push(transition);
            this.root().clean = false;

            return transition;
        }

        bootstrap(deepHistoryAbove: boolean): void {
            super.bootstrap(deepHistoryAbove);

            this.endEnter.push((message: any, context: IContext, history: boolean) => { this.evaluateCompletions(message, context, history); });
            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for(var i:number = 0, l:number = this.transitions.length; i < l; i++) {
                this.transitions[i].bootstrap();
            }
        }

        evaluateCompletions(message: any, context: IContext, history: boolean) {
            if (this.isComplete(context)) {
                this.evaluate(this, context);
            }
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
     * @class PseudoState
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     */
    export class PseudoState extends Vertex {
        /**
         * @member {PseudoStateKind} kind The specific kind of the pesudo state that drives its behaviour.
         */
        kind: PseudoStateKind;
        
        /** 
         * Creates a new instance of the PseudoState class.
         * @param name {string} The name of the pseudo state.
         * @param region {Region} The parent region that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, region: Region, kind: PseudoStateKind);

        /** 
         * Creates a new instance of the PseudoState class.
         * @param name {string} The name of the pseudo state.
         * @param state {State} The parent state that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
        constructor(name: string, state: State, kind: PseudoStateKind);

        /** 
         * Creates a new instance of the PseudoState class.
         * @param name {string} The name of the pseudo state.
         * @param element {Region|State} The parent element that owns the pseudo state.
         * @param kind {PseudoStateKind} The specific kind of the pesudo state that drives its behaviour.
         */
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
     * @class State
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
        
        regions: Array<Region> = [];        
        private exitBehavior: Behavior = [];
        private entryBehavior: Behavior = [];

        /** 
         * Creates a new instance of the State class.
         * @param name {string} The name of the state.
         * @param region {Region} The parent region that owns the state.
         */
        constructor(name: string, region: Region);
        
        /** 
         * Creates a new instance of the State class.
         * @param name {string} The name of the state.
         * @param state {State} The parent state that owns the state.
         */
        constructor(name: string, state: State);

        /** 
         * Creates a new instance of the State class.
         * @param name {string} The name of the state.
         * @param element {Region|State} The element region that owns the state.
         */
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
        
        /**
         * @method isSimple
         * True if the state is a simple state, one that has no child regions.
         * @returns {boolean}
         */
        isSimple(): boolean {
            return this.regions.length === 0;
        }

        /**
         * @method isComposite
         * True if the state is a composite state, one that child regions.
         * @returns {boolean}
         */
        isComposite(): boolean {
            return this.regions.length > 0;
        }

        /**
         * @method isOrthogonal
         * True if the state is a simple state, one that has more than one child region.
         * @returns {boolean}
         */
        isOrthogonal(): boolean {
            return this.regions.length > 1;
        }

        /**
         * @method exit
         * Adds behaviour to a state that is executed each time the state is exited.
         * @returns {State}
         */
        exit<TMessage>(exitAction: Action): State {
            this.exitBehavior.push(exitAction);

            this.root().clean = false;

            return this;
        }

        /**
         * @method entry
         * Adds behaviour to a state that is executed each time the state is entered.
         * @returns {State}
         */
        entry<TMessage>(entryAction: Action): State {
            this.entryBehavior.push(entryAction);

            this.root().clean = false;

            return this;
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
     * @class FinalState
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     */
    export class FinalState extends State {
        /** 
         * Creates a new instance of the FinalState class.
         * @param name {string} The name of the final state.
         * @param region {Region} The parent region that owns the final state.
         */
        constructor(name: string, region: Region);
        
        /** 
         * Creates a new instance of the FinalState class.
         * @param name {string} The name of the final state.
         * @param state {State} The parent state that owns the final state.
         */
        constructor(name: string, state: State);
        
        /** 
         * Creates a new instance of the FinalState class.
         * @param name {string} The name of the final state.
         * @param element {Region|State} The parent element that owns the final state.
         */
        constructor(name: string, element: any) {
            super(name, element);
        }
        
        to(target?: Vertex): Transition {
            // ensure FinalStates will satisfy the isFinal check
            throw "A FinalState cannot be the source of a transition.";
        }
    }

    /**
     * @class StateMachine
     * An element within a state machine model that represents the root of the state machine model.
     */
    export class StateMachine extends State {
        clean: boolean = true;

        /**
         * Creates a new instance of the StateMachine class.
         * @param name {string} The name of the state machine.
         */
        constructor(name: string) {
            super(name, undefined);
        }

        root(): StateMachine {
            return this;
        }

        /**
         * @method bootstrap
         * Bootstraps the state machine model; precompiles the actions to take during transition traversal.
         * @param deepHistoryAbove {boolean} Internal use only.
         */
        bootstrap(deepHistoryAbove: boolean): void {
            super.reset();
            this.clean = true;

            super.bootstrap(deepHistoryAbove);
            super.bootstrapTransitions();
        }

        /**
         * @method initialise
         * Initialises an instance of the state machine and enters its initial steady state.
         * @param context {IContext} The object representing a particualr state machine instance.
         * @param autoBootstrap {boolean} Set to false to manually control when bootstrapping occurs.
         */
        initialise(context: IContext, autoBootstrap: boolean = true): void {
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }

            invoke(this.enter, undefined, context, false);
        }

        /**
         * @method evaluate
         * Passes a message to a state machine instance for evaluation.
         * @param message {any} A message to pass to a state machine instance for evaluation that may cause a state transition.
         * @param context {IContext} The object representing a particualr state machine instance.
         * @param autoBootstrap {boolean} Set to false to manually control when bootstrapping occurs.
         * @returns {boolean} True if the method caused a state transition.
         */
        evaluate(message: any, context: IContext, autoBootstrap: boolean = true): boolean {
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }

            if (context.isTerminated) {
                return false;
            }
            
            return super.evaluate(message, context);
        }
    }

    /**
     * @class Transition
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     */
    export class Transition {        
        static isElse: Guard = (message: any, context: IContext): boolean => { return false; };
        
        public guard: Guard;                
        private transitionBehavior: Behavior = [];
        traverse: Behavior = [];

        /**
         * Creates a new instance of the Transition class.
         * @param source {Vertex} The source of the transtion.
         * @param target {Vertex} The target of the transtion; omit for internal transitions.
         */
        constructor(private source: Vertex, private target?: Vertex) {
            this.completion(); // default the transition to a completion transition
        }

        /**
        * @method completion
         * Turns a transtion into a completion transition.
         * @returns {Transition}
         */
        completion(): Transition {
            this.guard = (message: any, context: IContext): boolean => { return message === this.source; };

            return this;
        }

        /**
         * @method else
         * Turns a transition into an else transition.
         * @returns {Transition}
         */
        else(): Transition {
            this.guard = Transition.isElse;
            
            return this;
        }

        /**
         * @method when
         * Defines the guard condition for the transition.
         * @param guard {Guard} The guard condition that must evaluate true for the transition to be traversed. 
         * @returns {Transition}
         */
        when(guard: Guard): Transition {
            this.guard = guard;

            return this;
        }

        /**
         * @method effect
         * Add behaviour to a transition.
         * @param transitionAction {Action} The bahaviour to add to the transition.
         * @returns {Transition}
         */
        effect<TMessage>(transitionAction: Action): Transition {
            this.transitionBehavior.push(transitionAction);

            this.source.root().clean = false;
 
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
     * @class Context
     * Default working implementation of a state machine context class.
     */
    export class Context implements IContext {
        public isTerminated: boolean = false;
        private last: StateDictionary = {};

        /**
         * @method setCurrent
         * Updates the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @param state {State} The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void {            
            this.last[region.toString()] = state;
        }

        /**
         * @method getCurrent
         * Returns the last known state for a given region.
         * @param region {Region} The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State {            
            return this.last[region.toString()];
        }
    }
}