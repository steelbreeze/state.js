/* State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */

module FSM {    
    export enum PseudoStateKind {
        Choice,
        DeepHistory,
        Initial,
        Junction,
        ShallowHistory,
        Terminate
    }

    export interface Guard {
        (message: any, context: IContext): Boolean;
    }
    
    export interface Action {
        (message: any, context: IContext, history: Boolean): any;
    }
    
    export interface Behavior extends Array<Action> {
    }
        
    export interface IContext {
        isTerminated: Boolean;
        setCurrent(region: Region, value: State): void;
        getCurrent(region: Region): State;
    }

    export class DictionaryContext implements IContext {
        private last = [];

        public isTerminated: Boolean = false;

        constructor(public name: string) {
        }

        setCurrent(region: StateMachineElement, value: State) {
            if(region) {
                this.last[region.qualifiedName] = value;
            }
        }

        getCurrent(region: StateMachineElement) {
            return this.last[region.qualifiedName];
        }

        toString(): string {
            return this.name;
        }
    }

    // TODO: JSON context object - probably better than dictionary
    
    export class NamedElement {
        static namespaceSeperator = ".";
        qualifiedName: string;

        constructor( public name: string, element: NamedElement) {
            this.qualifiedName = element ? element.qualifiedName + NamedElement.namespaceSeperator + name : name;
        }

        toString(): String {
            return this.qualifiedName;
        }
    }

    export class StateMachineElement extends NamedElement {
        root: StateMachine;
        leave: Behavior = [];
        beginEnter: Behavior= [];
        endEnter: Behavior =[];
        enter: Behavior = [];

        constructor(name: string, parentElement: StateMachineElement) {
            super(name, parentElement);

            if(parentElement) {
                this.root = parentElement.root;
                this.root.clean = false;
            }
        }

        parent(): StateMachineElement { return; } // NOTE: this is really an abstract method but there's no construct for it
        
        ancestors(): Array<StateMachineElement> {
            return (this.parent() ? this.parent().ancestors() : []).concat(this);
        }

        reset(): void {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        }

        bootstrap(deepHistoryAbove: Boolean): void {
            // TODO: remove console.log on final release
            this.leave.push((message: any, context: IContext) => { console.log(context + " leave " + this); });
            this.beginEnter.push((message: any, context: IContext) => { console.log(context + " enter " + this); });

            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapEnter(add: (additional: Behavior) => void, next: StateMachineElement) {
            add(this.beginEnter);
        }
    }

    export class Vertex extends StateMachineElement {
        transitions: Array<Transition> = [];
        selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition;      

        constructor(name: string, public region: Region, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition) {
            super(name, region);

            this.selector = selector;
            
            if (region) {
                region.vertices.push(this);
            }
        }

        parent(): StateMachineElement {
            return this.region;
        }
        
        To(target?: Vertex): Transition {
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
            
            if (transition) {
                invoke(transition.traverse, message, context, false);
                
                return true;
            } else {
                return false
            }
        }
    }

    export class Region extends StateMachineElement {
        static defaultName: string = "default";
        vertices: Array<Vertex> = [];
        initial: PseudoState;
        
        constructor(name: string, public state: State) {
            super(name, state);
            
            state.regions.push(this);
        }

        parent(): StateMachineElement {
            return this.state;
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

    export class PseudoState extends Vertex {
        constructor(name: string, region: Region, public kind: PseudoStateKind) {
            super(name, region, pseudoState(kind));

            if (this.isInitial()) {
                region.initial = this;
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

        constructor(name: string, region: Region) {
            super(name, region, State.selector);
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

        isFinal(): Boolean {
            return false;
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
                var region: Region = this.regions[i];
                region.reset();
                region.bootstrap(deepHistoryAbove);

                this.leave.push((message: any, context: IContext, history: Boolean) => { invoke(region.leave, message, context, history); });

                this.endEnter = this.endEnter.concat(region.enter);
            }

            super.bootstrap(deepHistoryAbove);

            this.leave = this.leave.concat(this.exitBehavior);
            this.beginEnter = this.beginEnter.concat(this.entryBehavior);

            this.beginEnter.push((message: any, context: IContext, history: Boolean) => { context.setCurrent(this.region, this); });

            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                this.regions[i].bootstrapTransitions();
            }

            super.bootstrapTransitions();
        }

        bootstrapEnter(add: (additional: Behavior) => void, next: StateMachineElement) {
            super.bootstrapEnter(add, next);

            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                var region: Region = this.regions[i];

                if (region !== next) {
                    add(region.enter);
                }
            }
        }
        
        evaluate(message: any, context: IContext): Boolean {
            var processed: Boolean = false;
            
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                var region: Region = this.regions[i];
                
                if(region.evaluate(message, context)) {
                    processed = true;
                }
            }
            
            if(processed === false) {
                processed = super.evaluate(message, context);
            }
            
            if(processed === true) {
                this.evaluateCompletions(this, context, false);
            }
            
            return processed;
        }
    }

    export class FinalState extends State {
        constructor(name: string, region: Region) {
            super(name, region);
        }

        isFinal(): Boolean {
            return true;
        }
    }

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
    }

    export class Transition { // TODO: implement else transitions
        guard: Guard;
        transitionBehavior: Behavior = [];
        traverse: Behavior = [];

        constructor(private source: Vertex, private target?: Vertex) {
            this.completion(); // default the transition to a completion transition
        }

        isElse(): Boolean {
            return false;
        }
        
        completion(): Transition {
            this.guard = (message: any, context: IContext): Boolean => { return message === this.source; };

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
            } else if (this.target.region === this.source.region) { // local transitions: exit and enter with no complexity
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
            if(transitions[i].isElse() === false) {
                if(transitions[i].guard(message, context) === true) {
                    if(result) {
                            throw "Multiple outbound transitions evaluated true";
                    }
                    
                    result = transitions[i];
                }
            }
        }
        
        if (!result) {
            for(i = 0; i < l; i++) {
                if(transitions[i].isElse() === true) {
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
            if(transitions[i].isElse() === false) {
                
                if(transitions[i].guard(message, context) === true) {
                    results.push(transitions[i]);
                }
            }
        }

        if (results.length !== 0) {
            result = results[Math.round((results.length - 1) * Math.random())];            
        }
        
        if (!result) {
            for(i = 0; i < l; i++) {
                if(transitions[i].isElse() === true) {
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
}