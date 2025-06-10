import { configureLogger, getConsoleSink } from '@likec4/log'
import { createSingletonComposable, useLogger, useOutputChannel } from 'reactive-vscode'
import { getOutputChannelSink, getTelemetrySink } from '../logger'
import { useTelemetry } from './useTelemetry'

export const useExtensionLogger = createSingletonComposable(() => {
  const outputChannel = useOutputChannel('LikeC4 Extension', {
    log: true,
  })
  const telemetry = useTelemetry()
  configureLogger({
    sinks: {
      console: getConsoleSink(),
      vscode: getOutputChannelSink(outputChannel),
      telemetry: getTelemetrySink(telemetry),
    },
    loggers: [
      {
        category: 'likec4',
        sinks: ['console', 'vscode', 'telemetry'],
      },
    ],
  })
  outputChannel.debug('configured logger')

  return useLogger('LikeC4 Extension', {
    outputChannel,
    getPrefix: () => '',
  })
})
