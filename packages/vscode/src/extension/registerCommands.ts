import type { ExtensionContext, PreviewPanel } from 'src/di'
import { di } from 'src/di'
import type { ViewID } from '@likec4/core/types'
import { URI } from 'vscode-uri'
import { commands, extensions, workspace } from 'vscode'

// This function is called when the extension is activated.
export function registerCommands(context: ExtensionContext, previewPanel: PreviewPanel) {
  context.subscriptions.push(
    commands.registerCommand('likec4.open-preview', (viewId?: ViewID) => {
      previewPanel.open(viewId ?? ('index' as ViewID))
    }),
    // commands.registerCommand('likec4.open-d2',  async (viewId?: ViewID) => {
    //   try {
    //   // const d2 = extensions.getExtension('terrastruct.d2')

    //   // console.log({d2}
    //   const uri = URI.file('likec4.d2').with({
    //     scheme: 'untitled',
    //   })
    //   const doc = await workspace.openTextDocument(uri)
    //   doc.getText()
    //   workspace.applyEdit(edit)

    //   const content = new Uint8Array(Buffer.from(`
    //   // This is a comment
    //   `))
    //   await workspace.fs.writeFile(uri, content)
    //   await commands.executeCommand('vscode.open', uri)
    //   // previewPanel.open(viewId ?? ('index' as ViewID))
    //   } catch (e) {
    //     console.error(e)
    //   }
    // })
  )
}
registerCommands.inject = [di.context, di.previewPanel] as const
