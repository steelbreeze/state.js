PseudoStateKind = // TODO: other kinds
{
	Initial : { Name: "initial", IsInitial: true, IsHistory: false, GetCompletion: function( completions ) { return completions[ 0 ]; } }
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
	this.Initial = null;
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
			deepHistory = false;
		
		this.BeginEnter();
		
		vertex = ( ( deepHistory || this.Initial.Kind.IsHistory ) && this.Current ) ? this.Current : this.Initial;

		vertex.Initialise( deepHistory ); // TODO: add || Inital.Kind == DeepHistory
	},

	Process : function( message )
	{
		this.Current.Process( message );
	},

	OnExit : function()
	{
		if( this.Current && this.Current.IsActive == true )
			this.Current.OnExit();
	
		console.log( "Leave: " + this.toString() );
		
		this.IsActive = false;
	},

	BeginEnter : function()
	{
		if( this.IsActive == true )
			this.OnExit();
	
		console.log( "Enter: " + this );
			
		this.IsActive = true;
	},

	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
}

function PseudoState( kind, parent )
{
	if( parent instanceof State )
		parent = parent.DefaultRegion();

	// TODO: assert if kind is defined in PseudoStateKind
	console.assert( parent instanceof Region, "parent must be a Region" );

	parent.Vertices.push( this );

	if( kind.IsInitial == true )
		parent.Initial = this;
	
	this.Kind = kind;
	this.Parent = parent;
	this.Completions = [];
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
}
	
function State( name, parent )
{
	if( parent )
	{
		if( parent instanceof State )
			parent = parent.DefaultRegion();
			
		console.assert( parent instanceof Region, "parent must be a Region" );
			
		parent.Vertices.push( this );
	}
	
	this.Name = name;
	this.Parent = parent;
	this.IsActive = false;
	this.Entry = [];
	this.Exit = [];
	this.Regions = [];
	this.Completions = []; // TODO: have these auto populated in transition ctor
	this.Transitions = []; // TODO: have these auto populated in transition ctor
}

State.prototype = 
{
	IsSimple : function()
	{
		return this.Regions.length == 0;
	},
	
	DefaultRegion: function()
	{
		if( !this.defaultRegion )
			this.defaultRegion = new Region( "default", this );
			
		return this.defaultRegion;
	},
	
	Initialise: function()
	{
		this.BeginEnter();
		this.EndEnter( false );
	},
	
	Process : function( message )
	{
		var transition = this.Transitions.filter( function( t ) { return t.Guard( message ); } );
		var processed = transition.length == 1;
		
		if( processed == true )
		{
			transition[ 0 ].Traverse( false ); // TODO: pass in message, not history
		}
		else
		{
			if( this.IsSimple() == false )
				for( var i = 0; i < this.Regions.length; i++ )
					if( this.Regions[ i ].IsActive == true )
						if( this.Regions[ i ].Process( message ) == true )
							processed = true;
		}
		
		return processed;
	},

	OnExit : function()
	{
		this.Regions.forEach( function( region ) { if( region.IsActive ) region.OnExit(); } );
			
		this.Exit.forEach( function( action ) { action(); } );

		console.log( "Leave: " + this.toString() );
			
		this.IsActive = false;
	},

	BeginEnter : function()
	{
		if( this.IsActive == true )
			this.OnExit();
	
		console.log( "Enter: " + this.toString() );
			
		this.IsActive = true;
			
		if( this.Parent )
			this.Parent.Current = this;
		
		this.Entry.forEach( function( action ) { action(); } );
	},
	
	EndEnter : function( deepHistory )
	{
		this.Regions.forEach( function( region ) { region.Initialise( deepHistory ); } );
		
		if( this.Completions.length > 0 )
		{
			if( this.IsSimple() || this.Regions.every( function( region ) { region.IsComplete(); } ) )
			{
				var completion = this.Completions.filter( function( c ) { c.Guard(); } );
				
				if( completion.length == 1 )
					completion[ 0 ]( deepHistory );
			}
		}
	},

	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
}

function FinalState( name, parent )
{
	if( parent instanceof State )
		parent = parent.DefaultRegion();

	console.assert( parent instanceof Region, "parent must be a Region" );

	parent.Vertices.push( this );

	this.Name = name;
	this.Parent = parent;
	this.IsActive = false;
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
		if( this.IsActive == true )
			this.OnExit();
	
		console.log( "Enter: " + this.toString() );
			
		this.IsActive = true;
			
		if( this.Parent )
			this.Parent.Current = this;
	},

	EndEnter : function( deepHistory )
	{
	},
	
	toString: function()
	{
		return this.Parent ? this.Parent.toString() + "." + this.Name : this.Name;
	}
}

function Transition( source, target, guard ) // TODO: distinguish completion and transition
{
	this.Source = source;
	this.Target = target;
	
	this.Guard = guard ? guard : function( message ) { return true; };
	this.Effect = [];
}

Transition.prototype =
{
	Traverse: function( deepHistory ) // TODO: move logic into ctor as per state.cs
	{		
		var sourceAncestors = Ancestors( this.Source );
		var targetAncestors = Ancestors( this.Target );
		
		for( var i = 0; sourceAncestors[ i ] == targetAncestors[ i ]; i++ );
				
		if( this.Source instanceof PseudoState )
			if( sourceAncestors[ i ] != this.Source )
				this.Source.OnExit();
		
		sourceAncestors[ i ].OnExit();

		this.Effect.forEach( function( action ) { action(); } ); // TODO: pass message if message based transition

		for( ; i < targetAncestors.length; i++ )
			targetAncestors[ i ].BeginEnter();
	
		this.Target.EndEnter();
	}
}

function Ancestors( node )
{
	if( node.Parent )
		return Ancestors( node.Parent ).concat( node );
	else
		return [ node ];
}
