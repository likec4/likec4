import { delay } from 'rambdax'
import { type LanguageClient, type Logger } from 'src/di'
import { fileExtensions } from 'src/meta'
import * as vscode from 'vscode'
import { Rpc } from '../protocol'

// LSP web extensions does not have access to the file system (even virtual)
  // so we do this trick (find all files and open them)
export async function initWorkspace(client: LanguageClient, logger: Logger) {
  // TODO: find a better way to wait for the workspace to be ready
  await delay(1000)
  const c2pConverter = client.code2ProtocolConverter;
  const extensions = fileExtensions.map(s => s.substring(1)).join(',')
  const globPattern = `**/*.{${extensions}}`
  const uris = await vscode.workspace.findFiles(globPattern)
  const docs = uris.map(d => c2pConverter.asUri(d))
  logger.logInfo(`initWorkspace with pattern "${globPattern}"\n  found: [\n  ${docs.join(',\n  ')}\n]`)
  for (const uri of uris) {
    try {
      logger.logDebug(`openTextDocument: ${uri}`)
      // Langium started with EmptyFileSystem
      // so we need to open all files to make them available
      await vscode.workspace.openTextDocument(uri)
    } catch (e) {
      logger.logError(`${e}`, e)
    }
  }
  logger.logDebug(`Waiting...`)
  await delay(5000)

  logger.logDebug(`Send request buildDocuments`)
  await client.sendRequest(Rpc.buildDocuments, { docs })
  return
}
