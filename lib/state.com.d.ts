declare var async: any;
declare var EventProxy: any;
declare module StateJS {
    /**
     * Declaration for callbacks that provide state entry, state exit and transition behavior.
     * @interface Action
     * @param {any} message The message that may trigger the transition.
     * @param {IInstance} instance The state machine instance.
     * @param {boolean} history Internal use only
     * @returns {any} Actions can return any value.
     */
    interface Action {
        (message?: any, instance?: IInstance, history?: boolean, callback?: any): any;
    }
}
declare module StateJS {
    class Behavior {
        private actions;
        count: number;
        private myactions;
        /**
         * Creates a new instance of the Behavior class.
         * @param {Behavior} behavior The copy constructor; omit this optional parameter for a simple constructor.
         */
        constructor(behavior?: Behavior);
        toString(): number;
        /**
         * Adds a single Action callback to this behavior instance.
         * @method push
         * @param {Action} action The Action callback to add to this behavior instance.
         * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
         */
        push(action: Action): Behavior;
        /**
         * Adds the set of Actions callbacks in a Behavior instance to this behavior instance.
         * @method push
         * @param {Behavior} behavior The  set of Actions callbacks to add to this behavior instance.
         * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
         */
        push(behavior: Behavior): Behavior;
        /**
         * Adds an Action or set of Actions callbacks in a Behavior instance to this behavior instance.
         * @method push
         * @param {Behavior} behavior The Action or set of Actions callbacks to add to this behavior instance.
         * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
         */
        /**
         * 添加需要并行的块
         */
        push(behavior: any, sort: string): Behavior;
        /**
         * Tests the Behavior instance to see if any actions have been defined.
         * @method hasActions
         * @returns {boolean} True if there are actions defined within this Behavior instance.
         */
        hasActions(): boolean;
        /**
         * Invokes all the action callbacks in this Behavior instance.
         * @method invoke
         * @param {any} message The message that triggered the transition.
         * @param {IInstance} instance The state machine instance.
         * @param {boolean} history Internal use only
         */
        invoke(message: any, instance: IInstance, history?: boolean, callback?: any): any;
    }
}
declare module StateJS {
    /**
     * Declaration callbacks that provide transition guard conditions.
     * @interface Guard
     * @param {any} message The message that may trigger the transition.
     * @param {IInstance} instance The state machine instance.
     * @param {boolean} history Internal use only
     * @returns {boolean} True if the guard condition passed.
     */
    interface Guard {
        (message?: any, instance?: IInstance): boolean;
    }
}
declare module StateJS {
    /**
     * An enumeration of static constants that dictates the precise behavior of pseudo states.
     *
     * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
     * @class PseudoStateKind
     */
    enum PseudoStateKind {
        /**
         * Used for pseudo states that are always the staring point when entering their parent region.
         * @member {PseudoStateKind} Initial
         */
        Initial = 0,
        /**
         * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
         * @member {PseudoStateKind} ShallowHistory
         */
        ShallowHistory = 1,
        /**
         * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
         * @member {PseudoStateKind} DeepHistory
         */
        DeepHistory = 2,
        /**
         * Enables a dynamic conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many transitions are found, an arbitary one will be selected and traversed;
         * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {PseudoStateKind} Choice
         */
        Choice = 3,
        /**
         * Enables a static conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {PseudoStateKind} Junction
         */
        Junction = 4,
        /**
         * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
         * @member {PseudoStateKind} Terminate
         */
        Terminate = 5,
    }
}
declare module StateJS {
    /**
     * An enumeration of static constants that dictates the precise behavior of transitions.
     *
     * Use these constants as the `kind` parameter when creating new `Transition` instances.
     * @class TransitionKind
     */
    enum TransitionKind {
        /**
         * The transition, if triggered, occurs without exiting or entering the source state.
         * Thus, it does not cause a state change. This means that the entry or exit condition of the source state will not be invoked.
         * An internal transition can be taken even if the state machine is in one or more regions nested within this state.
         * @member {TransitionKind} Internal
         */
        Internal = 0,
        /**
         * The transition, if triggered, will not exit the composite (source) state, but will enter the non-active target vertex ancestry.
         * @member {TransitionKind} Local
         */
        Local = 1,
        /**
         * The transition, if triggered, will exit the source vertex.
         * @member {TransitionKind} External
         */
        External = 2,
    }
}
declare module StateJS {
    /**
     * An abstract class used as the base for the Region and Vertex classes.
     * An element is a node within the tree structure that represents a composite state machine model.
     * @class Element
     */
    class Element {
        /**
         * The symbol used to separate element names within a fully qualified name.
         * Change this static member to create different styles of qualified name generated by the toString method.
         * @member {string}
         */
        static namespaceSeparator: string;
        /**
         * The name of the element.
         * @member {string}
         */
        name: string;
        /**
         * The fully qualified name of the element.
         * @member {string}
         */
        qualifiedName: string;
        /**
         * Creates a new instance of the element class.
         * @param {string} name The name of the element.
         */
        constructor(name: string, parent: Element);
        /**
         * Returns a the element name as a fully qualified namespace.
         * @method toString
         * @returns {string}
         */
        toString(): string;
    }
}
declare module StateJS {
    /**
     * An element within a state machine model that is a container of Vertices.
     *
     * Regions are implicitly inserted into composite state machines as a container for vertices.
     * They only need to be explicitly defined if orthogonal states are required.
     *
     * Region extends the Element class and inherits its public interface.
     * @class Region
     * @augments Element
     */
    class Region extends Element {
        /**
         * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
         * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
         * Update this static member to use a different name for default regions.
         * @member {string}
         */
        static defaultName: string;
        /**
         * The parent state of this region.
         * @member {Region}
         */
        state: State;
        /**
         * The set of vertices that are children of the region.
         * @member {Array<Vertex>}
         */
        vertices: Array<Vertex>;
        /**
         * Creates a new instance of the Region class.
         * @param {string} name The name of the region.
         * @param {State} state The parent state that this region will be a child of.
         */
        constructor(name: string, state: State);
        /**
         * Returns the root element within the state machine model.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        getRoot(): StateMachine;
        /**
         * Accepts an instance of a visitor and calls the visitRegion method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
     *
     * Vertex extends the Element class and inherits its public interface.
     * @class Vertex
     * @augments Element
     */
    class Vertex extends Element {
        /**
         * The parent region of this vertex.
         * @member {Region}
         */
        region: Region;
        /**
         * The set of transitions from this vertex.
         * @member {Array<Transition>}
         */
        outgoing: Array<Transition>;
        /**
         * Creates a new instance of the Vertex class.
         * @param {string} name The name of the vertex.
         * @param {Element} parent The parent region or state.
         */
        constructor(name: string, parent: Element);
        ancestry(): Array<Vertex>;
        /**
         * Returns the root element within the state machine model.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        getRoot(): StateMachine;
        /**
         * Creates a new transition from this vertex.
         * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
         * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
         * @method to
         * @param {Vertex} target The destination of the transition; omit for internal transitions.
         * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
         * @returns {Transition} The new transition object.
         */
        to(target?: Vertex, kind?: TransitionKind): Transition;
        /**
         * Accepts an instance of a visitor.
         * @method accept
         * @param {Visitor<TArg>} visitor The visitor instance.
         * @param {TArg} arg An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     *
     * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
     * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
     * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
     *
     * PseudoState extends the Vertex class and inherits its public interface.
     * @class PseudoState
     * @augments Vertex
     */
    class PseudoState extends Vertex {
        /**
         * The kind of the pseudo state which determines its use and behavior.
         * @member {PseudoStateKind}
         */
        kind: PseudoStateKind;
        /**
         * Creates a new instance of the PseudoState class.
         * @param {string} name The name of the pseudo state.
         * @param {Element} parent The parent element that this pseudo state will be a child of.
         * @param {PseudoStateKind} kind Determines the behavior of the PseudoState.
         */
        constructor(name: string, parent: Element, kind?: PseudoStateKind);
        /**
         * Tests a pseudo state to determine if it is a history pseudo state.
         * History pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
         * @method isHistory
         * @returns {boolean} True if the pseudo state is a history pseudo state.
         */
        isHistory(): boolean;
        /**
         * Tests a pseudo state to determine if it is an initial pseudo state.
         * Initial pseudo states are of kind: Initial, ShallowHisory, or DeepHistory.
         * @method isInitial
         * @returns {boolean} True if the pseudo state is an initial pseudo state.
         */
        isInitial(): boolean;
        /**
         * Accepts an instance of a visitor and calls the visitPseudoState method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     *
     * States are one of the fundamental building blocks of the state machine model.
     * Behavior can be defined for both state entry and state exit.
     *
     * State extends the Vertex class and inherits its public interface.
     * @class State
     * @augments Vertex
     */
    class State extends Vertex {
        exitBehavior: Behavior;
        entryBehavior: Behavior;
        /**
         * The set of regions under this state.
         * @member {Array<Region>}
         */
        regions: Array<Region>;
        /**
         * Creates a new instance of the State class.
         * @param {string} name The name of the state.
         * @param {Element} parent The parent state that owns the state.
         */
        constructor(name: string, parent: Element);
        /**
         * Returns the default region for the state.
         * Note, this will create the default region if it does not already exist.
         * @method defaultRegion
         * @returns {Region} The default region.
         */
        defaultRegion(): Region;
        /**
         * Tests the state to see if it is a final state;
         * a final state is one that has no outbound transitions.
         * @method isFinal
         * @returns {boolean} True if the state is a final state.
         */
        isFinal(): boolean;
        /**
         * Tests the state to see if it is a simple state;
         * a simple state is one that has no child regions.
         * @method isSimple
         * @returns {boolean} True if the state is a simple state.
         */
        isSimple(): boolean;
        /**
         * Tests the state to see if it is a composite state;
         * a composite state is one that has one or more child regions.
         * @method isComposite
         * @returns {boolean} True if the state is a composite state.
         */
        isComposite(): boolean;
        /**
         * Tests the state to see if it is an orthogonal state;
         * an orthogonal state is one that has two or more child regions.
         * @method isOrthogonal
         * @returns {boolean} True if the state is an orthogonal state.
         */
        isOrthogonal(): boolean;
        /**
         * Adds behavior to a state that is executed each time the state is exited.
         * @method exit
         * @param {Action} exitAction The action to add to the state's exit behavior.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        exit(exitAction: Action): State;
        /**
         * Adds behavior to a state that is executed each time the state is entered.
         * @method entry
         * @param {Action} entryAction The action to add to the state's entry behavior.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        entry(entryAction: Action): State;
        /**
         * Accepts an instance of a visitor and calls the visitState method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     *
     * A final state cannot have outbound transitions.
     *
     * FinalState extends the State class and inherits its public interface.
     * @class FinalState
     * @augments State
     */
    class FinalState extends State {
        /**
         * Creates a new instance of the FinalState class.
         * @param {string} name The name of the final state.
         * @param {Element} parent The parent element that owns the final state.
         */
        constructor(name: string, parent: Element);
        /**
         * Accepts an instance of a visitor and calls the visitFinalState method on it.
         * @method accept
         * @param {Visitor<TArg>} visitor The visitor instance.
         * @param {TArg} arg An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * An element within a state machine model that represents the root of the state machine model.
     *
     * StateMachine extends the State class and inherits its public interface.
     * @class StateMachine
     * @augments State
     */
    class StateMachine extends State {
        clean: boolean;
        onInitialise: Behavior;
        /**
         * Creates a new instance of the StateMachine class.
         * @param {string} name The name of the state machine.
         */
        constructor(name: string);
        /**
         * Returns the root element within the state machine model.
         * Note that if this state machine is embeded within another state machine, the ultimate root element will be returned.
         * @method getRoot
         * @returns {StateMachine} The root state machine element.
         */
        getRoot(): StateMachine;
        /**
         * Accepts an instance of a visitor and calls the visitStateMachine method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     *
     * Transitions come in a variety of types:
     * internal transitions respond to messages but do not cause a state transition, they only have behavior;
     * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
     * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
     *
     * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
     * @class Transition
     */
    class Transition {
        static TrueGuard: () => boolean;
        static FalseGuard: () => boolean;
        guard: Guard;
        transitionBehavior: Behavior;
        onTraverse: Behavior;
        /**
         * The source of the transition.
         * @member {Vertex}
         */
        source: Vertex;
        /**
         * The target of the transition.
         * @member {Vertex}
         */
        target: Vertex;
        /**
         * The kind of the transition which determines its behavior.
         * @member {TransitionKind}
         */
        kind: TransitionKind;
        /**
         * Creates a new instance of the Transition class.
         * @param {Vertex} source The source of the transition.
         * @param {Vertex} source The target of the transition; this is an optional parameter, omitting it will create an Internal transition.
         * @param {TransitionKind} kind The kind the transition; use this to set Local or External (the default if omitted) transition semantics.
         */
        constructor(source: Vertex, target?: Vertex, kind?: TransitionKind);
        /**
         * Turns a transition into an else transition.
         *
         * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
         * @method else
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        else(): Transition;
        /**
         * Defines the guard condition for the transition.
         * @method when
         * @param {Guard} guard The guard condition that must evaluate true for the transition to be traversed.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        when(guard: Guard): Transition;
        /**
         * Add behavior to a transition.
         * @method effect
         * @param {Action} transitionAction The action to add to the transitions traversal behavior.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        effect(transitionAction: Action): Transition;
        /**
         * Accepts an instance of a visitor and calls the visitTransition method on it.
         * @method accept
         * @param {Visitor<TArg1>} visitor The visitor instance.
         * @param {TArg1} arg1 An optional argument to pass into the visitor.
         * @param {any} arg2 An optional argument to pass into the visitor.
         * @param {any} arg3 An optional argument to pass into the visitor.
         * @returns {any} Any value can be returned by the visitor.
         */
        accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Returns a the transition name.
         * @method toString
         * @returns {string}
         */
        toString(): string;
    }
}
declare module StateJS {
    /**
     * Implementation of a visitor pattern.
     * @class Visitor
     */
    class Visitor<TArg1> {
        /**
         * Visits an element within a state machine model.
         * @method visitElement
         * @param {Element} element the element being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitElement(element: Element, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a region within a state machine model.
         * @method visitRegion
         * @param {Region} region The region being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitRegion(region: Region, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a vertex within a state machine model.
         * @method visitVertex
         * @param {Vertex} vertex The vertex being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitVertex(vertex: Vertex, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a pseudo state within a state machine model.
         * @method visitPseudoState
         * @param {PseudoState} pseudoState The pseudo state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitPseudoState(pseudoState: PseudoState, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a state within a state machine model.
         * @method visitState
         * @param {State} state The state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitState(state: State, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a final state within a state machine model.
         * @method visitFinal
         * @param {FinalState} finalState The final state being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitFinalState(finalState: FinalState, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a state machine within a state machine model.
         * @method visitVertex
         * @param {StateMachine} state machine The state machine being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitStateMachine(model: StateMachine, arg1?: TArg1, arg2?: any, arg3?: any): any;
        /**
         * Visits a transition within a state machine model.
         * @method visitTransition
         * @param {Transition} transition The transition being visited.
         * @param {TArg1} arg1 An optional parameter passed into the accept method.
         * @param {any} arg2 An optional parameter passed into the accept method.
         * @param {any} arg3 An optional parameter passed into the accept method.
         * @returns {any} Any value may be returned when visiting an element.
         */
        visitTransition(transition: Transition, arg1?: TArg1, arg2?: any, arg3?: any): any;
    }
}
declare module StateJS {
    /**
     * Interface for the state machine instance; an object used as each instance of a state machine (as the classes in this library describe a state machine model). The contents of objects that implement this interface represents the Ac
     * @interface IInstance
     */
    interface IInstance {
        /**
         * @member {boolean} isTerminated Indicates that the state machine instance has reached a terminate pseudo state and therfore will no longer evaluate messages.
         */
        isTerminated: boolean;
        /**
         * Updates the last known state for a given region.
         * @method setCurrent
         * @param {Region} region The region to update the last known state for.
         * @param {State} state The last known state for the given region.
         */
        setCurrent(region: Region, state: State): void;
        /**
         * Returns the last known state for a given region.
         * @method getCurrent
         * @param {Region} region The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        getCurrent(region: Region): State;
    }
}
declare module StateJS {
    /**
     * Default working implementation of a state machine instance class.
     *
     * Implements the `IInstance` interface.
     * It is possible to create other custom instance classes to manage state machine state in other ways (e.g. as serialisable JSON); just implement the same members and methods as this class.
     * @class StateMachineInstance
     * @implements IInstance
     */
    class StateMachineInstance implements IInstance {
        private last;
        /**
         * The name of the state machine instance.
         * @member {string}
         */
        name: string;
        /**
         * Indicates that the state manchine instance reached was terminated by reaching a Terminate pseudo state.
         * @member isTerminated
         */
        isTerminated: boolean;
        /**
         * Creates a new instance of the state machine instance class.
         * @param {string} name The optional name of the state machine instance.
         */
        constructor(name?: string);
        setCurrent(region: Region, state: State): void;
        getCurrent(region: Region): State;
        /**
         * Returns the name of the state machine instance.
         * @method toString
         * @returns {string} The name of the state machine instance.
         */
        toString(): string;
    }
}
/**
 * Created by y50-70 on 2015/12/30.
 */
declare namespace StateJS {
    namespace myStateJS {
        interface Configure {
            states: Array<State>;
            events?: any;
            callbacks?: any;
        }
        interface State {
            name: string;
            kind?: PseudoStateKind;
            regions?: Regions;
        }
        interface Regions {
            [index: string]: Array<State>;
        }
        interface CallBack {
        }
        interface Events {
            name: string;
            from: string;
            to: string;
        }
    }
}
declare module StateJS {
    /**
     * The methods that state.js may use from a console implementation. Create objects that ahdere to this interface for custom logging, warnings and error handling.
     * @interface IConsole
     */
    interface IConsole {
        /**
         * Outputs a log message.
         * @method log
         * @param {any} message The object to log.
         */
        log(message?: any, ...optionalParams: any[]): void;
        /**
         * Outputs a warnnig warning.
         * @method log
         * @param {any} message The object to log.
         */
        warn(message?: any, ...optionalParams: any[]): void;
        /**
         * Outputs an error message.
         * @method log
         * @param {any} message The object to log.
         */
        error(message?: any, ...optionalParams: any[]): void;
    }
}
declare module StateJS {
    /**
     * Sets a method to select an integer random number less than the max value passed as a parameter.
     *
     * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
     * @function setRandom
     * @param {function} generator A function that takes a max value and returns a random number between 0 and max - 1.
     * @returns A random number between 0 and max - 1
     */
    function setRandom(generator: (max: number) => number): void;
    /**
     * Returns the current method used to select an integer random number less than the max value passed as a parameter.
     *
     * This is only useful when a custom random number generator is required; the default implementation is fine in most circumstances.
     * @function getRandom
     * @returns {function} The function that takes a max value and returns a random number between 0 and max - 1.
     */
    function getRandom(): (max: number) => number;
}
declare module StateJS {
    /**
     * Determines if a vertex is currently active; that it has been entered but not yet exited.
     * @function isActive
     * @param {Vertex} vertex The vertex to test.
     * @param {IInstance} instance The instance of the state machine model.
     * @returns {boolean} True if the vertex is active.
     */
    function isActive(vertex: Vertex, instance: IInstance): boolean;
}
declare module StateJS {
    /**
     * Tests an element within a state machine instance to see if its lifecycle is complete.
     * @function isComplete
     * @param {Element} element The element to test.
     * @param {IInstance} instance The instance of the state machine model to test for completeness.
     * @returns {boolean} True if the element is complete.
     */
    function isComplete(element: Element, instance: IInstance): boolean;
}
declare module StateJS {
    /**
     * Initialises a state machine and/or state machine model.
     *
     * Passing just the state machine model will initialise the model, passing the model and instance will initialse the instance and if necessary, the model.
     * @function initialise
     * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
     * @param {IInstance} instance The optional state machine instance to initialise.
     * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
     */
    function initialise(model: StateMachine, instance?: IInstance, autoInitialiseModel?: boolean, callback?: any): void;
    /**
     * Passes a message to a state machine for evaluation; messages trigger state transitions.
     * @function evaluate
     * @param {StateMachine} model The state machine model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
     * @param {IInstance} instance The instance of the state machine model to evaluate the message against.
     * @param {boolean} autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
     * @returns {boolean} True if the message triggered a state transition.
     */
    function evaluate(model: StateMachine, instance: IInstance, message: any, autoInitialiseModel?: boolean, callback?: any): boolean;
    /**
     * The object used for log, warning and error messages
     * @member {IConsole}
     */
    var console: IConsole;
}
declare module StateJS {
    /**
     * Validates a state machine model for correctness (see the constraints defined within the UML Superstructure specification).
     * @function validate
     * @param {StateMachine} model The state machine model to validate.
     */
    function validate(model: StateMachine): void;
}
/**
 * Created by y50-70 on 2015/12/30.
 */
declare namespace StateJS {
    var Queue: any;
    function create(cfg: myStateJS.Configure): void;
}
declare var module: any;
