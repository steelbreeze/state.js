module fsm {
	/**
	 * Declaration callbacks that provide transition guard conditions.
	 * @interface Guard
	 * @param {any} message The message that may trigger the transition.
	 * @param {IActiveStateConfiguration} instance The state machine instance.
	 * @param {boolean} history Internal use only
	 * @returns {boolean} True if the guard condition passed.
	 */
	export interface Guard {
		(message: any, instance: IActiveStateConfiguration): boolean;
	}
}