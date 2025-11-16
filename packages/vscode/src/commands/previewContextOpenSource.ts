import { executeCommand, useCommand } from 'reactive-vscode'
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
    if (deployment) {
      await executeCommand(commands.locate, { deployment })
    } else if (element) {
      await executeCommand(commands.locate, { element })
    }
  })
}
