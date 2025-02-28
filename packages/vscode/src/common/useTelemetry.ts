import TelemetryReporter from '@vscode/extension-telemetry'

// Application insights key (also known as instrumentation key)
const TelemetryConnectionString =
  'InstrumentationKey=36d9aa84-b503-45ea-ae34-b236e4f83bea;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=376f93d7-2977-4989-a2e7-d21b20b4984b' as const

let instance: TelemetryReporter | null = null

export const useTelemetry = () => {
  return instance ??= new TelemetryReporter(TelemetryConnectionString)
}
