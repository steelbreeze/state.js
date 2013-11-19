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
    
    function getChoiceCompletion(completions) {
        
        var results = completions.filter(function (completion) { return !completion.isElse && completion.guard(); });
    
        if (results.length > 1) {
            return results[(results.length - 1) * Math.random()];
        }
    
        if (results.length === 0) {
            results = completions.filter(function (completion) { return completion.isElse; });
        }
        
        if (results.length === 1) {
            return results[0];
        }
        
        // otherwise the machine is malformed
        throw "choice pseudo state has no valid outbound transition";
    }
    
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
    
    function setActive(context, element, value) {
        if (!context.active) {
            context.active = [];
        }
    
        context.active[element] = value;
    }
    
    function getActive(context, element) {
        if (context.active) {
            return context.active[element];
        }
    }
    
    function setCurrent(context, element, value) {
        if (!context.current) {
            context.current = [];
        }
    
        context.current[element] = value;
    }

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

    Element.prototype.ancestors = function () {
        var result = this.owner ? this.owner.ancestors() : [];
        
        result.push(this);
        
        return result;
    };

    Element.prototype.beginExit = function (context) {
    };

    Element.prototype.endExit = function (context) {
        console.log("Leave: " + this.toString());

        setActive(context, this, false);
    };

    Element.prototype.beginEnter = function (context) {
        if (getActive(context, this)) {
            this.beginExit(context);
            this.endExit(context);
        }
	
        console.log("Enter: " + this.toString());

        setActive(context, this, true);
    };

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

    SimpleState.prototype.isComplete = function (context) {
        return true;
    };

    SimpleState.prototype.endExit = function (context) {
        if (this.exit) {
            this.exit.forEach(function (exit) { exit(); });
        }
        
        Element.prototype.endExit.call(this, context);
    };

    SimpleState.prototype.beginEnter = function (context) {
        Element.prototype.beginEnter.call(this, context);

        if (this.owner) {
            setCurrent(context, this.owner, this);
        }

        if (this.entry) {
            this.entry.forEach(function (entry) { entry(); });
        }
    };

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
    
    CompositeState.prototype = new SimpleState();
    CompositeState.prototype.constructor = CompositeState;

    CompositeState.prototype.isComplete = function (context) {
        return context.isTerminated || getCurrent(context, this).isFinalState;
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
    
    OrthogonalState.prototype.isComplete = function (context) {
        return context.isTerminated || this.regions.every(function (region) { return region.isComplete(context); });
    };
    
    OrthogonalState.prototype.beginExit = function (context) {
        this.regions.forEach(function (region) { if (getActive(context, region)) {region.beginExit(context); region.endExit(context); } });
    };

    OrthogonalState.prototype.endEnter = function (context, deepHistory) {
        this.regions.forEach(function (region) { region.beginEnter(context); region.endEnter(context, deepHistory); });

        SimpleState.prototype.endEnter.call(context, deepHistory);
    };

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
    
    FinalState.prototype.process = function (context, message) {
        return false;
    };

    /**
     * Creates an instance of a region.
     *
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
     * Creates an instance of a state machine.
     *
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
     *
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     * @return {bool} True if the state machine is complete.
     */
    StateMachine.prototype.isComplete = function (context) {
        return context.isTerminated || this.regions.every(function (region) { return region.isComplete(context); });
    };

    /**
     * Initialises a state machine to its inital state
     *
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     */
    StateMachine.prototype.initialise = function (context) {
        this.beginEnter(context);
        this.endEnter(context, false);
    };

    
    StateMachine.prototype.beginExit = function (context) {
        this.regions.forEach(function (region) {
            if (getActive(context, this)) {
                region.beginExit(context);
                region.endExit(context);
            }
        });
	};

    StateMachine.prototype.endEnter = function (context, deepHistory) {
        this.regions.forEach(function (region) {
            region.beginEnter(context);
            region.endEnter(context, deepHistory);
        });

        Element.prototype.endEnter.call(context, deepHistory);
    };

    /**
     * Attempt to process a message against the state machine
     *
     * @this {StateMachine}
     * @param {object} context - the state machine state.
     * @param {object} message - the message to pass into the state machine.
     * @return {bool} True of if the message caused a transition execution.
     */
    StateMachine.prototype.process = function (context, message) {
        if (context.isTerminated) {
            return false;
        }

        return this.regions.reduce(function (result, region) {return region.process(context, message) || result; }, false);
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
            var sourceAncestors = source.ancestors(),
                targetAncestors = target.ancestors(),
                uncommonAncestor = source.owner === target.owner ? sourceAncestors.length - 1 : uncommon(sourceAncestors, targetAncestors, 0);

            this.exit = sourceAncestors.slice(uncommonAncestor);
            this.enter = targetAncestors.slice(uncommonAncestor);
            
            this.exit.reverse();
        }

        source[guard && guard.length > 0 ? "transitions" : "completions"].push(this);
    }
    
    Transition.prototype.traverse = function (context, message) {
        if (this.exit) {
            this.exit[0].beginExit(context);
            
            this.exit.forEach(function (element) { element.endExit(context); });
        }

        if (this.effect) {
            this.effect.forEach(function (effect) { effect(message); });
        }

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
