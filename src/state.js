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

// returns the only element of an array that satisfies a specified condition; throws an exception if zero or more than one such elements exist
Array.prototype.single = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length === 1 )
		return results[ 0 ];
	
	throw new Error( "Cannot return zero or more than one elements" );	
};

// returns the only element of an array that satisfies a specified condition; throws an exception if more than one such elements exist
Array.prototype.singleOrUndefined = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;

	if( results.length === 1 )
		return results[ 0 ];

	if( results.length > 1 )
		throw new Error( "Cannot return more than one elements" );
};

// default guard conditions
var Guard = { True: function() { return true; },
							Else: function() { return false; } };

// the various kinds of elements within a state machine
var Kind = { DeepHistory: { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnterNonState, isInitial: true, isHistory: true, getCompletions: function( completions ) { return completions.single(); } },
						 Final:       { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState },
						 Initial:     { isPseudoState: true,  initialise: initialiseState,  onExit: onExit,       onBeginEnter: beginEnterNonState, isInitial: true, isHistory: false, getCompletions: function( completions ) { return completions.single(); } },
						 Region:      { isPseudoState: false, initialise: initialiseRegion, onExit: onExitRegion, onBeginEnter: beginEnterNonState },
						 State:       { isPseudoState: false, initialise: initialiseState,  onExit: onExitState,  onBeginEnter: beginEnterState, getCompletions: function( completions ) { return completions.singleOrUndefined( function( c ) { return c.guard(); } ); } },
						 Completion:  { },
						 Transition:  { } };	

function ancestors( node )
{
	if( node._parent )
		return ancestors( node._parent ).concat( node );
	else
		return [ node ];
}

function onExit( node )
{
	console.log( "Leave: " + toString( node ) );

	node._isActive = false;
}

function onExitRegion( node )
{
	node._current.kind.onExit( node._current );

	onExit( node );
}

function onExitState( node )
{
	if( node.children !== undefined )
		node.children.forEach( function( region ) { if( region._isActive === true ) { region.kind.onExit( region ); } } );

	if( node.exit !== undefined )		
		node.exit.forEach( function( action ) { action(); } );

	onExit( node );
}

function beginEnterNonState( node )
{
	if( node._isActive === true )
		node.kind.onExit( node );
	
	console.log( "Enter: " + toString( node ) );
	
	node._isActive = true;
}

function beginEnterState( node )
{
	if( node._isActive === true )
		node.kind.onExit( node );
	
	console.log( "Enter: " + toString( node ) );
	
	node._isActive = true;
				
	if( node.entry !== undefined )
		node.entry.forEach( function( action ) { action(); } );
			
	node._parent._current = node;
}

function endEnter( node, deepHistory )
{
	if( node.kind !== Kind.Region )
	{		
		if( node.children !== undefined )
			node.children.forEach( function( region ) { initialiseRegion( region, deepHistory ); } );

		if( node._transitions !== undefined )
		{
			var completions = node._transitions.filter( function( t ) { return t.kind === Kind.Completion; } );
		
			if( completions.length > 0 )
			{
				if( node.children === undefined || node.children.every( function( region ) { return region._current.kind === Kind.Final; } ) )
				{
					var completion = node.kind.getCompletions( completions );
		
					if( completion )							
						traverse( completion, deepHistory );
				}
			}
		}
	}
}

function initialiseRegion( node, deepHistory )
{
	node.kind.onBeginEnter( node );

	initialiseState( ( ( deepHistory || node._initial.kind.isHistory ) && ( node._current !== null ) ) ? node._current : node._initial, deepHistory || node._initial.kind === Kind.DeepHistory );
}

function initialiseState( node, deepHistory )
{
	node.kind.onBeginEnter( node );

	endEnter( node, deepHistory );
}

function process( node, message )
{		
	if( node.kind === Kind.Region )
			return process( node._current, message );
	else
	{
		var processed = false;
					
		if( node._transitions !== undefined )
		{
			var transitions = node._transitions.filter( function( t ) { return t.kind === Kind.Transition; } );				
			var transition = transitions.singleOrUndefined( function( t ) { return t.guard( message ); } );
			processed = transition ? true : false;
		}
				
		if( processed === true )
			traverse( transition, false, message );
		else
			if( node.children !== undefined )
				for( var i = 0; i < node.children.length; i++ )
					if( node.children[ i ]._isActive === true )
						processed |= process( node.children[ i ], message );
		
		return processed;
	}
}

function traverse( transition, deepHistory, message )
{		
	transition._onExit.forEach( function( node ) { node.kind.onExit( node ); } );

	if( transition.effect !== undefined )
		transition.effect.forEach( function( action ) { action( message ); } );
	
	transition._onEnter.forEach( function( node ) { node.kind.onBeginEnter( node ); } );

	endEnter( transition.target, deepHistory );	
}

function toString( element )
{
	return element._parent ? toString( element._parent ) + "." + element.name : element.name;
}

function createStateMachine( node, transitions, parent )
{
	// set up node's attributes
	node._isActive = false;
	node._parent = parent;
	
	// set the parent's attributes if required
	if( node.kind.isPseudoState === true && node.kind.isInitial === true )
		parent._initial = node;
	
	if( node.children )
	{
		// inject regions as required
		if( ( node.kind === Kind.State ) && ( node.children[ 0 ].kind !== Kind.Region ) )
			node.children = [ { kind: Kind.Region, name: "default", children: node.children } ];

			// recurse to children
			node.children.forEach( function( child ) { createStateMachine( child, [], node ); } );
	}

	// assign transitions to source nodes
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
	node.process = function( message ) { process( node, message ); };			
	
	return node;
}		

// exports for node.js
if( typeof exports !== 'undefined' )
{
	exports.Guard = Guard;
	exports.Kind = Kind;
	exports.createStateMachine = createStateMachine;
}
