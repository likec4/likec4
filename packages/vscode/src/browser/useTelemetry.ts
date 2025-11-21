import {
  createSingletonComposable,
} from 'reactive-vscode'

const useTelemetry = createSingletonComposable(() => {
  return {
    get reporter() {
      throw new Error('Telemetry reporter is not available in this environment')
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
