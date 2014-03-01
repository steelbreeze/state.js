/* Copyright © 2013 Steelbreeze Limited.
 *
 * state.js is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 *
 */

/*global console */
function initStateJS(exports) {
    "use strict";
    
    function single(collection, predicate) {
        var i, len, result;
        
        for (i = 0, len = collection.length; i < len; i = i + 1) {
            if (predicate(collection[i])) {
                if (result) {
                    throw "single found more than one result";
                }
                
                result = collection[i];
            }
        }
        
        return result;
    }

    function setActive(context, element, value) {
        if (!context.steelbreeze_statejs_active) {
            context.steelbreeze_statejs_active = [];
        }
    
        context.steelbreeze_statejs_active[element] = value;
    }
    
    function getActive(context, element) {
        if (context.steelbreeze_statejs_active) {
            return context.steelbreeze_statejs_active[element];
        }
    }
    
    function setCurrent(context, element, value) {
        if (!context.steelbreeze_statejs_current) {
            context.steelbreeze_statejs_current = [];
        }
    
        context.steelbreeze_statejs_current[element] = value;
    }

    function getCurrent(context, element) {
        if (context.steelbreeze_statejs_current) {
            return context.steelbreeze_statejs_current[element];
        }
    }

    /**
     * Creates an instance of a transition.
     * @constructor
     * @this {Transition}
     * @param {object} source - The source state or pseudo state of the transition.
     * @param {object} [target] - The target state or pseudo state of the transition.
     * @param {function} [guard] The guard condition that must evaluate true prior to traversing from source to target.
     */
    function Transition(source, target, guard) {
        this.guard = guard || function () { return true; };
    
        if (target && (target !== null)) {
            var sourceAncestors = source.owner.ancestors(),
                targetAncestors = target.owner.ancestors(),
                ignoreAncestors = 0;

            while (sourceAncestors.length > ignoreAncestors && targetAncestors.length > ignoreAncestors && sourceAncestors[ignoreAncestors] === targetAncestors[ignoreAncestors]) {
                ignoreAncestors = ignoreAncestors + 1;
            }

            this.sourceAncestorsToExit = sourceAncestors.slice(ignoreAncestors);
            this.targetAncestorsToEnter = targetAncestors.slice(ignoreAncestors);
            
            this.sourceAncestorsToExit.reverse();
            
            this.source = source;
            this.target = target;
        }

        source[guard && guard.length > 0 ? "transitions" : "completions"].push(this);
    }
    
    Transition.prototype.traverse = function (context, message) {
        var i, len;
        
        if (this.source) {
            this.source.beginExit(context);
            this.source.endExit(context);

            for (i = 0, len = this.sourceAncestorsToExit.length; i < len; i = i + 1) {
                this.sourceAncestorsToExit[i].endExit(context);
            }
        }

        if (this.effect) {
            for (i = 0, len = this.effect.length; i < len; i = i + 1) {
                this.effect[i](message);
            }
        }

        if (this.target) {
            for (i = 0, len = this.targetAncestorsToEnter.length; i < len; i = i + 1) {
                this.targetAncestorsToEnter[i].beginEnter(context);
            }
            
            this.target.beginEnter(context);
            this.target.endEnter(context, false);
        }
    };
    
    /**
     * Creates an instance of an else transition for use at choice and junction pseudo states.
     * @constructor
     * @augments Transition
     * @this {Transition.Else}
     * @param {object} source - The source state or pseudo state of the transition.
     * @param {object} [target] - The target state or pseudo state of the transition.
     */
    Transition.Else = function (source, target) {
        Transition.call(this, source, target, function () { return false; });
    };
    
    Transition.Else.prototype = Transition.prototype;
    Transition.Else.prototype.constructor = Transition.Else;

    function getInitialCompletion(completions) {
        
        if (completions.length === 1) {
            return completions[0];
        }

        throw "initial pseudo states must have one and only one outbound transition";
    }
    
    function getChoiceCompletion(completions) {
        var i, len, results = [];
        
        for (i = 0, len = completions.length; i < len; i = i + 1) {
            if (completions[i].guard()) {
                results.push(completions[i]);
            }
        }
            
        if (results.length > 0) {
            return results[(results.length - 1) * Math.random()];
        }

        return single(completions, function (c) { return c instanceof Transition.Else; });
    }
    
    function getJunctionCompletion(completions) {
        var result = single(completions, function (c) { return c.guard(); });
        
        if (result) {
            return result;
        }
        
        result = single(completions, function (c) { return c instanceof Transition.Else; });
        
        if (result) {
            return result;
        }
        
        throw "junction PseudoState has no valid competion transitions";
    }
            
    /**
     * Enum for pseudo state kinds
     * @enum {object}
     * @alias PseudoStateKind
     */
    var PseudoStateKind = {
        /**
         * Enables a dynamic conditional branches; within a compound transition.
         * @alias Choice
         */
        Choice: { isInitial: false, isHistory: false, completions: getChoiceCompletion },

        /**
         * A type of initial pseudo state; forms the initial starting point when entering a region or composite state for the first time.
         * @alias DeepHistory
         */
        DeepHistory: { isInitial: true, isHistory: true, completions: getInitialCompletion },

        /**
         * A type of initial pseudo state; forms the initial starting point when entering a region or composite state for the first time.
         * @alias Initial
         */
        Initial: { isInitial: true, isHistory: false, completions: getInitialCompletion },

        /**
         * Enables a static conditional branches; within a compound transition.
         * @alias Junction
         */
        Junction: { isInitial: false, isHistory: false, completions: getJunctionCompletion },

        /**
         *  A type of initial pseudo state; forms the initial starting point when entering a region or composite state for the first time.
         * @alias ShallowHistory
         */
        ShallowHistory: { isInitial: true, isHistory: true, completions: getInitialCompletion },

        /**
         * Entering a terminate pseudostate implies that the execution of this state machine by means of its context object is terminated.
         * @alias Terminate
         */
        Terminate: { isInitial: false, isHistory: false, completions: null }
    };

    function Element(name, owner) {
        this.name = name;
        this.owner = owner;
    }
    
    Element.prototype.qualifiedName = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };

    Element.prototype.ancestors = function () {
        return (this.owner ? this.owner.ancestors() : []).concat(this);
    };

    Element.prototype.beginExit = function (context) {
    };

    Element.prototype.endExit = function (context) {
//        if (console) {
//            console.log("Leave: " + this.toString());
//        }

        setActive(context, this, false);
    };

    Element.prototype.beginEnter = function (context) {
        if (getActive(context, this)) {
            this.beginExit(context);
            this.endExit(context);
        }
	
//        if (console) {
//            console.log("Enter: " + this.toString());
//        }
        
        setActive(context, this, true);
    };

    Element.prototype.endEnter = function (context, deepHistory) {
    };
    
    Element.prototype.toString = function () {
        return this.qualifiedName();
    };
    
    /**
     * Creates an instance of a pseudo state.
     * @constructor
     * @this {PseudoState}
     * @param {string} name - The name given to the pseudo state.
     * @param {PseudoStateKind} kind - The kind of pseudo state to create.
     * @param {(Region|CompositeState)} owner - The owning parent region or composite state.
     */
    function PseudoState(name, kind, owner) {
        Element.call(this, name, owner);

        this.kind = kind;
        this.completions = [];
    
        // update the parents initial state as appropriate
        if (this.kind.isInitial) {
            this.owner.initial = this;
        }
    }
    
    PseudoState.prototype = new Element();
    PseudoState.prototype.constructor = PseudoState;

    PseudoState.prototype.endEnter = function (context, deepHistory) {
        if (this.kind === PseudoStateKind.Terminate) {
            context.IsTerminated = true;
        } else {
            this.kind.completions(this.completions).traverse(context, deepHistory);
        }
    };
    
    /**
     * Creates an instance of a simple state.
     * @constructor
     * @this {SimpleState}
     * @param {string} name - The name given to the simple state.
     * @param {(Region|CompositeState)} owner - The owining parent region or composite state.
     */
    function SimpleState(name, owner) {
        Element.call(this, name, owner);
        
        this.completions = [];
        this.transitions = [];
    }
    
    SimpleState.prototype = new Element();
    SimpleState.prototype.constructor = SimpleState;

    SimpleState.prototype.isComplete = function (context) {
        return true;
    };

    SimpleState.prototype.endExit = function (context) {
        var i, len;
        
        if (this.exit) {
            for (i = 0, len = this.exit.length; i < len; i = i + 1) {
                this.exit[i]();
            }
        }
        
        Element.prototype.endExit.call(this, context);
    };

    SimpleState.prototype.beginEnter = function (context) {
        var i, len;

        Element.prototype.beginEnter.call(this, context);

        if (this.owner) {
            setCurrent(context, this.owner, this);
        }

        if (this.entry) {
            for (i = 0, len = this.entry.length; i < len; i = i + 1) {
                this.entry[i]();
            }
        }
    };

    SimpleState.prototype.endEnter = function (context, deepHistory) {
        if (this.isComplete(context)) {
            var result = single(this.completions, function (c) { return c.guard(); });
            
            if (result) {
                result.traverse(context, deepHistory);
            }
        }
    };

    SimpleState.prototype.process = function (context, message) {
        var result = single(this.transitions, function (t) { return t.guard(message); });
                
        if (!result) {
            return false;
        }
        
        result.traverse(context, message);

        return true;
    };

    /**
     * Creates an instance of a composite state.
     * @constructor
     * @augments SimpleState
     * @this {CompositeState}
     * @param {string} name - The name given to the composite state.
     * @param {(Region|CompositeState)} [owner] - The owining parent region or composite state.
     */
    function CompositeState(name, owner) {
        SimpleState.call(this, name, owner);
    }
    
    CompositeState.prototype = new SimpleState();
    CompositeState.prototype.constructor = CompositeState;

    CompositeState.prototype.isComplete = function (context) {
        var current = getCurrent(context, this);
        
        return context.isTerminated || current === null || current.isFinalState || getActive(context, current) === false;
    };
    
    CompositeState.prototype.beginExit = function (context) {
        var current = getCurrent(context, this);
    
        if (current) {
            current.beginExit(context);
            current.endExit(context);
        }
    };
    
    CompositeState.prototype.endEnter = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;
    
        current.beginEnter(context);
        current.endEnter(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    
        SimpleState.prototype.endEnter.call(this, context, deepHistory);
    };
    
    CompositeState.prototype.process = function (context, message) {
        return SimpleState.prototype.process.call(this, context, message) || getCurrent(context, this).process(context, message);
    };
    
    /**
     * Creates an instance of an orthogonal state.
     * @constructor
     * @augments SimpleState
     * @this {OrthogonalState}
     * @param {string} name - The name given to the orthogonal state.
     * @param {(Region|CompositeState)} [owner] - The owining parent region or composite state.
     */
    function OrthogonalState(name, owner) {
        SimpleState.call(this, name, owner);
    
        this.regions = [];
    }
    
    OrthogonalState.prototype = new SimpleState();
    OrthogonalState.prototype.constructor = OrthogonalState;
    
    OrthogonalState.prototype.isComplete = function (context) {
        var i, len;
        
        if (!context.isTerminated) {
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                if (!this.regions[i].isComplete(context)) {
                    return false;
                }
            }
        }
        
        return true;
    };
    
    OrthogonalState.prototype.beginExit = function (context) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(context, this.regions[i])) {
                this.regions[i].beginExit(context);
                this.regions[i].endExit(context);
            }
        }
    };

    OrthogonalState.prototype.endEnter = function (context, deepHistory) {
        var i, len;

        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            this.regions[i].beginEnter(context);
            this.regions[i].endEnter(context);
        }

        SimpleState.prototype.endEnter.call(context, deepHistory);
    };

    OrthogonalState.prototype.process = function (context, message) {
        var i, len, result = false;
        
        if (!context.isTerminated) {
            if ((result = SimpleState.prototype.process.call(this, context, message)) === false) {
                for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                    result = this.regions[i].process(context, message) || result;
                }
            }
        }
        
        return result;
    };
    
    /**
     * Creates an instance of a final state.
     * @constructor
     * @augments SimpleState
     * @this {FinalState}
     * @param {string} name The name given to the final state.
     * @param {(Region|CompositeState)} [owner] - The owining parent region or composite state.
     */
    function FinalState(name, owner) {
        SimpleState.call(this, name, owner);
        
        this.isFinalState = true;
    }
  
    FinalState.prototype = new SimpleState();
    FinalState.prototype.constructor = FinalState;
    delete FinalState.prototype.comlpetions;
    delete FinalState.prototype.transitions;
    
    FinalState.prototype.process = function (context, message) {
        return false;
    };

    /**
     * Creates an instance of a region.
     * @constructor
     * @this {Region}
     * @param {string} name The name given to the simple state.
     * @param {(StateMachine|OrthogonalState)} [owner] - The owining parent orthogonal state.
     */
    function Region(name, owner) {
        Element.call(this, name, owner);
        
        this.initial = null;
    
        if (this.owner) {
            this.owner.regions.push(this);
        }
    }

    Region.prototype = new Element();
    Region.prototype.constructor = Region;

    /**
     * Determines if a region is complete
     * @this {Region}
     * @param {object} context - the state machine state.
     * @return {bool} True if the region is complete.
     */
    Region.prototype.isComplete = function (context) {
        var current = getCurrent(context, this);
        
        return context.isTerminated || current === null || current.isFinalState || getActive(context, current) === false;
    };

    /**
     * Initialises a region to its inital state
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     */
    Region.prototype.initialise = function (context) {
        this.beginEnter(context);
        this.endEnter(context, false);
    };

    Region.prototype.beginExit = function (context) {
        var current = getCurrent(context, this);

        if (current) {
            current.beginExit(context);
            current.endExit(context);
        }
    };

    Region.prototype.endEnter = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;

        current.beginEnter(context);
        current.endEnter(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    };

    /**
     * Attempt to process a message against the region
     * @this {Region}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    Region.prototype.process = function (context, message) {
        if (context.isTerminated) {
            return false;
        }

        return getActive(context, this) && getCurrent(context, this).process(context, message);
    };

    /**
     * Creates an instance of a state machine.
     * @constructor
     * @this {StateMachine}
     * @param {string} name The name given to the state machine.
     */
    function StateMachine(name) {
        Element.call(this, name);
        
        this.regions = [];
    }

    StateMachine.prototype = new Element();
    StateMachine.prototype.constructor = StateMachine;

    /**
     * Determines if a state machine is complete
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     * @return {bool} True if the state machine is complete.
     */
    StateMachine.prototype.isComplete = function (context) {
        var i, len;
        
        if (!context.isTerminated) {
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                if (!this.regions[i].isComplete(context)) {
                    return false;
                }
            }
        }
        
        return true;
    };

    /**
     * Initialises a state machine to its inital state
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     */
    StateMachine.prototype.initialise = function (context) {
        this.beginEnter(context);
        this.endEnter(context, false);
    };
    
    StateMachine.prototype.beginExit = function (context) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(context, this.regions[i])) {
                this.regions[i].beginExit(context);
                this.regions[i].endExit(context);
            }
        }
	};

    StateMachine.prototype.endEnter = function (context, deepHistory) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            this.regions[i].beginEnter(context);
            this.regions[i].endEnter(context, deepHistory);
        }
        
        Element.prototype.endEnter.call(context, deepHistory);
    };

    /**
     * Attempt to process a message against the state machine
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    StateMachine.prototype.process = function (context, message) {
        var i, len, result = false;
        
        if (!context.isTerminated) {
            
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                result = this.regions[i].process(context, message) || result;
            }
        }
        
        return result;
    };

    // export the public API
    exports.PseudoStateKind = PseudoStateKind;
    exports.PseudoState = PseudoState;
    exports.SimpleState = SimpleState;
    exports.CompositeState = CompositeState;
    exports.OrthogonalState = OrthogonalState;
    exports.FinalState = FinalState;
    exports.Region = Region;
    exports.StateMachine = StateMachine;
    exports.Transition = Transition;
}

// initialise in node.js context
if (this.exports) {
    initStateJS(this.exports);

// initialise in the require.js context
} else if (this.define) {
    this.define(function (require, exports, module) { "use strict"; initStateJS(exports); });
    
// initialise in the global scope 
} else {
    initStateJS(this);
}
