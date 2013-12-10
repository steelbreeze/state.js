/*global console */
(function (exports) {
    "use strict";
    
    function getActive(context, element) {
        if (context.active) {
            return context.active[element];
        }
    }
    
    function getCurrent(context, element) {
        if (context.current) {
            return context.current[element];
        }
    }

    function ancestors(element) {
        var result = element.owner ? ancestors(element.owner) : [];
        
        result.push(element);
        
        return result;
    }

    function Transition(source, target, guard) {
        this.guard = guard || function () { return true; };
    
        if (target && (target !== null)) {
            var sourceAncestors = ancestors(source.owner),
                targetAncestors = ancestors(target.owner),
                ignoreAncestors = 0;

            while (sourceAncestors.length > ignoreAncestors && targetAncestors.length > ignoreAncestors && sourceAncestors[ignoreAncestors] === targetAncestors[ignoreAncestors]) {
                ignoreAncestors = ignoreAncestors + 1;
            }

            this.sourceAncestorsToExit = sourceAncestors.slice(ignoreAncestors).reverse();
            this.targetAncestorsToEnter = targetAncestors.slice(ignoreAncestors);
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
    
    Transition.Else = function (source, target) {
        Transition.call(this, source, target, function () { return false; });
    };
    
    Transition.Else.prototype = Transition.prototype;
    Transition.Else.prototype.constructor = Transition.Else;

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
    
    var PseudoStateKind = {
        DeepHistory: { isInitial: true, isHistory: true, completions: function (c) { return c[0]; } },
        Initial: { isInitial: true, isHistory: false, completions: function (c) { return c[0]; } },
        Junction: { isInitial: false, isHistory: false, completions: function (c) { return single(c, function (completion) { return completion.guard(); }) || single(c, function (completion) { return completion instanceof Transition.Else; }); } },
        ShallowHistory: { isInitial: true, isHistory: true, completions: function (c) { return c[0]; } },
        Terminate: { isInitial: false, isHistory: false, completions: null }
    };

    function Element(name, owner) {
        this.name = name;
        this.owner = owner;
        
        if (this.owner) {
            this.owner.isComposite = true;
        }
    }
    
    Element.prototype.beginExit = function (context) {
    };

    Element.prototype.endExit = function (context) {
//        if (console) {
//            console.log("Leave: " + this.toString());
//        }
        
        context.active[this] = false;
    };

    Element.prototype.beginEnter = function (context) {
        if (getActive(context, this)) {
            this.beginExit(context);
            this.endExit(context);
        }
	
//        if (console) {
//            console.log("Enter: " + this.toString());
//        }
        
        if (!context.active) {
            context.active = [];
        }
    
        context.active[this] = true;
    };

    Element.prototype.endEnter = function (context, deepHistory) {
    };
    
    Element.prototype.toString = function () {
        return this.owner ? this.owner + "." + this.name : this.name;
    };
    
    function PseudoState(name, kind, owner) {
        Element.call(this, name, owner);

        this.kind = kind;
        this.completions = [];
    
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
    
    function State(name, owner) {
        Element.call(this, name, owner);
        
        this.completions = [];
        this.transitions = [];
        this.isComposite = false;
    }
    
    State.prototype = new Element();
    State.prototype.constructor = State;

    State.prototype.isComplete = function (context) {
        if (this.isComposite === false) {
            return true;
        }
        
        var current = getCurrent(context, this);
        
        return context.isTerminated || current === null || (current.transitions.length === 0 && current.completions.length === 0) || getActive(context, current) === false;
    };
    
    State.prototype.initialise = function (context) {
        this.beginEnter(context);
        this.endEnter(context, false);
    };

    State.prototype.beginExit = function (context) {
        var current = getCurrent(context, this);
    
        if (current) {
            current.beginExit(context);
            current.endExit(context);
        }
    };
    
    State.prototype.endExit = function (context) {
        if (this.exit) {
            var i, len;

            for (i = 0, len = this.exit.length; i < len; i = i + 1) {
                this.exit[i]();
            }
        }
        
        Element.prototype.endExit.call(this, context);
    };

    State.prototype.beginEnter = function (context) {
        Element.prototype.beginEnter.call(this, context);

        if (this.owner) {
            if (!context.current) {
                context.current = [];
            }
        
            context.current[this.owner] = this;
        }

        if (this.entry) {
            var i, len;

            for (i = 0, len = this.entry.length; i < len; i = i + 1) {
                this.entry[i]();
            }
        }
    };

    State.prototype.endEnter = function (context, deepHistory) {
        var current, result;
        
        if (this.isComposite) {
            current = (deepHistory || this.initial.kind.isHistory ? getCurrent(context, this) : this.initial) || this.initial;
        
            current.beginEnter(context);
            current.endEnter(context, deepHistory || this.initial.kind === PseudoStateKind.DeepHistory);
        }

        if (this.isComplete(context)) {
            result = single(this.completions, function (completion) { return completion.guard(); });
        
            if (result) {
                result.traverse(context, deepHistory);
            }
        }
    };
    
    State.prototype.process = function (context, message) {
        var result = single(this.transitions, function (transition) { return transition.guard(message); });
        
        if (result) {
            result.traverse(context, message);
        
            return true;
        }
        
        return this.isComposite && getCurrent(context, this).process(context, message);
    };
    
    exports.PseudoStateKind = PseudoStateKind;
    exports.PseudoState = PseudoState;
    exports.State = State;
    exports.Transition = Transition;
}(this.exports || this));
