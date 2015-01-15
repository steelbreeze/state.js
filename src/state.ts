/* State v5 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
 */
module FSM {
    export interface Guard {
        (message: any, context: IContext): Boolean;
    }
    
    export interface Action {
        (message: any, context: IContext, history: Boolean): any;
    }
    
    export interface Behavior extends Array<Action> {
    }
        
    function invoke(behavior: Behavior, message: any, context: IContext, history: Boolean): void {
        for (var i = 0, l = behavior.length; i < l; i++) {
            behavior[i](message, context, history);
        }
    }
    
    // DONE: TODO: remove this line
    export interface IContext {
        isTerminated: Boolean;
        setCurrent(region: StateMachineElement, value: State): void;
        getCurrent(region: StateMachineElement): State;
    }

    // DONE: TODO: remove this line
    interface StateDictionary {
        [index: string]: State;
    }

    // DONE: TODO: remove this line
    export class DictionaryContext implements IContext {
        private last: StateDictionary = {};

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

    // DONE: TODO: remove this line
    export class NamedElement {
        public static namespaceSeperator = ".";
        qualifiedName: string;

        constructor( public name: string, parent: NamedElement) {
            this.qualifiedName = parent ? parent.qualifiedName + NamedElement.namespaceSeperator + name : name;
        }

        toString(): String {
            return this.qualifiedName;
        }
    }

    // DONE: TODO: remove this line
    export class StateMachineElement extends NamedElement {
        root: StateMachine;
        leave: Behavior;
        beginEnter: Behavior;
        endEnter: Behavior;
        enter: Behavior;

        constructor(name: string, public parent: StateMachineElement) {
            super(name, parent);

            if(parent) {
                this.root = parent.root;
            }

            this.reset();
        }

        ancestors(): Array<StateMachineElement> {
            return (this.parent ? this.parent.ancestors() : []).concat(this);
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

        bootstrapEnter(traverse: Behavior, next: StateMachineElement) {
            traverse = traverse.concat(this.beginEnter);
        }
    }

    // DONE: TODO: remove this line
    export class Vertex extends StateMachineElement {
        transitions: Array<Transition> = [];
        selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition;      

        constructor(name: string, parent: Region, selector: (transitions: Array<Transition>, message: any, context: IContext) => Transition) {
            super(name, parent);

            this.selector = selector;
            
            if (parent) {
                parent.vertices.push(this);

                this.root.clean = false;
            }
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

    // DONE: TODO: remove this line
    export class Region extends StateMachineElement {
        static defaultName: string = "default";
        vertices: Array<Vertex> = [];
        initial: PseudoState;
        
        constructor(name: string, parent: State) {
            super(name, parent);

            parent.regions.push(this);
            this.root.clean = false; // TODO: move into StateMachineElement?
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

    // DONE: TODO: remove this line
    export enum PseudoStateKind {
        Choice,
        DeepHistory,
        Initial,
        Junction,
        ShallowHistory,
        Terminate
    }

    // DONE: TODO: remove this line
    export class PseudoState extends Vertex {
        constructor(name: string, parent: Region, public kind: PseudoStateKind) {
            super(name, parent, pseudoState(kind));

            if (this.isInitial()) {
                parent.initial = this;
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

    // DONE: TODO: remove this line
    export class State extends Vertex {
        regions: Array<Region> = [];
        exitActions: Behavior = [];
        entryActions: Behavior = [];

        constructor(name: string, parent: Region) {
            super(name, parent, state);
        }

        exit<TMessage>(exitAction: Action): State {
            this.exitActions.push(exitAction);

            this.root.clean = false;

            return this;
        }

        entry<TMessage>(entryAction: Action): State {
            this.entryActions.push(entryAction);

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

            this.leave = this.leave.concat(this.exitActions);
            this.beginEnter = this.beginEnter.concat(this.entryActions);

            this.beginEnter.push((message: any, context: IContext, history: Boolean) => { context.setCurrent(this.parent, this); });

            this.enter = this.beginEnter.concat(this.endEnter);
        }

        bootstrapTransitions(): void {
            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                this.regions[i].bootstrapTransitions();
            }

            super.bootstrapTransitions();
        }

        bootstrapEnter(traverse: Behavior, next: StateMachineElement) {
            super.bootstrapEnter(traverse, next);

            for( var i:number = 0, l:number = this.regions.length; i < l; i++) {
                var region: Region = this.regions[i];

                if (region !== next) {
                    traverse = traverse.concat(region.enter);
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
        constructor(name: string, parent: Region) {
            super(name, parent);
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
        actions: Behavior = [];
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
            this.actions.push(transitionAction);

            this.source.root.clean = false;

            return this;
        }

        bootstrap(): void {
            if (this.target === null) { // internal transitions: just the actions
                this.traverse = this.actions;
            } else if (this.target.parent === this.source.parent) { // local transitions: exit and enter with no complexity
                this.traverse = this.source.leave.concat(this.actions).concat(this.target.enter);
            } else { // complex external transition
                var sourceAncestors = this.source.ancestors();
                var targetAncestors = this.target.ancestors();
                var i: number = 0, l: number = Math.min(sourceAncestors.length, targetAncestors.length);

                // find the index of the first uncommon ancestor
                while((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    ++i;
                }

                // TODO: assert common ancestor is a region

                // leave the first uncommon ancestor
                this.traverse = (i < sourceAncestors.length ? sourceAncestors[i] : this.source).leave;

                // perform the transition action
                this.traverse = this.traverse.concat(this.actions);

                // enter the target ancestry
                while(i < targetAncestors.length) {
                    targetAncestors[i++].bootstrapEnter(this.traverse, targetAncestors[i]);
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
        
    function state(transitions: Array<Transition>, message: any, context: IContext): Transition {
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
}