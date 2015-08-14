/**
 * Interface that must be conformed to for logging messages
 * @interface ILogTo
 */
export interface ILogTo {
    /**
     * Log an informational message
     * @method log
     * @param {string} message The informational message to log.
     */
    log(message: string): void;
}
/**
 * Interface that must be conformed to for warning messages
 * @interface IWarnTo
 */
export interface IWarnTo {
    /**
     * Log a warning message
     * @method warn
     * @param {string} message The warning message to log.
     */
    warn(message: string): void;
}
/**
 * Interface that must be conformed to for error messages
 * @interface IWarnTo
 */
export interface IErrorTo {
    /**
     * Raise an error message
     * @method warn
     * @param {string} message The warning message to raise.
     */
    error(message: string): void;
}
export declare var defaultConsole: {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
};
/**
 * The object used to send log messages to. Point this to another object if you wish to implement custom logging.
 * @member {ILogTo}
 */
export declare var logTo: ILogTo;
/**
 * The object used to send warning messages to. Point this to another object if you wish to implement custom warnings.
 * @member {IWarnTo}
 */
export declare var warnTo: IWarnTo;
/**
 * The object used to send error messages to. Point this to another object if you wish to implement custom warnings.
 *
 * Default behaviour for error messages is to throw an exception.
 * @member {IErrorTo}
 */
export declare var errorTo: IErrorTo;
