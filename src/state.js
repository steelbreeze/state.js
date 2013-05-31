// Copyright © 2013 Steelbreeze Limited.
//
// state.js is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published
// by the Free Software Foundation, either version 3 of the License,
// or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// returns the only item in an array where the predicate evaluates true
Array.prototype.single = function( predicate )
{
	if( ( results = predicate ? this.filter( predicate ) : this ).length === 1 )
		return results[ 0 ];
	
	throw new Error( "Cannot return zero or more than one elements" );	
};

// returns the only item in an array where the predicate evaluates true or nothing
Array.prototype.singleOrUndefined = function( predicate )
{
	if( ( results = predicate ? this.filter( predicate ) : this ).length === 1 )
		return results[ 0 ];

	if( results.length > 1 )
		throw new Error( "Cannot return more than one elements" );
};

// returns a random element of an array where the predicate evaluates true or nothing
Array.prototype.randomOrUndefined = function( predicate )
{
	if( ( results = predicate ? this.filter( predicate ) : this ).length !== 0 )
		return results[ ( results.length - 1 ) * Math.random() ];
};

var Guard = { True: function() { return true; },
							Else: function() { return false; } };

var Kind =
{
	Choice:         { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions:	function( completions ) { return completions.singleOrUndefined( function( c ) { return g.guard(); } ) || completions.single( function( c ) { return c === Guard.Else; } ) ; } },
	DeepHistory:    { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: true,  getCompletions:	function( completions ) { return completions.single(); }	},
	EntryPoint:     { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: false, getCompletions: function( completions ) { return completions.single(); } },
	ExitPoint:      { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions: function( completions ) { return completions.single( function( c ) { return c.guard(); } ); } },
	Final:          { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState },
	Initial:        { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: false, getCompletions: function( completions ) { return completions.single(); } },
	Junction:       { isPseudoState: true, initialise: initialiseState,   onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions:	function( completions ) { return completions.singleOrUndefined( function( c ) { return g.guard(); } ) || completions.single( function( c ) { return c === Guard.Else; } ) ; } },
	Region:         { isPseudoState: false, initialise: initialiseRegion, onExit: onExitRegion, onBeginEnter: beginEnter,      process: processRegion },
	ShallowHistory: { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: true,  getCompletions:	function( completions ) { return completions.single(); }	},
	State:          { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState, process: processState, getCompletions: function( completions ) { return completions.singleOrUndefined( function( c ) { return c.guard(); } ); } },
	Completion:     { },
	Transition:     { }
};	

// returns the top-down ancestry of a node within a state machine
function ancestors( node )
{
	return node._parent ? ancestors( node._parent ).concat( node ) : [ node ];
}

// leaves a node within a state machine
function onExit( node ) 
{
	console.log( "Leave: " + toString( node ) );

	node._isActive = false;
}

// leaves a region within a state machine
function onExitRegion( region )
{
	if( region._isActive === true )
	{
		onExitState( region._current );

		onExit( region );
	}
}

// leaves a state within a state machine
function onExitState( state )
{
	if( state.children !== undefined )
		state.children.forEach( onExitRegion );

	if( state.exit !== undefined )		
		state.exit.forEach( function( action ) { action(); } );

	onExit( state );
}

// enter a node in a state machine
function beginEnter( node )
{
	if( node._isActive === true )
		node.kind.onExit( node );
	
	console.log( "Enter: " + toString( node ) );
	
	node._isActive = true;
}

// enter a state within a state machine
function beginEnterState( state )
{
	beginEnter( state );
			
	if( state.entry !== undefined )
		state.entry.forEach( function( action ) { action(); } );
			
	state._parent._current = state;
}

