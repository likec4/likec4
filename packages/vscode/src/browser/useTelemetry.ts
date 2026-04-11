import {
  createSingletonComposable,
} from 'reactive-vscode'

const useTelemetry = createSingletonComposable(() => {
  return {
    get reporter() {
      throw new Error('Telemetry reporter is not available in this environment')
    },
    logError: () => {
      // no-op
    },
    logUsage: () => {
      // no-op
    },
    sendTelemetry: () => {
      // no-op
    },
    sendTelemetryError: () => {
      // no-op
    },
  }
})

export default useTelemetry
