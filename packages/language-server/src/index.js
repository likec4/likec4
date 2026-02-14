import { configureLogger, getConsoleSink, getConsoleStderrSink, getTextFormatter } from '@likec4/log';
import { defu } from 'defu';
import { startLanguageServer as startLanguim } from 'langium/lsp';
import { isDevelopment } from 'std-env';
import { WithFileSystem } from './filesystem/LikeC4FileSystem';
import { WithLikeC4ManualLayouts } from './filesystem/LikeC4ManualLayouts';
import { getTelemetrySink, logger } from './logger';
import { WithMCPServer } from './mcp';
import { createLanguageServices } from './module';
import { ConfigurableLayouter } from './views/ConfigurableLayouter';
export { createLanguageServices, NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts, NoMCPServer, } from './common-exports';
export { WithFileSystem, WithLikeC4ManualLayouts, WithMCPServer, };
export function startLanguageServer(options) {
    const connection = options?.connection;
    const opts = defu(options, {
        enableWatcher: true,
        enableMCP: 'sse',
        enableTelemetry: !!connection,
        enableManualLayouts: true,
    });
    const enableTelemetry = !!connection && opts.enableTelemetry && !isDevelopment;
    configureLogger({
        sinks: {
            // dprint-ignore
            console: opts.enableMCP === 'stdio' || connection
                ? getConsoleStderrSink({ formatter: getTextFormatter() })
                : getConsoleSink({ formatter: getTextFormatter() }),
            ...(enableTelemetry && {
                telemetry: getTelemetrySink(connection),
            }),
        },
        loggers: [
            {
                category: ['likec4'],
                sinks: ['console', ...(enableTelemetry ? ['telemetry'] : [])],
                lowestLevel: isDevelopment ? 'trace' : 'debug',
            },
        ],
    });
    if (connection) {
        logger.info('Starting LikeC4 language server');
    }
    else {
        logger.warn('Starting LikeC4 language server (headless - no LSP connection)');
    }
    // Inject the shared services and language-specific services
    const services = createLanguageServices({
        ...connection && { connection },
        ...WithFileSystem(opts.enableWatcher),
        ...!!opts.enableMCP && WithMCPServer(opts.enableMCP),
        ...opts.enableManualLayouts && WithLikeC4ManualLayouts,
    }, connection
        ? {
            likec4: {
                ...ConfigurableLayouter.likec4,
            },
        }
        : undefined);
    // Start the language server with the shared services
    startLanguim(services.shared);
    return services;
}
