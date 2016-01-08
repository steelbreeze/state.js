/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Behavior encapsulates multiple Action callbacks that can be invoked by a single call.
	 * @class Behavior
	 */


    interface StringArray {
        [index: string]: Array<Action>;
    }
    export class Behavior {
        private actions: Array<Action> = [];
        count: number = 0;


        private myactions: StringArray = {};//用于并行

		/**
		 * Creates a new instance of the Behavior class.
		 * @param {Behavior} behavior The copy constructor; omit this optional parameter for a simple constructor.
		 */
        constructor(behavior?: Behavior) {
            if (behavior) {
                this.push(behavior); // NOTE: this ensures a copy of the array is made
                if (behavior.myactions) {
                    this.myactions = behavior.myactions;
                }
            }

        }
        toString() {
            return this.count;
        }

		/**
		 * Adds a single Action callback to this behavior instance.
		 * @method push
		 * @param {Action} action The Action callback to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
        push(action: Action): Behavior;

		/**
		 * Adds the set of Actions callbacks in a Behavior instance to this behavior instance.
		 * @method push
		 * @param {Behavior} behavior The  set of Actions callbacks to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
        push(behavior: Behavior): Behavior;

		/**
		 * Adds an Action or set of Actions callbacks in a Behavior instance to this behavior instance.
		 * @method push
		 * @param {Behavior} behavior The Action or set of Actions callbacks to add to this behavior instance.
		 * @returns {Behavior} Returns this behavior instance (for use in fluent style development).
		 */
        
        /**
         * 添加需要并行的块
         */
        push(behavior: any, sort: string): Behavior;

        push(behavior: any, sort?: string): Behavior {


            if (sort) {
                if (!this.myactions[sort]) {
                    this.myactions[sort] = [];
                }


                Array.prototype.push.apply(this.myactions[sort], behavior instanceof Behavior ? behavior.actions : arguments);
            } else {
                Array.prototype.push.apply(this.actions, behavior instanceof Behavior ? behavior.actions : arguments);
                this.myactions = behavior.myactions;

            }

            return this;
        }

		/**
		 * Tests the Behavior instance to see if any actions have been defined.
		 * @method hasActions
		 * @returns {boolean} True if there are actions defined within this Behavior instance.
		 */
        hasActions(): boolean { // TODO: find a better name
            return this.actions.length !== 0;
        }

		/**
		 * Invokes all the action callbacks in this Behavior instance.
		 * @method invoke
		 * @param {any} message The message that triggered the transition.
		 * @param {IInstance} instance The state machine instance.
		 * @param {boolean} history Internal use only
		 */
        invoke(message: any, instance: IInstance, history: boolean = false, callback?: any): any {
            "use strict"
          
            var self = this;
            var array_actions: any = [];
            // action(message, instance, history,state));
            // new Function("cb",action+"('"+message+"','"+instance+"',"+history+")"))
            this.actions.forEach(action => array_actions.push(function(cb: any) { if(StateJS.debug){console.log("action", self.toString(), action.toString());} action(message, instance, history); cb(null, 1); }));
            
            // for(let i=0;i<array_actions.length;i++){
            //     array_actions[i]();
            // }
           
            var myactions = this.myactions;
            array_actions.push(function(cb: any) {
                // async.series([function(cb){      
                    
                let len = length(myactions);
                if (len <= 0) {
                    cb(null, 1);
                    return;
                }
                var array_myactions: any = [];
                var eventNames: Array<string> = [];


                for (let i = 0; i < len; i++) {
                    eventNames.push("event" + Math.floor(Math.random() * 1023));
                }
                var ep = EventProxy.create(eventNames, function() {
                    cb(null, 1);
                });

                var j: number = 0;
                for (let pro in myactions) {
                    var array_myactions_item: any = [];
                    // console.log( myactions[pro].toString());
                    
                    myactions[pro].forEach(action => array_myactions_item.push(function(cb: any) { if(StateJS.debug){console.log("myactions", self.count, action.toString());} action(message, instance, history,cb);}));
                    array_myactions.push(array_myactions_item);
                    (function(j) {
                        async.series(array_myactions[j], function(error: any, result: any) {                            
                            ep.emit(eventNames[j]);
                        });
                    })(j);

                    j++;
                    // array_myactions.put(constructorFunction(this.myactions[pro]));
                    // this.myactions[pro].forEach(action => array_myactions.push(constructorFunction(action)) );
                    //  setTimeout(()=> this.myactions[pro].forEach(action => action(message, instance, history,state)),1000);
                }
                 
                // },function(){
                //     console.log(1111);
                // }]);
            });
            async.series(array_actions, function(error: any, result: any) {
                // if(StateJS.debug){
                    // console.log("actions_." + result);
                    // console.log(self.toString() + '>>>>>>main');
                    // console.log(result);
                    
                // }
                if (callback) {
                    callback(null, 1);
                }
               
            });

            function length(o: any) {
                var count = 0;
                for (var i in o) {
                    count++;
                }
                return count;
            };
            // if(array_myactions.length ==0){1
            //     return;
            // }
       
            
            // when.settle([array_myactions[0](),array_myactions[1](),array_myactions[2]()]).then(function(){
            //      deferred.resolve("action4");
            // });
          
            // this.actions.forEach(action => setTimeout(function(){action(message, instance, history,state)},1000));
        }

    }
}