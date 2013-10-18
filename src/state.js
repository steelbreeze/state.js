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

// initialise state.js
function initStateJS(exports) {
    "use strict";
    
    // selects the approriate completion transition for a initial pseudo states
    function getInitialCompletion(completions) {
        
        // return the completion if a single one
        if (completions.length === 1) {
            return completions[0];
        }
        
        // otherwise the machine is malformed
        throw "initial pseudo states must have one and only one outbound transition";
    }
    
    // selects the approriate completion transition for a choice pseudo state
    function getChoiceCompletion(completions) {
        
        // find completions with guards that evaluate true
        var results = completions.filter(function (completion) { return completion.guard(); });
    
        // select a random one in the event of multiple available
        if (results.length > 1) {
            return results[(results.length - 1) * Math.random()];
        }
    
        // look for 'else' completions if none found
        if (results.length === 0) {
            results = completions.filter(function (completion) { return completion.isElse; });
        }
        
        // return the completion if a single one or else found
        if (results.length === 1) {
            return results[0];
        }
        
        // otherwise the machine is malformed
        throw "choice pseudo state has no valid outbound transition";
    }
    
    // selects the appropriate completion transition for a junction pseudo state
    function getJunctionCompletion(completions) {
        
        // find completions with guards that evaluate true
        var results = completions.filter(function (completion) { return completion.guard(); });

        // if more than one, the machine is malformed
        if (results.length > 1) {
            throw "junction pseudo state has multiple outbound transitions";
        }
    
        // look for 'else' completions if none found
        if (results.length === 0) {
            results = completions.filter(function (completion) { return completion.isElse; });
        }
        
        // return the completion if a single one or else found
        if (results.length === 1) {
            return results[0];
        }
    
        // otherwise the machine is malformed
        throw "junction pseudo state has no valid outbound transition";
    }
    
    // sets an element within a state machine active for a given context
    function setActive(context, element, value) {
        if (!context.active) {
            context.active = [];
        }
    
        context.active[element] = value;
    }
    
    // gets the active status of an element withing a state machine for a given context
    function getActive(context, element) {
        if (context.active) {
            return context.active[element];
        }
    }
    
    // sets the current child state of a region or composite state for a given context
    function setCurrent(context, element, value) {
        if (!context.current) {
            context.current = [];
        }
    
        context.current[element] = value;
    }
    
    // gets teh current child state of a region of composite state for a given context
    function getCurrent(context, element) {
        if (context.current) {
            return context.current[element];
        }
    }
    
    // returns the ancestors of an element
    function ancestors(element) {
        return element.owner ? ancestors(element.owner).concat(element) : [element];
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

    /**
     * Creates an instance of a pseudo state.
     *
     * @constructor
     * @this {PseudoState}
     * @param {string} name - The name given to the pseudo state.
     * @param {PseudoStateKind} kind - The kind of pseudo state to create.
     * @param {(Region|CompositeState)} owner - The owning parent region or composite state.
     */
    function PseudoState(name, kind, owner) {
        this.name = name;
        this.kind = kind;
        this.owner = owner;
        this.completions = [];
    
        // update the parents initial state as appropriate
        if (this.kind.isInitial) {
            this.owner.initial = this;
        }
    }
    
    /**
     * Called whenever a pseudo state is exited
     *
     * @private
     * @this {PseudoState}
     * @param {object} context - the state machine state.
     */
    PseudoState.prototype.onExit = function (context) {
        console.log("Leave: " + this.toString());

        setActive(context, this, false);
    };

    /**
     * Called whenever a pseudo state is entered
     *
     * @private
     * @this {PseudoState}
     * @param {object} context - the state machine state.
     */
    PseudoState.prototype.onEnter = function (context) {
        if (getActive(context, this)) {
            this.onExit(context);
        }

        console.log("Enter: " + this.toString());

        setActive(context, this, true);

        if (this.kind === PseudoStateKind.Terminated) {
            context.isTerminated = true;
        }
    };

    /**
     * Called to complete entry of the pseudo state, triggering transition to the next state
     *
     * @private
     * @this {PseudoState}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    PseudoState.prototype.onComplete = function (context, deepHistory) {
        var completion = this.kind.completions(this.completions);

        if (completion) {
            completion.traverse(context, deepHistory);
        }
    };

    /**
     * Returns the fully qualified name of the pseudo state.
     *
     * @override
     * @this {PseudoState}
     * @return {string} Fully qualified name of the pseudo state.
     */
    PseudoState.prototype.toString = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };
    
    /**
     * Creates an instance of a simple state.
     *
     * @constructor
     * @this {SimpleState}
     * @param {string} name - The name given to the simple state.
     * @param {(Region|CompositeState)} owner - The owining parent region or composite state.
     */
    function SimpleState(name, owner) {
        this.name = name;
        this.owner = owner;
        this.completions = [];
        this.transitions = [];
    }
    
    /**
     * Determines if a simple state is complete
     *
     * @this {SimpleState}
     * @param {object} context - the state machine state.
     * @return {bool} True if the Simple State is complete.
     */
    SimpleState.prototype.isComplete = function (context) {
        return true;
    };

    /**
     * Called whenever a simple state is exited
     *
     * @private
     * @this {PseudoState}
     * @param {object} context - the state machine state.
     */
    SimpleState.prototype.onExit = function (context) {
        if (this.exit) {
            this.exit.forEach(function (exit) { exit(); });
        }

        console.log("Leave: " + this.toString());

        setActive(context, this, false);
    };

    /**
     * Called whenever a simple state is entered
     *
     * @private
     * @this {SimpleState}
     * @param {object} context - the state machine state.
     */
    SimpleState.prototype.onEnter = function (context) {
        if (getActive(context, this)) {
            this.onExit(context);
        }

        console.log("Enter: " + this.toString());

        setActive(context, this, true);

        if (this.owner) {
            setCurrent(context, this.owner, this);
        }

        if (this.entry) {
            this.entry.forEach(function (entry) { entry(); });
        }
    };

    /**
     * Called to complete entry of the simple state, tests for completion transitions as required
     *
     * @private
     * @this {SimpleState}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    SimpleState.prototype.onComplete = function (context, deepHistory) {
        if (this.completions) {
            if (this.isComplete(context)) {
                var results = this.completions.filter(function (completion) { return completion.guard(); });

                if (results.length === 1) {
                    results[0].traverse(context, deepHistory);
                }
            }
        }
    };

    /**
     * Attempt to process a message against the simple state
     *
     * @this {SimpleState}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    SimpleState.prototype.process = function (context, message) {
        if (context.isTerminated) {
            return false;
        }

        var results = this.transitions.filter(function (transition) { return transition.guard(message); });

        if (results.length !== 1) {
            if (results.length === 0) {
                return false;
            }

            throw "more than one transition found for message: " + message.toString();
        }

        results[0].traverse(context, message);

        return true;
    };

    /**
     * Returns the fully qualified name of the state.
     *
     * @override
     * @this {SimpleState}
     * @return {string} Fully qualified name of the state.
     */
    SimpleState.prototype.toString = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };

    /**
     * Creates an instance of a composite state.
     *
     * @constructor
     * @augments SimpleState
     * @this {CompositeState}
     * @param {string} name - The name given to the composite state.
     * @param {(Region|CompositeState)} [owner] - The owining parent region or composite state.
     */
    function CompositeState(name, owner) {
        SimpleState.call(this, name, owner);
    }
    
    // ensure composite state inherits simple state prototype
    CompositeState.prototype = new SimpleState();
    CompositeState.prototype.constructor = CompositeState;

    /**
     * Determines if a composite state is complete
     *
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     * @return {bool} True if the composite state is complete.
     */
    CompositeState.prototype.isComplete = function (context) {
        return context.isTerminated || getCurrent(context, this).isFinalState;
    };
    
    /**
     * Initialises a composite state to its inital state
     *
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     */
    CompositeState.prototype.initialise = function (context) {
        this.onEnter(context);
        this.onComplete(context, false);
    };
    
    /**
     * Called whenever a composite state is exited
     *
     * @private
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     */
    CompositeState.prototype.onExit = function (context) {
        var current = getCurrent(context, this);
    
        if (current) {
            current.onExit(context);
        }
    
        SimpleState.prototype.onExit.call(this, context);
    };
    
    /**
     * Called to complete entry of the composite state, enters child states then tests for completion transitions as required
     *
     * @private
     * @this {CompositeStateState}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    CompositeState.prototype.onComplete = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;
    
        current.onEnter(context);
        current.onComplete(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    
        SimpleState.prototype.onComplete.call(this, context, deepHistory);
    };
    
    /**
     * Attempt to process a message against the composite state
     *
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    CompositeState.prototype.process = function (context, message) {
        if (context.isTerminated) {
            return false;
        }
    
        return SimpleState.prototype.process.call(this, context, message) || getCurrent(context, this).process(context, message);
    };
    
    /**
     * Creates an instance of an orthogonal state.
     *
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
    
    /**
     * Determines if an orthogonal state is complete
     *
     * @this {OrthogonalState}
     * @param {object} context - the state machine state.
     * @return {bool} True if the orthogonal state is complete.
     */
    OrthogonalState.prototype.isComplete = function (context) {
        return context.isTerminated || this.regions.every(function (region) { return region.isComplete(context); });
    };
    
    /**
     * Called whenever an orthogonal state is exited
     *
     * @private
     * @this {OrthogonalState}
     * @param {object} context - the state machine state.
     */
    OrthogonalState.prototype.onExit = function (context) {
        this.regions.forEach(function (region) { if (getActive(context, region)) {region.onExit(context); } });
        
        SimpleState.prototype.onExit.call(this, context);
    };
    
    /**
     * Called to complete entry of the orthogonal state, enters child regions then tests for completion transitions as required
     *
     * @private
     * @this {OrthogonalStateState}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    OrthogonalState.prototype.onComplete = function (context, deepHistory) {
        this.regions.forEach(function (region) { region.onEnter(context); region.onComplete(context, deepHistory); });
        
        SimpleState.prototype.onComplete.call(this, context, deepHistory);
    };
    
    /**
     * Attempt to process a message against the orthogonal state
     *
     * @this {OrthogonalState}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    OrthogonalState.prototype.process = function (context, message) {
        if (context.isTerminated) {
            return false;
        }
    
        return SimpleState.prototype.process.call(this, context, message) || this.regions.reduce(function (result, region) {return region.process(context, message) || result; }, false);
    };
    
    /**
     * Creates an instance of a final state.
     *
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
    
    /**
     * Attempt to process a message against the final state
     *
     * @this {FinalState}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    FinalState.prototype.process = function (context, message) {
        return false;
    };

    /**
     * Creates an instance of a region.
     *
     * @constructor
     * @this {Region}
     * @param {string} name The name given to the simple state.
     * @param {OrthogonalState} [owner] - The owining parent orthogonal state.
     */
    function Region(name, owner) {
        this.name = name;
        this.owner = owner;
        this.initial = null;
    
        if (this.owner) {
            this.owner.regions.push(this);
        }
    }

    /**
     * Determines if a region is complete
     *
     * @this {Region}
     * @param {object} context - the state machine state.
     * @return {bool} True if the region is complete.
     */
    Region.prototype.isComplete = function (context) {
        return context.isTerminated || getCurrent(context, this).isFinalState;
    };

    /**
     * Initialises a region to its inital state
     *
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     */
    Region.prototype.initialise = function (context) {
        this.onEnter(context);
        this.onComplete(context, false);
    };

    /**
     * Called whenever a region is exited
     *
     * @private
     * @this {Region}
     * @param {object} context - the state machine state.
     */
    Region.prototype.onExit = function (context) {
        var current = getCurrent(context, this);

        if (current) {
            current.onExit(context);
        }

        console.log("Leave: " + this.toString());

        setActive(context, this, false);
    };

    /**
     * Called whenever a region is entered
     *
     * @private
     * @this {Region}
     * @param {object} context - the state machine state.
     */
    Region.prototype.onEnter = function (context) {
        if (getActive(context, this)) {
            this.onExit(context);
        }

        console.log("Enter: " + this.toString());

        setActive(context, this, true);
    };

    /**
     * Called to complete entry of the region, entering the child state as appropriate
     *
     * @private
     * @this {Region}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    Region.prototype.onComplete = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;

        current.onEnter(context);
        current.onComplete(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    };

    /**
     * Attempt to process a message against the region
     *
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
     * Returns the fully qualified name of the region.
     *
     * @override
     * @this {Region}
     * @return {string} - Fully qualified name of the region.
     */
    Region.prototype.toString = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };

    /**
     * Creates an instance of a transition.
     *
     * @constructor
     * @this {Transition}
     * @param {object} source - The source state or pseudo state of the transition.
     * @param {object} [target] - The target state or pseudo state of the transition.
     * @param {function} [guard] The guard condition that must evaluate true prior to traversing from source to target.
     */
    function Transition(source, target, guard) {
        this.target = target;
        this.guard = guard || function (message) { return true; };
    
        // evaluate path for non-internal transitions
        if (target) {
            // get the source and target ancetries
            var sourceAncestors = ancestors(source),
                targetAncestors = ancestors(target),
                i = sourceAncestors.length - 1;

            // find the index of the first divergance in the ancestry
            if (source !== target) {
                i = 0;
                while (i < sourceAncestors.length && i < targetAncestors.length && sourceAncestors[i] === targetAncestors[i]) {
                    i = i + 1;
                }
            }
        
            // exit from the first element below the common ancestor on the source side
            this.onExit = [sourceAncestors[i]];
        
            // edge case to exit pseudo state if its the source and not the node being exited above
            if (source.kind && sourceAncestors[i] !== source) {
                this.onExit.unshift(source);
            }

            // enter all elements in the target ancestry below the common ancestor
            this.onEnter = targetAncestors.slice(i);
        }

        // add to the appropriate set of transitions
        source[guard && guard.length > 0 ? "transitions" : "completions"].push(this);
    }
    
    /**
     * Called to execute the traversal of a transition
     *
     * @private
     * @this {Transition}
     * @param {object} context - the state machine state.
     * @param {object} [message] - the message that caused the transition (not required for completion transitions)
     */
    Transition.prototype.traverse = function (context, message) {
        // exit all the elements as necessary
        if (this.onExit) {
            this.onExit.forEach(function (element) { element.onExit(context); });
        }

        // call the transitions effect if required
        if (this.effect) {
            this.effect.forEach(function (effect) { effect(message); });
        }

        // enter all elements as necessary
        if (this.onEnter) {
            this.onEnter.forEach(function (element) { element.onEnter(context); });
        }

        // complete the entry as necessary
        if (this.target) {
            this.target.onComplete(context, false);
        }
    };
    
    /**
     * Creates an instance of an else transition for use at choice and junction pseudo states.
     *
     * @constructor
     * @augments Transition
     * @this {Transition.Else}
     * @param {object} source - The source state or pseudo state of the transition.
     * @param {object} [target] - The target state or pseudo state of the transition.
     */
    Transition.Else = function (source, target) {
        Transition.call(this, source, target, function () { return false; });

        this.isElse = true;
    };
    
    Transition.Else.prototype = Transition.prototype;
    Transition.Else.prototype.constructor = Transition.Else;

    // export the public API
    exports.PseudoStateKind = PseudoStateKind;
    exports.PseudoState = PseudoState;
    exports.SimpleState = SimpleState;
    exports.CompositeState = CompositeState;
    exports.OrthogonalState = OrthogonalState;
    exports.FinalState = FinalState;
    exports.Region = Region;
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
