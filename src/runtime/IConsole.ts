/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * The methods that state.js may use from a console implementation. Create objects that ahdere to this interface for custom logging, warnings and error handling.
	 * @interface IConsole
	 */
	export interface IConsole {
		/**
		 * Outputs a log message.
		 * @method log
		 * @param {any} message The object to log.
		 */
		log(message?: any, ...optionalParams: any[]): void;

		/**
		 * Outputs a warnnig warning.
		 * @method log
		 * @param {any} message The object to log.
		 */
		warn(message?: any, ...optionalParams: any[]): void;

		/**
		 * Outputs an error message.
		 * @method log
		 * @param {any} message The object to log.
		 */
		error(message?: any, ...optionalParams: any[]): void;
	}
}