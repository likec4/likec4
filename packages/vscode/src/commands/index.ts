import { useDiagramPanel } from '../common/useDiagramPanel'
import { useTelemetry } from '../common/useTelemetry'
import { useRpc } from '../Rpc'
import { registerLocateCommand } from './locate'
import { registerMigrateManualLayoutsCommand } from './migrateManualLayouts'
import { registerOpenPreviewCommand } from './openPreview'
import { registerPreviewContextOpenSourceCommand } from './previewContextOpenSource'
import { registerPrintDotOfCurrentViewCommand } from './printDotOfCurrentView'
import { registerReloadProjectsCommand } from './reloadProjects'
import { registerRestartCommand } from './restart'
import { registerValidateLayoutCommand } from './validateLayout'

interface SideEffects {
  restartServer(): Promise<void>
}

export function registerCommands({
  restartServer,
}: SideEffects) {
  const rpc = useRpc()
  const preview = useDiagramPanel()
  const telemetry = useTelemetry()

  function sendTelemetry(command: string) {
    telemetry.sendTelemetryEvent('command', { command })
  }

  const deps = { sendTelemetry, rpc, preview }

  registerRestartCommand({
    sendTelemetry,
    restartServer,
  })

  registerOpenPreviewCommand(deps)
  registerLocateCommand(deps)
  registerPreviewContextOpenSourceCommand(deps)
  registerPrintDotOfCurrentViewCommand(deps)
  registerValidateLayoutCommand(deps)
  registerReloadProjectsCommand(deps)
  registerMigrateManualLayoutsCommand(deps)
}
