import { configureLogger, getConsoleSink } from '@likec4/log'
import { createSingletonComposable, useDisposable, useLogger } from 'reactive-vscode'
import vscode from 'vscode'
import { getOutputChannelSink, getTelemetrySink } from '../logger'
import { useTelemetry } from './useTelemetry'

export const useExtensionLogger = createSingletonComposable(() => {
  const outputChannel = vscode.window.createOutputChannel('LikeC4 Extension', {
    log: true,
  })
  useDisposable(outputChannel)
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
