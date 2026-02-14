import { configureLogger, getConsoleSink, getTextFormatter } from '@likec4/log';
import { startLanguageServer as startLanguim } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser';
import { createLanguageServices } from '../module';
export { createLanguageServices, NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts, NoMCPServer, } from '../common-exports';
export function startLanguageServer(port) {
    const messageReader = new BrowserMessageReader(port);
    const messageWriter = new BrowserMessageWriter(port);
    const connection = createConnection(messageReader, messageWriter);
    configureLogger({
        sinks: {
            console: getConsoleSink({
                formatter: getTextFormatter({
                    format: ({ level, category, message }) => {
                        return `${level} ${category} ${message}`;
                    },
                }),
            }),
        },
        loggers: [
            {
                category: 'likec4',
                sinks: ['console'],
                lowestLevel: 'debug',
            },
        ],
    });
    // Inject the shared services and language-specific services
    const services = createLanguageServices({ connection });
    // Start the language server with the shared services
    startLanguim(services.shared);
    return services;
}
