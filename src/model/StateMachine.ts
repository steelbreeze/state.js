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
		logTo: LogTo = defaultConsole;
		warnTo: WarnTo = defaultConsole;
		errorTo: ErrorTo = defaultConsole;

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
		 * @param {LogTo} value Pass in console to log to the console, or another other object implementing the LogTo interface.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setLogger(value: LogTo): StateMachine {
			this.logTo = value;
			this.clean = false;

			return this;
		}

		/**
		 * Instructs the state machine model to direct warnings activity to an object supporting the Console interface.
		 * @method setWarning
		 * @param {WarnTo} value Pass in console to log to the console, or another other object implementing the WarnTo interface.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setWarning(value: WarnTo): StateMachine {
			this.warnTo = value;
			this.clean = false;

			return this;
		}

		/**
		 * Instructs the state machine model to direct error messages to an object supporting the Console interface.
		 * @method setError
		 * @param {ErrorTo} value Pass in console to log to the console, or another other object implementing the ErrorTo interface.
		 * @returns {StateMachine} Returns the state machine to enable fluent style API.
		 */
		public setError(value: ErrorTo): StateMachine {
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

	/**
	 * Interface that must be conformed to for logging messages
	 * @interface LogTo
	 */
	export interface LogTo {
		/**
		 * Log an informational message
		 * @method log
		 * @param {string} message The informational message to log.
		 */
		log(message: string): void;
	}

	/**
	 * Interface that must be conformed to for warning messages
	 * @interface WarnTo
	 */
	export interface WarnTo {
		/**
		 * Log a warning message
		 * @method warn
		 * @param {string} message The warning message to log.
		 */
		warn(message: string): void;
	}

	/**
	 * Interface that must be conformed to for error messages
	 * @interface WarnTo
	 */
	export interface ErrorTo {
		/**
		 * Raise an error message
		 * @method warn
		 * @param {string} message The warning message to raise.
		 */
		error(message: string): void;
	}

	export var defaultConsole = {
		log: function(message: string): void { },
		warn: function(message: string): void { },
		error: function(message: string): void { throw message; }
	}
}