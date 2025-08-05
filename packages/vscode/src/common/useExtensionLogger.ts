import { configureLogger, getConsoleSink } from '@likec4/log'
import { createSingletonComposable, useOutputChannel } from 'reactive-vscode'
import { getOutputChannelSink, getTelemetrySink, logger } from '../logger'
import { useTelemetry } from './useTelemetry'

export const useExtensionLogger = createSingletonComposable(() => {
  const loggerOutput = useOutputChannel('LikeC4 Extension', {
    log: true,
  })
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
  }
})
