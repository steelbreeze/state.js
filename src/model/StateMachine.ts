/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * An element within a state machine model that represents the root of the state machine model.
	 *
	 * StateMachine extends the State class and inherits its public interface.
	 * @class StateMachine
	 * @augments State
	 */
	export class StateMachine extends State {
		// flag used to indicate that the state machine model has has structural changes and therefore requires initialising.
		clean = false;

		// the behaviour required to initialise state machine instances; created when initialising the state machine model.
		onInitialise: Array<Action>;

		// used to inject logging, warnings and errors.
		logTo: Console;
		warnTo: Console;
		errorTo: Console = <Console>{ error: function(message) { throw message; } };

		/**
		 * Creates a new instance of the StateMachine class.
		 * @param {string} name The name of the state machine.
		 */
		public constructor(name: string) {
			super(name, undefined);
		}

		/**
		 * Returns the root element within the state machine model.
		 * Note that if this state machine is embeded within another state machine, the ultimate root element will be returned.
		 * @method getRoot
		 * @returns {StateMachine} The root state machine element.
		 */
		public getRoot(): StateMachine {
			return this.region ? this.region.getRoot() : this;
		}

		/**
		 * Instructs the state machine model to log activity to an object supporting the Console interface.
		 * @method setLogger
		 * @param {Console} value Pass in console to log to the console, or any other object supporting the .log method.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setLogger(value: Console = undefined): StateMachine {
			this.logTo = value;
			this.clean = false;

			return this;
		}

		/**
		 * Instructs the state machine model to direct warnings activity to an object supporting the Console interface.
		 * @method setWarning
		 * @param {Console} value Pass in console to log to the console, or any other object supporting the .warn method.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setWarning(value: Console = undefined): StateMachine {
			this.warnTo = value;
			this.clean = false;

			return this;
		}

		/**
		 * Instructs the state machine model to direct error messages to an object supporting the Console interface.
		 * @method setError
		 * @param {Console} value Pass in console to log to the console, or any other object supporting the .error method.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setError(value: Console = undefined): StateMachine {
			this.errorTo = value;
			this.clean = false;

			return this;
		}

		/**
		 * Accepts an instance of a visitor and calls the visitStateMachine method on it.
		 * @method accept
		 * @param {Visitor<TArg1>} visitor The visitor instance.
		 * @param {TArg1} arg1 An optional argument to pass into the visitor.
		 * @param {any} arg2 An optional argument to pass into the visitor.
		 * @param {any} arg3 An optional argument to pass into the visitor.
		 * @returns {any} Any value can be returned by the visitor.
		 */
		public accept<TArg1>(visitor: Visitor<TArg1>, arg1?: TArg1, arg2?: any, arg3?: any): any {
			return visitor.visitStateMachine(this, arg1, arg2, arg3);
		}
	}
}