import type { ViewID } from '@likec4/core/types'
import type { ExtensionContext, LanguageClient, Logger, PreviewPanel } from 'src/di'
import { di } from 'src/di'
import { Rpc } from 'src/protocol'
import { commands } from 'vscode'

// This function is called when the extension is activated.
export function registerCommands(
  context: ExtensionContext,
  previewPanel: PreviewPanel,
  logger: Logger,
  client: LanguageClient
) {
  context.subscriptions.push(
    commands.registerCommand('likec4.open-preview', (viewId?: ViewID) => {
      previewPanel.open(viewId ?? ('index' as ViewID))
    }),
    commands.registerCommand('likec4.rebuild', async () => {
      const { docs } = await client.sendRequest(Rpc.rebuild)
      logger.logDebug(`rebuild response: ${docs}`)
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
registerCommands.inject = [di.context, di.previewPanel, di.logger, di.client] as const
