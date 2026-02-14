import { nonexhaustive } from '@likec4/core/utils';
import { errorFromLogRecord, getMessageOnlyFormatter, getTextFormatter, loggable, logger as root, } from '@likec4/log';
export const logger = root.getChild('server');
export { logger as serverLogger, };
// export const logger = root
export function logError(err) {
    logger.error(loggable(err));
}
/**
 * Logs an error as warning (not critical)
 */
export function logWarnError(err) {
    logger.warn(loggable(err));
}
export function getLspConnectionSink(connection, props) {
    const format = props?.formatter ?? getTextFormatter({
        format: ({ category, message }) => {
            return `${category} ${message}`;
        },
    });
    return (logObj) => {
        try {
            switch (logObj.level) {
                case 'trace':
                case 'debug':
                    connection.console.debug(format(logObj));
                    break;
                case 'info':
                    connection.console.info(format(logObj));
                    break;
                case 'warning':
                    connection.console.warn(format(logObj));
                    break;
                case 'error':
                case 'fatal': {
                    connection.console.error(format(logObj));
                    break;
                }
                default:
                    nonexhaustive(logObj.level);
            }
        }
        catch (e) {
            console.error('Error while logging to LSP connection:', e);
        }
    };
}
export function getTelemetrySink(connection) {
    const messageOnly = getMessageOnlyFormatter();
    return (logObj) => {
        try {
            switch (logObj.level) {
                case 'error':
                case 'fatal': {
                    const category = logObj.category.join('.');
                    if (category === 'likec4.config') {
                        break;
                    }
                    const err = errorFromLogRecord(logObj);
                    if (err) {
                        connection.telemetry.logEvent({
                            eventName: 'error',
                            message: `${err.name}: ${err.message}`,
                            category,
                            ...(err.stack && {
                                stack: err.stack,
                            }),
                        });
                    }
                    else {
                        connection.telemetry.logEvent({
                            eventName: 'error',
                            message: messageOnly(logObj),
                            category,
                        });
                    }
                    break;
                }
            }
        }
        catch (e) {
            console.error('Error while logging to LSP connection:', e);
        }
    };
}
