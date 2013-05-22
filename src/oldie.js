// this code is from developer.mozilla.org

// adds the forEach array method if it doesn't exist
if ( !Array.prototype.forEach )
{
	Array.prototype.forEach = function( fn, scope )
	{
		"use strict";

		for(var i = 0, len = this.length; i < len; ++i) {
			fn.call(scope, this[i], i, this);
		}
	}
}

// adds the filter array method if it doesn't exist
if (!Array.prototype.filter)
{
	Array.prototype.filter = function(fun /*, thisp*/)
	{
		"use strict";
		
		if (this == null)
			throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun != "function")
			throw new TypeError();
		
		var res = [];
		var thisp = arguments[1];
		for (var i = 0; i < len; i++)
		{
			if (i in t)
			{
				var val = t[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, t))
					res.push(val);
			}
		}
		
		return res;
	};
}

if( typeof console === 'undefined' )
{
	console = { log: function( string ){ }, assert: function( condition, message ) { } };
}
