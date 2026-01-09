import { useCommand } from 'reactive-vscode'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import type { PreviewPanel } from './types'

export interface OpenProjectsOverviewCommandDeps {
  sendTelemetry(commandId: string): void
  preview: PreviewPanel
}

export function registerOpenProjectsOverviewCommand({ sendTelemetry, preview }: OpenProjectsOverviewCommandDeps) {
  const { logger } = useExtensionLogger()
  useCommand(commands.openProjectsOverview, async () => {
    logger.debug`command ${commands.openProjectsOverview} invoked`
    sendTelemetry(commands.openProjectsOverview)
    preview.open('projects')
  })
}
