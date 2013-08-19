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
	var results = predicate ? this.filter( predicate ) : this;

	if( results.length === 1 )
		return results[ 0 ];
	
	throw new Error( "Cannot return zero or more than one elements" );	
};

// returns the only item in an array where the predicate evaluates true or nothing
Array.prototype.singleOrUndefined = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length === 1 )
		return results[ 0 ];

	if( results.length > 1 )
		throw new Error( "Cannot return more than one elements" );
};

// returns a random element of an array where the predicate evaluates true or nothing
Array.prototype.randomOrUndefined = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;

	if( results.length !== 0 )
		return results[ ( results.length - 1 ) * Math.random() ];
};

var Else = function() { return false; };

var Choice =         { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions:	function( completions ) { return completions.randomOrUndefined( function( c ) { return c.guard(); } ) || completions.single( function( c ) { return c === Else; } ) ; } };
var DeepHistory =    { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: true,  getCompletions:	function( completions ) { return completions.single(); } };
var EntryPoint =     { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: false, getCompletions: function( completions ) { return completions.single(); } };
var ExitPoint =      { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions: function( completions ) { return completions.single( function( c ) { return c.guard(); } ); } };
var Final =          { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState };
var Initial =        { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: false, getCompletions: function( completions ) { return completions.single(); } };
var Junction =       { isPseudoState: true, initialise: initialiseState,   onExit: onExit,       onBeginEnter: beginEnter,      isInitial: false, isHistory: false, getCompletions: function( completions ) { return completions.singleOrUndefined( function( c ) { return c.guard(); } ) || completions.single( function( c ) { return c === Else; } ) ; } };
var Region =         { isPseudoState: false, initialise: initialiseRegion, onExit: onExitRegion, onBeginEnter: beginEnter,      process: processRegion, isComplete: isRegionComplete };
var ShallowHistory = { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnter,      isInitial: true,  isHistory: true,  getCompletions: function( completions ) { return completions.single(); }	};
var State =          { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState, process: processState,  isComplete: isStateComplete, getCompletions: function( completions ) { return completions.singleOrUndefined( function( c ) { return c.guard(); } ); } };

// returns the top-down ancestry of a node within a state machine
function ancestors( node )
{
	return node._parent ? ancestors( node._parent ).concat( node ) : [ node ];
}

function isRegionComplete( node, state )
{
	return getCurrent( node, state ).kind === Final;
}

function isStateComplete( node, state )
{
	return !node.children || node.children.every( function( child ) { return isRegionComplete( child, state ); } );
}

// leaves a node within a state machine
function onExit( node, state ) 
{
	console.log( "Leave: " + toString( node ) );

	setActive( node, state, false );
}

// leaves a region within a state machine
function onExitRegion( node, state )
{
	if( getActive( node, state ) )
	{
		var current = getCurrent( node, state );
		
		if( current )
			onExitState( current, state );

		onExit( node, state );
	}
}

// leaves a state within a state machine
function onExitState( node, state )
{
	if( node.children )
		node.children.forEach( function( child ) { return onExitRegion( child, state ); } );

	if( node.exit )		
		node.exit.forEach( function( action ) { action(); } );

	onExit( node, state );
}

// enter a node in a state machine
function beginEnter( node, state )
{
	if( getActive( node, state ) )
		node.kind.onExit( node, state );
	
	console.log( "Enter: " + toString( node ) );

	setActive( node, state, true );	
}

// enter a state within a state machine
function beginEnterState( node, state )
{
	beginEnter( node, state );
			
	if( node.entry )
		node.entry.forEach( function( action ) { action(); } );
			
	if( node._parent )
		setCurrent( node._parent, state, node );
}

// completes the entry of a state by cascading to child regions and testing for completion transitions
function endEnter( node, state, deepHistory )
{
	var completion;

	if( node.children )
		node.children.forEach( function( child ) { initialiseRegion( child, state, deepHistory ); } );

	if( node._completions )
		if( isStateComplete( node, state ) )
			if( ( completion = node.kind.getCompletions( node._completions ) ) )
				traverse( state, completion, deepHistory );
}

// initialise a region
function initialiseRegion( node, state, deepHistory )
{
	beginEnter( node, state );

	var current = getCurrent( node, state );	

	initialiseState( ( ( deepHistory || node._initial.kind.isHistory ) && current ) ? current : node._initial, state, deepHistory || node._initial.kind === DeepHistory );
}

// initiaise a state
function initialiseState( node, state, deepHistory )
{
	beginEnterState( node, state );
	endEnter( node, state, deepHistory );
}

