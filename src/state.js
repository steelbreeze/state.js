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
        var results = completions.filter(function (completion) { return !completion.isElse && completion.guard(); });
    
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
        var result = null;
        
        completions.forEach(function (completion) {
            if (!completion.isElse) {
                if (completion.guard()) {
                    if (result !== null) {
                        throw "junction PseudoState has multiple valid completion transitions";
                    }
                    
                    result = completion;
                }
            }
        });
        
        if (result !== null) {
            return result;
        }
        
        completions.forEach(function (completion) {
            if (completion.isElse) {
                if (result !== null) {
                    throw "junctiom PseudoState has multiple else completion transitions";
                }
                    
                result = completion;
            }
        });
        
        if (result !== null) {
            return result;
        }
        
        throw "junction PseudoState has no valid competion transitions";
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
     * Creates an instance of an element.
     *
     * @constructor
     * @this {Element}
     * @param {string} name - The name given to the element.
     * @param {(Region|CompositeState)} owner - The owning parent element.
     */
    function Element(name, owner) {
        this.name = name;
        this.owner = owner;
    }
    
    /**
     * Returns the fully qualified name of the element.
     *
     * @this {Element}
     * @return {string} Fully qualified name of the element.
     */
    Element.prototype.qualifiedName = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };

    /**
     * Returns the ancestors of the element.
     *
     * @this {Element}
     * @return {Element[]} An array of elements.
     */
    Element.prototype.ancestors = function () {
        var result = this.owner ? this.owner.ancestors() : [];
        
        result.push(this);
        
        return result;
    };

    /**
     * Cascades the exit operation when begining a transition.
     *
     * @this {Element}
     * @param {object} context - the state machine state.
     */
    Element.prototype.beginExit = function (context) {
    };

    /**
     * Exits the element during a transition.
     *
     * @this {Element}
     * @param {object} context - the state machine state.
     */
    Element.prototype.endExit = function (context) {
        console.log("Leave: " + this.toString());

        setActive(context, this, false);
    };

    /**
     * Enters an element during a transition.
     *
     * @this {Element}
     * @param {object} context - the state machine state.
     */
    Element.prototype.beginEnter = function (context) {
        if (getActive(context, this)) {
            this.beginExit(context);
            this.endExit(context);
        }
	
        console.log("Enter: " + this.toString());

        setActive(context, this, true);
    };

    /**
     * Cascades the entry operation when ending a transition.
     *
     * @this {Element}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    Element.prototype.endEnter = function (context, deepHistory) {
    };
    
    /**
     * Returns the fully qualified name of the element.
     *
     * @override
     * @this {Element}
     * @return {string} Fully qualified name of the element.
     */
    Element.prototype.toString = function () {
        return this.qualifiedName();
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

    PseudoState.prototype.beginEnter = function (context) {
        Element.prototype.beginEnter.call(this, context);

        if (this.kind === PseudoStateKind.Terminate) {
            context.IsTerminated = true;
        }
    };

    PseudoState.prototype.endEnter = function (context, deepHistory) {
        this.kind.completions(this.completions).traverse(context, deepHistory);
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
        Element.call(this, name, owner);
        
        this.completions = [];
        this.transitions = [];
    }
    
    SimpleState.prototype = new Element();
    SimpleState.prototype.constructor = SimpleState;

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
    SimpleState.prototype.endExit = function (context) {
        if (this.exit) {
            this.exit.forEach(function (exit) { exit(); });
        }
        
        Element.prototype.endExit.call(this, context);
    };

    /**
     * Called whenever a simple state is entered
     *
     * @private
     * @this {SimpleState}
     * @param {object} context - the state machine state.
     */
    SimpleState.prototype.beginEnter = function (context) {
        Element.prototype.beginEnter.call(this, context);

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
    SimpleState.prototype.endEnter = function (context, deepHistory) {
        if (this.isComplete(context)) {
            var result = null;
            
            this.completions.forEach(function (transition) {
                if (transition.guard()) {
                    if (result !== null) {
                        throw "more than one completion transition found";
                    }
                    
                    result = transition;
                }
            });
            
            if (result !== null) {
                result.traverse(context, deepHistory);
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

        var result = null;
        
        this.transitions.forEach(function (transition) {
            if (transition.guard(message)) {
                if (result !== null) {
                    throw "more than one transition found for message: " + message.toString();
                }
                
                result = transition;
            }
        });
        
        if (result !== null) {
            result.traverse(context, message);
        }
        
        return result !== null;
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
     * Called whenever a composite state is exited
     *
     * @private
     * @this {CompositeState}
     * @param {object} context - the state machine state.
     */
    CompositeState.prototype.beginExit = function (context) {
        var current = getCurrent(context, this);
    
        if (current) {
            current.beginExit(context);
            current.endExit(context);
        }
    };
    
    /**
     * Called to complete entry of the composite state, enters child states then tests for completion transitions as required
     *
     * @private
     * @this {CompositeStateState}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    CompositeState.prototype.endEnter = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;
    
        current.beginEnter(context);
        current.endEnter(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
    
        SimpleState.prototype.endEnter.call(this, context, deepHistory);
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
    OrthogonalState.prototype.beginExit = function (context) {
        this.regions.forEach(function (region) { if (getActive(context, region)) {region.beginExit(context); region.endExit(context); } });
    };

    /**
     * Cascades the entry to child regions
     *
     * @private
     * @this {OrthogonalState}
     * @param {object} context - the state machine state.
     */
    OrthogonalState.prototype.endEnter = function (context, deepHistory) {
        this.regions.forEach(function (region) { region.beginEnter(context); region.endEnter(context, deepHistory); });

        SimpleState.PseudoState.endEnter.call(context, deepHistory);
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
        this.beginEnter(context);
        this.endEnter(context, false);
    };

    /**
     * Called whenever a region is exited
     *
     * @private
     * @this {Region}
     * @param {object} context - the state machine state.
     */
    Region.prototype.beginExit = function (context) {
        var current = getCurrent(context, this);

        if (current) {
            current.beginExit(context);
            current.endExit(context);
        }
    };

    /**
     * Called to complete entry of the region, entering the child state as appropriate
     *
     * @private
     * @this {Region}
     * @param {object} context - the state machine state.
     * @param {bool} deepHistory - flag to indicate deep history was in place while entering a parent region or composite state
     */
    Region.prototype.endEnter = function (context, deepHistory) {
        var current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;

        current.beginEnter(context);
        current.endEnter(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
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

    function uncommon(sourceAncestors, targetAncestors, index) {
        return sourceAncestors[index] === targetAncestors[index] ? uncommon(sourceAncestors, targetAncestors, index + 1) : index;
    }

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
        this.guard = guard || function (message) { return true; };
    
        // evaluate path for non-internal transitions
        if (target) {
            // get the source and target ancetries
            var sourceAncestors = source.ancestors(),
                targetAncestors = target.ancestors(),
                uncommonAncestor = source.owner === target.owner ? sourceAncestors.length - 1 : uncommon(sourceAncestors, targetAncestors, 0);

            this.exit = sourceAncestors.slice(uncommonAncestor);
            this.enter = targetAncestors.slice(uncommonAncestor);
            
            this.exit.reverse();
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
        if (this.exit) {
            this.exit[0].beginExit(context);
            
            this.exit.forEach(function (element) { element.endExit(context); });
        }

        // call the transitions effect if required
        if (this.effect) {
            this.effect.forEach(function (effect) { effect(message); });
        }

        // enter all elements as necessary
        if (this.enter) {
            this.enter.forEach(function (element) { element.beginEnter(context); });
            this.enter[this.enter.length - 1].endEnter(context, false);
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
    exports.Element = Element;
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
