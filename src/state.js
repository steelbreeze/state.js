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
	{
		return results[ 0 ];
	}
	
	throw new Error( "Cannot return zero or more than one elements" );	
};

// returns the only element of an array that satisfies a specified condition; throws an exception if more than one such elements exist
Array.prototype.singleOrUndefined = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length === 1 )
	{
		return results[ 0 ];
	}
	
	if( results.length > 1 )
	{
		throw new Error( "Cannot return more than one elements" );
	}
};

// returns the a random element of an array that satisfies a specified condition; throws an exception if more than one such elements exist
Array.prototype.randomOrUndefined = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length !== 0 )
	{
		return results[ ( results.length - 1 ) * Math.random() ];
	}
};

// else guard for use in choice and junction pseudo states
var Else = function() { return false; };

var PseudoStateKind =
{
	Choice: { Name: "junction", IsInitial: false, IsHistory: false, GetCompletion: function( completions ) { var result = completions.randomOrUndefined( function( c ) { return c.Guard(); } ); if( !result ) { result = completions.single( function ( c ) { return c === Else; } ); } return result; } },
	DeepHistory: { Name: "deepHistory", IsInitial: true, IsHistory: true, GetCompletion: function( completions ) { return completions.single(); } },
	EntryPoint: { Name: "entryPoint", IsInitial: true, IsHistory: false, GetCompletion: function( completions ) { return completions.single(); } },
	ExitPoint: { Name: "exitPoint", IsInitial: false, IsHistory: false, GetCompletion: function( completions ) { return completions.single( function( c ) { return c.Guard(); } ); } },
	Initial: { Name: "initial", IsInitial: true, IsHistory: false, GetCompletion: function( completions ) { return completions.single(); } },
	Junction: { Name: "junction", IsInitial: false, IsHistory: false, GetCompletion: function( completions ) { var result = completions.singleOrUndefined( function( c ) { return c.Guard(); } ); if( !result ) { result = completions.single( function ( c ) { return c === Else; } ); } return result; } },
	ShallowHistory: { Name: "shallowHistory", IsInitial: true, IsHistory: true, GetCompletion: function( completions ) { return completions.single(); } }
};

// region constructor
function Region( name, parent )
{
	if( parent )
	{
		console.assert( parent instanceof State, "parent must be a State" );
		
		parent.Regions.push( this );
	}

	this.Name = name;
	this.Parent = parent;
	this.IsActive = false;
	this.Current = null;
	this.Vertices = [];
}

Region.prototype =
{
	// true if a region is 'complete' (the current state is a final state)
	IsComplete : function()
	{
		return this.Current instanceof FinalState;
	},

	// initialises a region for use or subsiquent reuse
	Initialise : function( deepHistory )
	{
		if( !deepHistory )
		{
			deepHistory = false;
		}
		
		this.BeginEnter();
		
		var vertex = ( ( deepHistory || this.Initial.Kind.IsHistory ) && ( this.Current !== null ) ) ? this.Current : this.Initial;

		vertex.Initialise( deepHistory || this.Kind === PseudoStateKind.DeepHistory );
	},

	Process : function( message )
	{
		if( this.Current !== null )
		{
			this.Current.Process( message );
		}
	},

	Reset : function()
	{
		this.Vertices.forEach( function( vertex ) { vertex.Reset(); } );
		this.IsActive = false;
		this.Current = null; // TODO: remove the property rather than set null (or init to null)
	},
	
	OnExit : function()
	{
		if( this.Current !== null && this.Current.IsActive === true )
		{
			this.Current.OnExit();
		}
		
		console.log( "Leave: " + this.toString() );
		
		this.IsActive = false;
	},

	BeginEnter : function()
	{
		if( this.IsActive === true )
		{
			this.OnExit();
		}
		
		console.log( "Enter: " + this );
			
		this.IsActive = true;
	},

	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
};

function PseudoState( kind, parent )
{
	// use a state's default region if a state was provided
	if( parent instanceof State )
	{
		parent = parent.DefaultRegion();
	}
	
	// validate parameters
//	console.assert( kind in PseudoStateKind, "kind must be a PseudoStateKind" ) // TODO: get something like this working
	console.assert( parent instanceof Region, "parent must be a Region" );

	this.Kind = kind;
	this.Parent = parent;
	this.Completions = [];

	// set the parent region's initial pseudo state value
	if( kind.IsInitial === true )
	{		
		if( parent.Initial )
		{
			throw new Error( "Regions can have at most 1 initial pseudo state" );
		}
		
		parent.Initial = this;
	}
	
	// add the pseudo state to its parent
	parent.Vertices.push( this );
}

PseudoState.prototype = 
{
	Initialise: function()
	{
		this.BeginEnter();
		this.EndEnter( false );
	},
	
	Reset : function()
	{
	},
	
	OnExit: function()
	{
		console.log( "Leave: " + this );
	},

	BeginEnter: function()
	{
		console.log( "Enter: " + this );
	},

	EndEnter : function( deepHistory )
	{
		this.Kind.GetCompletion( this.Completions ).Traverse( deepHistory );
	},
	
	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Kind.Name : this.Kind.Name;
	}
};
	
function State( name, parent )
{
	if( parent )
	{
		if( parent instanceof State )
		{
			parent = parent.DefaultRegion();
		}
		
		console.assert( parent instanceof Region, "parent must be a Region" );
			
		parent.Vertices.push( this );
	}
	
	this.Name = name;
	this.Parent = parent;
	this.IsActive = false;
	this.Entry = [];
	this.Exit = [];
	this.Regions = [];
	this.Completions = [];
	this.Transitions = [];
}

