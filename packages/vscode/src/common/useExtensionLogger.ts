import { configureLogger, getConsoleSink } from '@likec4/log'
import { createSingletonComposable } from 'reactive-vscode'
import { extensionLogger, getOutputChannelSink, getTelemetrySink, logger, loggerOutput } from '../logger'
import { useTelemetry } from './useTelemetry'

export const useExtensionLogger = createSingletonComposable(() => {
  const telemetry = useTelemetry()
  configureLogger({
    sinks: {
      console: getConsoleSink(),
      vscode: getOutputChannelSink(loggerOutput),
      telemetry: getTelemetrySink(telemetry),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console', 'vscode', 'telemetry'],
      },
    ],
  })
  loggerOutput.debug('configured logger')

  return {
    logger,
    loggerOutput,
    extensionLogger,
  }
})
