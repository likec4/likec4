import TelemetryReporter from '@vscode/extension-telemetry'
import type { ExtensionContext } from './di'

export function mkReporter(context: ExtensionContext) {
  // Application insights key (also known as instrumentation key)
  const reporter = new TelemetryReporter('36d9aa84-b503-45ea-ae34-b236e4f83bea')
  context.subscriptions.push(reporter)
  return reporter
}
