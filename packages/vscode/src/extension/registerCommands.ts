import type { ExtensionContext, PreviewPanel } from '$/di'
import { di } from '$/di'
import type { ViewID } from '@likec4/core/types'
import { commands } from 'vscode'

// This function is called when the extension is activated.
export function registerCommands(
  context: ExtensionContext,
  previewPanel: PreviewPanel
) {
  context.subscriptions.push(
    commands.registerCommand('likec4.open-preview', (viewId?: ViewID) => {
      previewPanel.open(viewId ?? 'index' as ViewID)
    }),
  )
}
registerCommands.inject = [di.context, di.previewPanel] as const
