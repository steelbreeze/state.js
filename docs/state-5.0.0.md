# state

State v5 finite state machine library

http://www.steelbreeze.net/state.cs



* * *

## Class: Element
An abstract class used as the base for regions and vertices (states and pseudo states) with a state machine model.

**namespaceSeperator**: `string` , The symbol used to seperate element names within a fully qualified name.
### state.Element.toString() 

Returns a the element name as a fully qualified namespace.

**Returns**: `string`


## Class: Region
An element within a state machine model that is a container of Vertices.

**defaultName**: `string` , The name given to regions thare are created automatically when a state is passed as a vertex's parent.
### state.Region.Region(name, state) 

Creates a new instance of the Region class.

**Parameters**

**name**: `string`, The name of the region.

**state**: `State`, The parent state that this region will be a child of.


### state.Region.isComplete(context) 

True if the region is complete; a region is deemed to be complete if its current state is final (having on outbound transitions).

**Parameters**

**context**: `IContext`, The object representing a particualr state machine instance.

**Returns**: `boolean`


## Class: Vertex
An abstract element within a state machine model that can be the source or target of a transition.

### state.Vertex.isComplete(context) 

True of the vertex is deemed to be complete; always true for pseuso states and simple states, true for composite states whose child regions all are complete.

**Parameters**

**context**: `IContext`, The object representing a particualr state machine instance.

**Returns**: `boolean`

### state.Vertex.to(target) 

Creates a new transtion from this vertex to the target vertex.

**Parameters**

**target**: `Vertex`, The destination of the transition; omit for internal transitions.

**Returns**: `Transition`


## Class: PseudoState
An element within a state machine model that represents an transitory Vertex within the state machine model.

### state.PseudoState.PseudoState(name, state) 

Creates a new instance of the PseudoState class.

**Parameters**

**name**: `string`, The name of the pseudo state.

**state**: `Element`, The parent element that this pseudo state will be a child of.



## Class: State
An element within a state machine model that represents an invariant condition within the life of the state machine instance.

### state.State.isFinal() 

Tests the state to see if it is a final state that has no outbound transitions.

**Returns**: `boolean`

### state.State.isSimple() 

True if the state is a simple state, one that has no child regions.

**Returns**: `boolean`

### state.State.isComposite() 

True if the state is a composite state, one that child regions.

**Returns**: `boolean`

### state.State.isOrthogonal() 

True if the state is a simple state, one that has more than one child region.

**Returns**: `boolean`

### state.State.exit(exitAction) 

Adds behaviour to a state that is executed each time the state is exited.

**Parameters**

**exitAction**: `Action`, The action to add to the state's exit behaviour.

**Returns**: `State`

### state.State.entry(entryAction) 

Adds behaviour to a state that is executed each time the state is entered.

**Parameters**

**entryAction**: `Action`, The action to add to the state's entry behaviour.

**Returns**: `State`


## Class: FinalState
An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.


## Class: StateMachine
An element within a state machine model that represents the root of the state machine model.

### state.StateMachine.bootstrap() 

Bootstraps the state machine model; precompiles the actions to take during transition traversal.


### state.StateMachine.initialise(context, autoBootstrap) 

Initialises an instance of the state machine and enters its initial steady state.

**Parameters**

**context**: `IContext`, The object representing a particualr state machine instance.

**autoBootstrap**: `boolean`, Set to false to manually control when bootstrapping occurs.


### state.StateMachine.evaluate(message, context, autoBootstrap) 

Passes a message to a state machine instance for evaluation.

**Parameters**

**message**: `any`, A message to pass to a state machine instance for evaluation that may cause a state transition.

**context**: `IContext`, The object representing a particualr state machine instance.

**autoBootstrap**: `boolean`, Set to false to manually control when bootstrapping occurs.

**Returns**: `boolean`, True if the method caused a state transition.


## Class: Transition
A transition between vertices (states or pseudo states) that may be traversed in response to a message.

### state.Transition.completion() 

Turns a transtion into a completion transition.

**Returns**: `Transition`

### state.Transition.else() 

Turns a transition into an else transition.

**Returns**: `Transition`

### state.Transition.when(guard) 

Defines the guard condition for the transition.

**Parameters**

**guard**: `Guard`, The guard condition that must evaluate true for the transition to be traversed.

**Returns**: `Transition`

### state.Transition.effect(transitionAction) 

Add behaviour to a transition.

**Parameters**

**transitionAction**: `Action`, The action to add to the transitions traversal behaviour.

**Returns**: `Transition`


## Class: Context
Default working implementation of a state machine context class.

### state.Context.setCurrent(region, state) 

Updates the last known state for a given region.

**Parameters**

**region**: `Region`, The region to update the last known state for.

**state**: `State`, The last known state for the given region.


### state.Context.getCurrent(region) 

Returns the last known state for a given region.

**Parameters**

**region**: `Region`, The region to update the last known state for.

**Returns**: `State`, The last known state for the given region.



* * *