State.prototype = 
{
	IsSimple : function()
	{
		return this.Regions.length === 0;
	},
	
	DefaultRegion: function()
	{
		if( !this.defaultRegion )
		{
			this.defaultRegion = new Region( "default", this );
		}
		
		return this.defaultRegion;
	},
	
	Initialise: function()
	{
		this.BeginEnter();
		this.EndEnter( false );
	},
	
	Process : function( message )
	{
		var transition = this.Transitions.singleOrUndefined( function( t ) { return t.Guard( message ); } );
		var processed = transition ? true : false;
					
		if( processed === true )
		{
			transition.Traverse( message );
		}
		else
		{
			if( this.IsSimple() === false )
			{
				for( var i = 0; i < this.Regions.length; i++ )
				{
					if( this.Regions[ i ].IsActive === true )
					{
						processed |= this.Regions[ i ].Process( message );
					}
				}
			}
		}
		
		return processed;
	},

	Reset : function()
	{
		this.Regions.forEach( function( region ) { region.Reset(); } );
		
		this.IsActive = false;
	},
	
	OnExit : function()
	{
		this.Regions.forEach( function( region ) { if( region.IsActive ) { region.OnExit(); } } );
			
		this.Exit.forEach( function( action ) { action(); } );

		console.log( "Leave: " + this.toString() );
			
		this.IsActive = false;
	},

	BeginEnter : function()
	{
		if( this.IsActive === true )
		{
			this.OnExit();
		}
		
		console.log( "Enter: " + this.toString() );
			
		this.IsActive = true;
			
		if( this.Parent )
		{
			this.Parent.Current = this;
		}
		
		this.Entry.forEach( function( action ) { action(); } );
	},
	
	EndEnter : function( deepHistory )
	{
		this.Regions.forEach( function( region ) { region.Initialise( deepHistory ); } );
		
		if( this.Completions.length > 0 )
		{
			if( this.IsSimple() || this.Regions.every( function( region ) { return region.IsComplete(); } ) )
			{
				var completion = this.Completions.singleOrUndefined( function( c ) { return c.Guard(); } );
				
				if( completion )
				{
					completion( deepHistory );
				}
			}
		}
	},

	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
};

function FinalState( name, parent )
{
	if( parent instanceof State )
	{
		parent = parent.DefaultRegion();
	}
	
	console.assert( parent instanceof Region, "parent must be a Region" );

	this.Name = name;
	this.Parent = parent;
	this.IsActive = false;

	parent.Vertices.push( this );
}

FinalState.prototype = 
{
	Initialise: function()
	{
		this.BeginEnter();
		this.EndEnter( false );
	},
	
	Process : function( message )
	{		
	},

	Reset : function()
	{		
		this.IsActive = false;
	},

	BeginEnter : function()
	{
		if( this.IsActive === true )
		{
			this.OnExit();
		}
		
		console.log( "Enter: " + this.toString() );
			
		this.IsActive = true;
			
		if( this.Parent )
		{
			this.Parent.Current = this;
		}
	},

	EndEnter : function( deepHistory )
	{
	},
	
	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
};

function Completion( source, target, guard )
{
	this.Guard = guard ? guard : function() { return true; };
	this.Path = Path( source, target );
	this.Effect = [];
	
	source.Completions.push( this );
}

Completion.prototype =
{
	Traverse: function( deepHistory )
	{
		this.Path.Exit.forEach( function( action ) { action(); } );
		
		this.Effect.forEach( function( action ) { action(); } );
		
		this.Path.Enter.forEach( function( action ) { action(); } );
		
		this.Path.Complete( deepHistory );
	}
};

function Transition( source, target, guard )
{
	console.assert( source instanceof State, "Source of a transition must be a State" );
	
	this.Guard = guard ? guard : function( message ) { return true; };
	this.Path = Path( source, target );
	this.Effect = [];
	
	source.Transitions.push( this );
}

Transition.prototype =
{
	Traverse: function( message )
	{
		this.Path.Exit.forEach( function( action ) { action(); } );
		
		this.Effect.forEach( function( action ) { action( message ); } );
		
		this.Path.Enter.forEach( function( action ) { action(); } );
		
		this.Path.Complete( false );
	}
};

// the path to take between vertices
function Path( source, target )
{
	var path = { Exit: [], Enter: [] };

	// get the ancestors of the source and target vertices
	var sourceAncestors = Ancestors( source );
	var targetAncestors = Ancestors( target );

	// iterate over all common ancestors
	for( var i = 0; sourceAncestors[ i ] === targetAncestors[ i ]; i++ );
	
	// special case for leaving pseudo states where source and target vertices are in different regions
	if( source instanceof PseudoState && ( sourceAncestors[ i ] != source ) )
	{
		path.Exit.push( function() { source.OnExit(); } );
	}

	// leave the source ancestry (exit cascades)
	( function( s ) { path.Exit.push( function() { s.OnExit(); } ); } )( sourceAncestors[ i ] );
	
	// enter the target ancestry (beginEnter does not cascade)
	for( ; i < targetAncestors.length; i++ )
	{
		( function( t ) { path.Enter.push( function() { t.BeginEnter(); } ); } )( targetAncestors[ i ] );
	}
		
	// complete entry (endEnter cascades to any child regions)
	path.Complete = function() { target.EndEnter(); };

	return path;
}

// returns the ancstors of a node
function Ancestors( node )
{
	if( node.Parent )
	{
		return Ancestors( node.Parent ).concat( node );
	}
	else
	{
		return [ node ];
	}
}
