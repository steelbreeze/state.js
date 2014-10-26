/* State v4 finite state machine library
 * http://www.steelbreeze.net/state.js
 * Copyright (c) 2014 Steelbreeze Limited
 * Licensed under MIT and GPL v3 licences
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

    // TODO: add similar methods to the state machine state on initialisation in StateMachine
    function setActive(state, element, value) {
        if (!state.steelbreeze_statejs_active) {
            state.steelbreeze_statejs_active = [];
        }
    
        state.steelbreeze_statejs_active[element] = value;
    }
    
    function getActive(state, element) {
        if (state.steelbreeze_statejs_active) {
            return state.steelbreeze_statejs_active[element];
        }
    }
    
    function setCurrent(state, element, value) {
        if (!state.steelbreeze_statejs_current) {
            state.steelbreeze_statejs_current = [];
        }
    
        state.steelbreeze_statejs_current[element] = value;
    }

    function getCurrent(state, element) {
        if (state.steelbreeze_statejs_current) {
            return state.steelbreeze_statejs_current[element];
        }
    }
    
    function invoke1(behavior, p1) {
        var i, l;
        
        for (i = 0, l = behavior.length; i < l; i = i + 1) {
            behavior[i](p1);
        }
    }
    
    function invoke2(behavior, p1, p2) {
        var i, l;
        
        for (i = 0, l = behavior.length; i < l; i = i + 1) {
            behavior[i](p1, p2);
        }
    }
    
    /**
     * Creates an instance of a transition.
     * @constructor
     * @this {Transition}
     * @param {(PseudoState|SimpleState)} source - The source state or pseudo state of the transition.
     * @param {(PseudoState|SimpleState)} [target] - The target state or pseudo state of the transition; to create an internal transition, omit the target by passing either undefined or null.
     * @param {function} [guard] The guard condition that must evaluate true prior to traversing from source to target. Guard conditions are boolean functions: completion transition guards will take the state machine state as a parameter; message based transition guards will take the state machine state and triggering message as parameters.
     */
    function Transition(source, target, guard) {
        this.guard = guard || function (state) { return true; };
    
        this.effect = [];
        
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

        source[guard && guard.length > 1 ? "transitions" : "completions"].push(this);
    }
    
    Transition.prototype.onEffect = function (state, message) {
        invoke2(this.effect, state, message);
    };
    
    Transition.prototype.traverse = function (state, message) {
        var i, len;
        
        if (this.source) {
            this.source.beginExit(state);
            this.source.endExit(state);

            for (i = 0, len = this.sourceAncestorsToExit.length; i < len; i = i + 1) {
                this.sourceAncestorsToExit[i].endExit(state);
            }
        }

        this.onEffect(state, message);

        if (this.target) {
            for (i = 0, len = this.targetAncestorsToEnter.length; i < len; i = i + 1) {
                this.targetAncestorsToEnter[i].beginEntry(state);
            }
            
            this.target.beginEntry(state);
            this.target.endEntry(state, false);
        }
    };
    
    /**
     * Creates an instance of an else transition for use at choice and junction pseudo states.
     * @constructor
     * @augments Transition
     * @this {Transition.Else}
     * @param {(PseudoState|SimpleState)} source - The source state or pseudo state of the transition.
     * @param {(PseudoState|SimpleState)} target - The target state or pseudo state of the transition.
     */
    Transition.Else = function (source, target) {
        Transition.call(this, source, target, function (state) { return false; });
        this.isElse = true;
    };
    
    Transition.Else.prototype = Transition.prototype;
    Transition.Else.prototype.constructor = Transition.Else;

    function getInitialCompletion(state, completions) {
        
        if (completions.length === 1) {
            return completions[0];
        }

        throw "initial pseudo states must have one and only one outbound transition";
    }
    
    function getChoiceCompletion(state, completions) {
        var i, len, results = [];
        
        for (i = 0, len = completions.length; i < len; i = i + 1) {
            if (completions[i].guard(state)) {
                results.push(completions[i]);
            }
        }
            
        if (results.length > 0) {
            return results[(results.length - 1) * Math.random()];
        }

        return single(completions, function (c) { return c.isElse; });
    }
    
    function getJunctionCompletion(state, completions) {
        var result = single(completions, function (c) { return c.guard(state); });
        
        if (result) {
            return result;
        }
        
        result = single(completions, function (c) { return c.isElse; });
        
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
         * Entering a terminate pseudostate implies that the execution of this state machine by means of its state object is terminated.
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

    Element.prototype.beginExit = function (state) {
    };

    Element.prototype.endExit = function (state) {
        console.log("Leave: " + this.toString());

        setActive(state, this, false);
    };

    Element.prototype.beginEntry = function (state) {
        if (getActive(state, this)) {
            this.beginExit(state);
            this.endExit(state);
        }
	
        console.log("Enter: " + this.toString());
        
        setActive(state, this, true);
    };

    Element.prototype.endEntry = function (state, deepHistory) {
    };
    
    Element.prototype.getCurrent = function (state) {
        return { name: this.name };
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

    PseudoState.prototype.endEntry = function (state, deepHistory) {
        if (this.kind === PseudoStateKind.Terminate) {
            state.IsTerminated = true;
        } else {
            this.kind.completions(state, this.completions).traverse(state, deepHistory);
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
        
        /** Array of callback functions defining the exit behavior of the state; each function will be passed the state machine state as a parameter */
        this.exit = [];
        
        /** Array of callback functions defining the exit behavior of the state; each function will be passed the state machine state as a parameter */
        this.entry = [];
    }
    
    SimpleState.prototype = new Element();
    SimpleState.prototype.constructor = SimpleState;

    SimpleState.prototype.isComplete = function (state) {
        return true;
    };

    SimpleState.prototype.onExit = function (state) {
        invoke1(this.exit, state);
    };

    SimpleState.prototype.endExit = function (state) {
        this.onExit(state);
        
        Element.prototype.endExit.call(this, state);
    };

    SimpleState.prototype.onEntry = function (state) {
        invoke1(this.entry, state);
    };

    SimpleState.prototype.beginEntry = function (state) {

        Element.prototype.beginEntry.call(this, state);

        if (this.owner) {
            setCurrent(state, this.owner, this);
        }

        this.onEntry(state);
            
    };

    SimpleState.prototype.endEntry = function (state, deepHistory) {
        this.evaluateCompletions(state, deepHistory);
    };

    SimpleState.prototype.evaluateCompletions = function (state, deepHistory) {
        if (this.isComplete(state)) {
            var result = single(this.completions, function (c) { return c.guard(state); });
            
            if (result) {
                result.traverse(state, deepHistory);
            }
        }
    };
    
    SimpleState.prototype.process = function (state, message) {
        var result = single(this.transitions, function (t) { return t.guard(state, message); });
                
        if (!result) {
            return false;
        }
        
        result.traverse(state, message);

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

    CompositeState.prototype.isComplete = function (state) {
        var current = getCurrent(state, this);
        
        return state.isTerminated || current === null || current.isFinalState || getActive(state, current) === false;
    };
    
    CompositeState.prototype.beginExit = function (state) {
        var current = getCurrent(state, this);
    
        if (current) {
            current.beginExit(state);
            current.endExit(state);
        }
    };
    
    CompositeState.prototype.endEntry = function (state, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(state, this) : this.initial) || this.initial;
    
        current.beginEntry(state);
        current.endEntry(state, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    
        SimpleState.prototype.endEntry.call(this, state, deepHistory);
    };
    
    CompositeState.prototype.process = function (state, message) {
        var result = SimpleState.prototype.process.call(this, state, message) || getCurrent(state, this).process(state, message);
        
        // NOTE: the following code is the fix to bug #5; while this is now correct, it may introduce unexpected behaviour in old models
        if (result === true) {
            this.evaluateCompletions(state, false);
        }
        
        return result;
    };

    CompositeState.prototype.getCurrent = function (state) {
        var result = Element.prototype.getCurrent.call(this, state), current = getCurrent(state, this);
        
        if (current) {
            result.current = current.getCurrent(state);
        }
        
        return result;
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
    
    OrthogonalState.prototype.isComplete = function (state) {
        var i, len;
        
        if (!state.isTerminated) {
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                if (!this.regions[i].isComplete(state)) {
                    return false;
                }
            }
        }
        
        return true;
    };
    
    OrthogonalState.prototype.beginExit = function (state) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(state, this.regions[i])) {
                this.regions[i].beginExit(state);
                this.regions[i].endExit(state);
            }
        }
    };

    OrthogonalState.prototype.endEntry = function (state, deepHistory) {
        var i, len;

        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            this.regions[i].beginEntry(state);
            this.regions[i].endEntry(state);
        }

        SimpleState.prototype.endEntry.call(this, state, deepHistory);
    };

    OrthogonalState.prototype.process = function (state, message) {
        var i, len, result = false;
        
        if (!state.isTerminated) {
            if ((result = SimpleState.prototype.process.call(this, state, message)) === false) {
                for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                    result = this.regions[i].process(state, message) || result;
                }
            }
        }
        
        // NOTE: the following code is the fix to bug #5; while this is now correct, it may introduce unexpected behaviour in old models
        if (result === true) {
            this.evaluateCompletions(state, false);
        }
        
        return result;
    };
    
    OrthogonalState.prototype.getCurrent = function (state) {
        var result = Element.prototype.getCurrent.call(this, state), i, len;
        result.regions = [];
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(state, this.regions[i])) {
                result.regions[i] = this.regions[i].getCurrent(state);
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
    
    FinalState.prototype.process = function (state, message) {
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
     * @param {object} state - the state machine state.
     * @return {bool} True if the region is complete.
     */
    Region.prototype.isComplete = function (state) {
        var current = getCurrent(state, this);
        
        return state.isTerminated || current === null || current.isFinalState || getActive(state, current) === false;
    };

    /**
     * Initialises a region to its inital state
     * @this {CompositeState}
     * @param {object} state - the state machine state.
     */
    Region.prototype.initialise = function (state) {
        this.beginEntry(state);
        this.endEntry(state, false);
    };

    Region.prototype.beginExit = function (state) {
        var current = getCurrent(state, this);

        if (current) {
            current.beginExit(state);
            current.endExit(state);
        }
    };

    Region.prototype.endEntry = function (state, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(state, this) : this.initial) || this.initial;

        current.beginEntry(state);
        current.endEntry(state, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    };

    /**
     * Attempt to process a message against the region
     * @this {Region}
     * @param {object} state - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    Region.prototype.process = function (state, message) {
        if (state.isTerminated) {
            return false;
        }

        return getActive(state, this) && getCurrent(state, this).process(state, message);
    };

    Region.prototype.getCurrent = function (state) {
        var result = Element.prototype.getCurrent.call(this, state), current = getCurrent(state, this);
        
        if (current) {
            result.current = current.getCurrent(state);
        }
        
        return result;
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
     * @param {object} state - the state machine state.
     * @return {bool} True if the state machine is complete.
     */
    StateMachine.prototype.isComplete = function (state) {
        var i, len;
        
        if (!state.isTerminated) {
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                if (!this.regions[i].isComplete(state)) {
                    return false;
                }
            }
        }
        
        return true;
    };

    /**
     * Initialises a state machine to its inital state
     * @this {StateMachine}
     * @param {object} state - the state machine state.
     */
    StateMachine.prototype.initialise = function (state) {
        this.beginEntry(state);
        this.endEntry(state, false);
    };
    
    StateMachine.prototype.beginExit = function (state) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(state, this.regions[i])) {
                this.regions[i].beginExit(state);
                this.regions[i].endExit(state);
            }
        }
	};

    StateMachine.prototype.endEntry = function (state, deepHistory) {
        var i, len;
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            this.regions[i].beginEntry(state);
            this.regions[i].endEntry(state, deepHistory);
        }
        
        Element.prototype.endEntry.call(this, state, deepHistory);
    };

    /**
     * Attempt to process a message against the state machine
     * @this {StateMachine}
     * @param {object} state - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    StateMachine.prototype.process = function (state, message) {
        var i, len, result = false;
        
        if (!state.isTerminated) {
            
            for (i = 0, len = this.regions.length; i < len; i = i + 1) {
                result = this.regions[i].process(state, message) || result;
            }
        }
        
        return result;
    };

    StateMachine.prototype.getCurrent = function (state) {
        var result = Element.prototype.getCurrent.call(this, state), i, len;
        result.regions = [];
        
        for (i = 0, len = this.regions.length; i < len; i = i + 1) {
            if (getActive(state, this.regions[i])) {
                result.regions[i] = this.regions[i].getCurrent(state);
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

// initialise in node.js state
if (this.exports) {
    initStateJS(this.exports);

// initialise in the require.js state
} else if (this.define) {
    this.define(function (require, exports, module) { "use strict"; initStateJS(exports); });
    
// initialise in the global scope 
} else {
    initStateJS(this);
}