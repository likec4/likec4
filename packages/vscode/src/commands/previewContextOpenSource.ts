import { toValue, useCommand } from 'reactive-vscode'
import { commands as cmd } from 'vscode'
import { commands } from '../meta'
import type { PreviewPanel } from './types'

export interface PreviewContextOpenSourceDeps {
  sendTelemetry(commandId: string): void
  preview: PreviewPanel
}

export function registerPreviewContextOpenSourceCommand({ sendTelemetry, preview }: PreviewContextOpenSourceDeps) {
  useCommand(commands.previewContextOpenSource, async () => {
    sendTelemetry(commands.previewContextOpenSource)
    const { element, deployment } = await preview.getLastClickedElement()
    const projectId = toValue(preview.projectId)
    if (deployment) {
      await cmd.executeCommand(commands.locate, { deployment, projectId })
    } else if (element) {
      await cmd.executeCommand(commands.locate, { element, projectId })
    }
  })
}
