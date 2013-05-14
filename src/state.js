Array.prototype.single = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length != 1 )
	{
		throw new Error( "Cannot return more than one item" );
	}
	
	return results[ 0 ];
};

Array.prototype.singleOrDefault = function( predicate )
{
	var results = predicate ? this.filter( predicate ) : this;
	
	if( results.length > 1 )
	{
		throw new Error( "Cannot return more than one item" );
	}
	
	if( results.length == 1 )
	{
		return results[ 0 ];
	}
};

PseudoStateKind = // TODO: other kinds
{
	Initial : { Name: "initial", IsInitial: true, IsHistory: false, GetCompletion: function( completions ) { return completions.single(); } }
};

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
	this.Vertices = [];
}

Region.prototype =
{
	IsComplete : function()
	{
		return this.Current instanceof FinalState;
	},
	
	Initialise : function( deepHistory )
	{
		if( !deepHistory )
		{
			deepHistory = false;
		}
		
		this.BeginEnter();
		
		var vertex = ( ( deepHistory || this.Initial.Kind.IsHistory ) && this.Current ) ? this.Current : this.Initial;

		vertex.Initialise( deepHistory ); // TODO: add || Initial.Kind == DeepHistory
	},

	Process : function( message )
	{
		this.Current.Process( message );
	},

	OnExit : function()
	{
		if( this.Current && this.Current.IsActive === true )
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
	console.assert( parent instanceof Region, "parent must be a Region" );
	// TODO: assert if kind is defined in PseudoStateKind

	this.Kind = kind;
	this.Parent = parent;
	this.Completions = [];

	if( kind.IsInitial === true )
	{		
		if( parent.Initial )
			throw new Error( "Regions can have at most 1 initial pseudo state" );
	
		parent.Initial = this;
	}
	
	parent.Vertices.push( this );
}

PseudoState.prototype = 
{
	Initialise: function()
	{
		this.BeginEnter();
		this.EndEnter( false );
	},
	
	OnExit : function()
	{
		console.log( "Leave: " + this );
			
		this.IsActive = false;
	},

	BeginEnter : function()
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
		var transition = this.Transitions.singleOrDefault( function( t ) { return t.Guard( message ); } );
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
						if( this.Regions[ i ].Process( message ) === true )
						{
							processed = true;
						}
					}
				}
			}
		}
		
		return processed;
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
				var completion = this.Completions.singleOrDefault( function( c ) { return c.Guard(); } );
				
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

function Path( source, target )
{
	var path = { Exit: [], Enter: [] };
	var sourceAncestors = Ancestors( source );
	var targetAncestors = Ancestors( target );
	var i = 0;
	
	while( sourceAncestors[ i ] == targetAncestors[ i ] )
	{
		i++;
	}
	
	if( source instanceof PseudoState && ( sourceAncestors[ i ] != source ) )
	{
		path.Exit.push( function() { source.OnExit(); } );
	}
	
	( function( s ) { path.Exit.push( function() { s.OnExit(); } ); } )( sourceAncestors[ i ] );
		
	while( i < targetAncestors.length )
	{
		( function( t ) { path.Enter.push( function() { t.BeginEnter(); } ); } )( targetAncestors[ i++ ] );
	}
			
	path.Complete = function() { target.EndEnter(); };

	return path;
}