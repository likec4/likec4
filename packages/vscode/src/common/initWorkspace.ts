import * as vscode from 'vscode'
import { globPattern } from '../const'
import type { Rpc } from './Rpc'
import { Logger, logError } from '../logger'
import { delay } from 'rambdax'

// LSP web extensions does not have access to the file system (even virtual)
// so we do this trick (find all files and open them)
export async function initWorkspace(rpc: Rpc) {
  try {
    const c2pConverter = rpc.client.code2ProtocolConverter
    const uris = await vscode.workspace.findFiles(globPattern)
    const docs = uris.map(d => c2pConverter.asUri(d))
    if (docs.length <= 0) {
      Logger.info(`[InitWorkspace] with pattern "${globPattern}" no docs found`)
      return
    }
    Logger.info(`[InitWorkspace] with pattern "${globPattern}" found:\n` + docs.map(s => '  - ' + s).join('\n'))
    for (const uri of uris) {
      try {
        // Langium started with EmptyFileSystem
        // so we need to open all files to make them available
        await vscode.workspace.openTextDocument(uri)
      } catch (e) {
        logError(e)
      }
    }
    Logger.info(`[InitWorkspace] waiting 1s...`)
    await delay(1000)

    Logger.info(`[InitWorkspace] Send request buildDocuments`)
    await rpc.buildDocuments(docs)
  } catch (e) {
    logError(e)
  }
}
