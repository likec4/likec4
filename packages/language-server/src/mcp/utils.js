import { loggable } from '@likec4/log';
import { logger as mainLogger } from '../logger';
export const logger = mainLogger.getChild('mcp');
export function likec4Tool(config, cb) {
    const { name, description, ...rest } = config;
    return (languageServices) => [
        name,
        {
            description: description?.trim() ?? '',
            ...rest,
        },
        mkcallTool(name, languageServices, cb),
    ];
}
function mkcallTool(name, languageServices, cb) {
    const tool = cb.bind(null, languageServices);
    return (async function callTool(args, extra) {
        logger.debug('Calling tool {name}, args: {args}', { name, args });
        try {
            const result = await tool.call(null, args, extra);
            if (typeof result === 'string') {
                return {
                    content: [{
                            type: 'text',
                            text: result,
                        }],
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result),
                    }],
                structuredContent: result,
            };
        }
        catch (err) {
            logger.error(`Tool ${name} failed`, { err });
            return {
                content: [{
                        type: 'text',
                        text: loggable(err),
                    }],
                isError: true,
            };
        }
    });
}
