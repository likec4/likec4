import useTelemetry from '#useTelemetry'
import { useDiagramPanel } from '../panel'
import { useLanguageClient } from '../useLanguageClient'
import { useRpc } from '../useRpc'
import { registerLocateCommand } from './locate'
import { registerMigrateManualLayoutsCommand } from './migrateManualLayouts'
import { registerOpenPreviewCommand } from './openPreview'
import { registerOpenProjectsOverviewCommand } from './openProjectsOverview'
import { registerPreviewContextOpenSourceCommand } from './previewContextOpenSource'
import { registerPrintDotOfCurrentViewCommand } from './printDotOfCurrentView'
import { registerReloadProjectsCommand } from './reloadProjects'
import { registerRestartCommand } from './restart'
import { registerValidateLayoutCommand } from './validateLayout'

export function registerCommands() {
  const {
    restartLanguageServer: restartServer,
  } = useLanguageClient()
  const rpc = useRpc()
  const preview = useDiagramPanel()
  const telemetry = useTelemetry()

  function sendTelemetry(command: string) {
    telemetry.sendTelemetry('command', { command })
  }

  const deps = { sendTelemetry, rpc, preview }

  registerRestartCommand({
    sendTelemetry,
    restartServer,
  })

  registerOpenPreviewCommand(deps)
  registerOpenProjectsOverviewCommand(deps)
  registerLocateCommand(deps)
  registerPreviewContextOpenSourceCommand(deps)
  registerPrintDotOfCurrentViewCommand(deps)
  registerValidateLayoutCommand(deps)
  registerReloadProjectsCommand(deps)
  registerMigrateManualLayoutsCommand(deps)
}
