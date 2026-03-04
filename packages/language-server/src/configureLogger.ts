import {
  configureLogger,
  getAnsiColorFormatter,
  getConsoleSink,
  getConsoleStderrSink,
  getTextFormatter,
} from '@likec4/log'
import { isDevelopment } from 'std-env'
import type { Connection } from 'vscode-languageserver'
import { getTelemetrySink, serverLogger } from './logger'

export type ConfigureLanguageServerLoggerOptions = {
  /**
   * The LSP connection if available
   * (used by Telemetry)
   */
  lspConnection?: Connection | undefined

  /**
   * Whether to use stderr for logging instead of stdout.
   * @default false
   */
  useStdErr?: boolean
  /**
   * The log level to use.
   * @default 'warning'
   */
  logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error' | undefined
  /**
   * @default true
   */
  enableTelemetry?: boolean

  /**
   * Enable non-blocking logging (async).
   * @default false
   */
  nonBlocking?: boolean

  /**
   * Whether to use colors in logging.
   * @default false
   */
  colors?: boolean
}

export function configureLanguageServerLogger({
  lspConnection: connection,
  enableTelemetry = !!connection,
  useStdErr = false,
  logLevel: lowestLevel = isDevelopment ? 'debug' : 'warning' as const,
  nonBlocking = false,
  colors = false,
}: ConfigureLanguageServerLoggerOptions = {}): void {
  const telemetry = !!connection && enableTelemetry && !isDevelopment

  configureLogger({
    reset: true,
    sinks: {
      // dprint-ignore
      console: useStdErr
        ? getConsoleStderrSink({
            formatter: getTextFormatter()
        })
        : getConsoleSink({ 
            formatter: colors ? getAnsiColorFormatter() : getTextFormatter(),
            nonBlocking
          }),
      ...(telemetry && {
        telemetry: getTelemetrySink(connection),
      }),
    },
    loggers: [
      {
        category: ['likec4'],
        sinks: ['console', ...(telemetry ? ['telemetry'] : [])],
        lowestLevel,
      },
    ],
  })

  serverLogger.trace('logger configured')
}
