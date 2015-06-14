### Note on dynamic models
state.js supports dynamic, additive changes to a state machine model at runtime. This can be, as you can imagine, a fairly complex construct to work with and debug.

You are fairly free to add the following at any time: vertices to regions, transtitions, behaviour. But do note that you may only **add new child regions to states if the state is not currently active** as this would cause extremely unpredictable behaviour.

Once you have added the new model element and/or transitions, the default behaviour of state.js is to recompile the state machine model on the next call to ```js evaluate```; this may be overridden by setting the ```js autoInitialiseModel``` parameter to ```js true```.
You may then manually initialise the state machine model with a call to ```js initialise``` passing only the state machine model.