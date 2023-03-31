import { di } from '$/di'
import type { ExtensionContext } from '$/di'
import { PreviewPanel } from '../panels/PreviewPanel'
import * as vscode from 'vscode'

export function registerPreviewPanelSerializer(
  context: ExtensionContext,
  previewPanel: PreviewPanel
) {
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(PreviewPanel.ViewType, previewPanel)
  )
}
registerPreviewPanelSerializer.inject = [di.context, di.previewPanel] as const