// completes the entry of a state by cascading to child regions and testing for completion transitions
function endEnter( state, deepHistory )
{
	if( state.children !== undefined )
		state.children.forEach( function( region ) { initialiseRegion( region, deepHistory ); } );

	if( state._transitions !== undefined ) // there are transitions to evaulate
		if( state.children === undefined || state.children.every( function( r ) { return r._current.kind === Kind.Final; } ) ) // state is 'complete'
		 if( ( completions = state._transitions.filter( function( t ) { return t.kind === Kind.Completion; } ) ).length > 0 ) // there are completion transitions to evaluate
			if( ( completion = state.kind.getCompletions( completions ) ) !== undefined ) // there is a completion transition to traverse
				traverse( completion, deepHistory );
}

// initialise a region
function initialiseRegion( region, deepHistory )
{
	beginEnter( region );

	initialiseState( ( ( deepHistory || region._initial.kind.isHistory ) && ( region._current !== null ) ) ? region._current : region._initial, deepHistory || region._initial.kind === Kind.DeepHistory );
}

// initiaise a state
function initialiseState( state, deepHistory )
{
	beginEnterState( state );
	endEnter( state, deepHistory );
}

// process a message within a region
function processRegion( region, message )
{		
	return processState( region._current, message );
}

// process a message within a state
function processState( node, message )
{		
	if( node._transitions !== undefined ) // there are transitions to evaluate
		if( ( transitions = node._transitions.filter( function( t ) { return t.kind === Kind.Transition; } ) ).length > 0 )	// there are event-based transitions
			processed = ( transition = transitions.singleOrUndefined( function( t ) { return t.guard( message ); } ) ) !== undefined; // there is a single transion whose guard evaluates true
			
	if( processed )
		traverse( transition, false, message );
	else
		if( node.children !== undefined )
			node.children.forEach( function( region ) { if( region._isActive === true ) processed != processRegion( region, message ); } );
		
	return processed;
}

// traverse a transition
function traverse( transition, deepHistory, message )
{		
	transition._onExit.forEach( function( node ) { node.kind.onExit( node ); } );

	if( transition.effect !== undefined )
		transition.effect.forEach( function( action ) { action( message ); } );
	
	transition._onEnter.forEach( function( node ) { node.kind.onBeginEnter( node ); } );

	endEnter( transition.target, deepHistory );	
}

// returns the fully qualified name of a node
function toString( node )
{
	return node._parent ? toString( node._parent ) + "." + node.name : node.name;
}

// initialises a state machine
function createStateMachine( node, transitions, parent )
{
	node._isActive = false;
	node._parent = parent;
	
	if( node.kind.isPseudoState === true && node.kind.isInitial === true )
		parent._initial = node;
	
	if( node.children )
	{
		if( ( node.kind === Kind.State ) && ( node.children[ 0 ].kind !== Kind.Region ) )
			node.children = [ { kind: Kind.Region, name: "default", children: node.children } ];

		node.children.forEach( function( child ) { createStateMachine( child, [], node ); } );
	}

	transitions.forEach( function( transition )
	{
		if( transition.source._transitions !== undefined )
			transition.source._transitions.push( transition );
		else
			transition.source._transitions = [ transition ];

		if( transition.target !== null )
		{
			var sourceAncestors = ancestors( transition.source );
			var targetAncestors = ancestors( transition.target );
				
			for( var i = 0; sourceAncestors[ i ] === targetAncestors[ i ]; i++ );

			transition._onExit = [ sourceAncestors[ i ] ];
					
			if( transition.source.kind.isPseudoState === true && sourceAncestors[ i ] !== transition.source )
				transition.onExit.unshift( transition.source );	
					
			transition._onEnter = targetAncestors.slice( i );
									
			if( transition.guard === undefined )
				transition.guard = Guard.True;
		}
	} );
				
	node.initialise = function() { node.kind.initialise( node ); };
	node.process = function( message ) { node.kind.process( node, message ); };			
	
	return node;
}		

// node.js exports
if( typeof exports !== 'undefined' )
{
	exports.Guard = Guard;
	exports.Kind = Kind;
	exports.createStateMachine = createStateMachine;
}
