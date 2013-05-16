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