// process a message within a region
function processRegion( node, state, args )
{
	return getActive( node, state ) && processState( getCurrent( node, state ), state, args );
}

// process a message within a state
function processState( node, state, args )
{	
	var transition = node._transitions ? node._transitions.singleOrUndefined( function( t ) { return t.guard.apply( null, args ); } ) : undefined;
	
	if( transition )
		return traverse( state, transition, false, args );
	else
		return node.children ? node.children.reduce( function( result, region ) { return result || processRegion( region, state, args ); } , false ) : false;
}

// traverse a transition
function traverse( state, transition, deepHistory, message )
{
	if( transition._onExit )
		transition._onExit.forEach( function( node ) { node.kind.onExit( node, state ); } ); // leave the source node(s)

	if( transition.effect )
		transition.effect.forEach( function( action ) { action.apply( message ); } ); // perform the transition action(s)
	
	if( transition._onEnter )
		transition._onEnter.forEach( function( node ) { node.kind.onBeginEnter( node, state ); } ); // enter the target node(s)
		
	if( transition.target )
		endEnter( transition.target, state, deepHistory );	// complete entry (cascade entry to any children; test for completion transitions)
		
	return true;
}

// returns the fully qualified name of a node
function toString( node )
{
	return node._parent ? toString( node._parent ) + "." + node.name : node.name;
}

// adds properties and methods to nodes within a state machine
function preProcessNode( node, parent )
{
	node._parent = parent; // add the parent flag
	
	node.initialise = function( state ) { node.kind.initialise( node, state ); };
	node.process = function() { return node.kind.process( node, arguments[ 0 ], Array.prototype.slice.call( arguments, 1 ) ); };
	
	if( node.kind === Region || node.kind == State )
		node.isComplete = function( state ) { return node.kind.isComplete( node, state ); };	

	if( node.kind.isInitial )
		parent._initial = node; // set the parent region's initial state as appropriate
	
	if( node.children )
	{
		if( ( node.kind === State ) && ( node.children[ 0 ].kind !== Region ) )
			node.children = [ { kind: Region, name: "default", children: node.children } ]; // create default regions as required

		node.children.forEach( function( child ) { preProcessNode( child, node ); } ); // pre-process child nodes
	}
}

// adds transitions to source vertices and pre-computes the path from source to target
function preProcessTransition( transition )
{
	var type = transition.guard && transition.guard.length > 0 ? "_transitions" : "_completions";

	if( transition.source[ type ] )
		transition.source[ type ].push( transition );
	else
		transition.source[ type ] = [ transition ];

	if( transition.target )
	{
		var i;
		var sourceAncestors = ancestors( transition.source );
		var targetAncestors = ancestors( transition.target );
			
		if( transition.source === transition.target )
			i = sourceAncestors.length - 1;
		else
			for( i = 0 ; i < sourceAncestors.length && i < targetAncestors.length && sourceAncestors[ i ] === targetAncestors[ i ]; i++ );

		transition._onExit = [ sourceAncestors[ i ] ];

		if( transition.source.kind.isPseudoState && sourceAncestors[ i ] !== transition.source )
			transition._onExit.unshift( transition.source );	
				
		transition._onEnter = targetAncestors.slice( i );
								
		if( !transition.guard )
			transition.guard = function() { return true; };
	}
}

// creates a state machine
function createStateMachine( node, transitions )
{
	preProcessNode( node );
	
	transitions.forEach( preProcessTransition );
					
	return node;
}		

// gets a boolean indicating if a node is active or not
function getActive( node, state )
{
	if( state._active )
		return state._active[ toString( node ) ];
}

// sets a boolean indicating if a node is active or not
function setActive( node, state, value )
{
	( state._active || ( state._active = [] ) )[ toString( node ) ] = value;
}

// gets the last known state of a region
function getCurrent( node, state )
{
	if( state._current )
		return state._current[ toString( node ) ];
}

// sets the last known state of a region
function setCurrent( node, state, value )
{
	( state._current || ( state._current = [] ) )[ toString( node ) ] = value;
}


// node.js exports
if( typeof exports !== 'undefined' )
{
	exports.Else = Else;
	exports.Choice = Choice;
	exports.DeepHistory = DeepHistory;
	exports.EntryPoint = EntryPoint;
	exports.ExitPoint = ExitPoint;
	exports.Final = Final;
	exports.Initial = Initial;
	exports.Junction = Junction;
	exports.Region = Region;
	exports.ShallowHistory = ShallowHistory;
	exports.State = State;
	exports.createStateMachine = createStateMachine;
}
