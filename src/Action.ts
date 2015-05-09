module fsm {
	/**
	 * Declaration for callbacks that provide state entry, state exit and transition behaviour.
	 * @interface Action
	 * @param {any} message The message that may trigger the transition.
	 * @param {IActiveStateConfiguration} instance The state machine instance.
	 * @param {boolean} history Internal use only
	 * @returns {any} Actions can return any value.
	 */
	export interface Action {
		(message: any, instance: IActiveStateConfiguration, history: boolean): any;
	}
}