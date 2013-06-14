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

var True = function() { return true; };
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
var Completion =     { };
var Transition =     { };

// returns the top-down ancestry of a node within a state machine
function ancestors( node )
{
	return node._parent ? ancestors( node._parent ).concat( node ) : [ node ];
}

function isRegionComplete( region )
{
	return region._current.kind === Final;
}

function isStateComplete( state )
{
	return state.children === undefined || state.children.every( isRegionComplete );
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
		if( region._current !== undefined )
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
			
	if( state._parent !== undefined )
		state._parent._current = state;
}

// completes the entry of a state by cascading to child regions and testing for completion transitions
function endEnter( state, deepHistory )
{
	if( state.children !== undefined )
		state.children.forEach( function( region ) { initialiseRegion( region, deepHistory ); } );

	if( state._completions !== undefined ) // there are completion transitions to evaulate
		if( isStateComplete( state ) === true )
			if( ( completion = state.kind.getCompletions( state._completions ) ) !== undefined ) // there is a completion transition to traverse
				traverse( completion, deepHistory );
}

// initialise a region
function initialiseRegion( region, deepHistory )
{
	beginEnter( region );

	initialiseState( ( ( deepHistory || region._initial.kind.isHistory ) && region._current ) ? region._current : region._initial, deepHistory || region._initial.kind === DeepHistory );
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
	var processed = false;
		
	if( node._transitions !== undefined ) // there are transitions to evaluate
		processed = ( ( transition = node._transitions.singleOrUndefined( function( t ) { return t.guard( message ); } ) ) !== undefined );
			
	if( processed === true )
		traverse( transition, false, message );
	else
		if( node.children !== undefined )
			node.children.forEach( function( region ) { if( region._isActive === true ) if( processRegion( region, message ) === true ) processed = true; } );
			
	return processed;
}

// traverse a transition
function traverse( transition, deepHistory, message )
{
	if( transition._onExit )
		transition._onExit.forEach( function( node ) { node.kind.onExit( node ); } ); // leave the source node(s)

	if( transition.effect )
		transition.effect.forEach( function( action ) { action( message ); } ); // perform the transition action(s)
	
	if( transition._onEnter )
		transition._onEnter.forEach( function( node ) { node.kind.onBeginEnter( node ); } ); // enter the target node(s)
		
	if( transition.target )
		endEnter( transition.target, deepHistory );	// complete entry (cascade entry to any children; test for completion transitions)
}

// returns the fully qualified name of a node
function toString( node )
{
	return node._parent ? toString( node._parent ) + "." + node.name : node.name;
}

// initialises a state machine
function createStateMachine( node, transitions, parent )
{
	node._isActive = false; // add the isActive flag (denotes a node has be entered but not exited)
	node._parent = parent; // add the parent flag
	
	if( node.kind.isInitial === true )
		parent._initial = node; // set the parent region's initial state as appropriate
	
	if( node.children )
	{
		if( ( node.kind === State ) && ( node.children[ 0 ].kind !== Region ) )
			node.children = [ { kind: Region, name: "default", children: node.children } ]; // create default regions as required

		node.children.forEach( function( child ) { createStateMachine( child, [], node ); } ); // initialise child nodes
	}

	transitions.forEach( function( transition )
	{
		if( transition.kind === Transition )
		{
			if( transition.source._transitions !== undefined )
				transition.source._transitions.push( transition );
			else
				transition.source._transitions = [ transition ];
		}
		else
		{
			if( transition.source._completions !== undefined )
				transition.source._completions.push( transition );
			else
				transition.source._completions = [ transition ];
		}
		
		if( transition.target !== null )
		{
			var sourceAncestors = ancestors( transition.source );
			var targetAncestors = ancestors( transition.target );
			var i = 0;
				
			if( transition.source === transition.target )
				i = sourceAncestors.length - 1;
			else
				for( ; i < sourceAncestors.length && i < targetAncestors.length && sourceAncestors[ i ] === targetAncestors[ i ]; i++ );

			transition._onExit = [ sourceAncestors[ i ] ];

			if( transition.source.kind.isPseudoState === true && sourceAncestors[ i ] !== transition.source )
				transition._onExit.unshift( transition.source );	
					
			transition._onEnter = targetAncestors.slice( i );
									
			if( transition.guard === undefined )
				transition.guard = True;
		}
	} );
				
	node.initialise = function() { node.kind.initialise( node ); };
	node.process = function( message ) { return node.kind.process( node, message ); };
	
	if( node.kind === Region || node.kind == State )
		node.isComplete = function() { return node.kind.isComplete( node ); };	
	
	return node;
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
	exports.Completion = Completion;
	exports.Transition = Transition;
	exports.createStateMachine = createStateMachine;
}
