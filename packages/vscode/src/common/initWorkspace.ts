import { delay } from 'rambdax'
import * as vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import { globPattern } from '../const'
import { Logger, logError } from '../logger'
import type { Rpc } from './Rpc'

// LSP web extensions does not have access to the file system (even virtual)
// so we do this trick (find all files and open them)
export async function initWorkspace(rpc: Rpc) {
  try {
    const docs = await findSources(rpc.client)
    if (docs.length <= 0) {
      Logger.info(`[InitWorkspace] with pattern "${globPattern}" no docs found`)
      return
    }
    Logger.info(
      `[InitWorkspace] with pattern "${globPattern}" found:\n` +
        docs.map(s => '  - ' + s).join('\n')
    )
    await delay(500)
    Logger.info(`[InitWorkspace] Send request buildDocuments`)
    await rpc.buildDocuments(docs)
  } catch (e) {
    logError(e)
  }
}

export async function rebuildWorkspace(rpc: Rpc) {
  try {
    const docs = await findSources(rpc.client)
    Logger.info(
      `rebuild workspace, found ${docs.length} docs:\n` + docs.map(s => '  - ' + s).join('\n')
    )
    await delay(500)
    await rpc.buildDocuments(docs)
  } catch (e) {
    logError(e)
  }
}

async function findSources(client: LanguageClient) {
  const c2pConverter = client.code2ProtocolConverter
  const uris = await (vscode.env.uiKind === vscode.UIKind.Web
    ? findSourcesWeb()
    : findSourcesNode())
  const docs = [] as string[]
  for (const uri of uris) {
    try {
      // Langium started with EmptyFileSystem
      // so we need to open all files to make them available
      await vscode.workspace.openTextDocument(uri)
      docs.push(c2pConverter.asUri(uri))
    } catch (e) {
      logError(e)
    }
  }
  return docs
}

async function findSourcesNode() {
  Logger.info(`findSourcesNode`)
  return await vscode.workspace.findFiles(globPattern)
}

const isSource = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

async function findSourcesWeb() {
  Logger.info(`findSourcesWeb`)
  const uris = [] as vscode.Uri[]
  const folders = (vscode.workspace.workspaceFolders ?? []).map(f => f.uri)
  while (folders.length > 0) {
    const folder = folders.pop()!
    try {
      for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
        const path = vscode.Uri.joinPath(folder, name)
        if (type === vscode.FileType.Directory) {
          folders.push(path)
          continue
        }
        if (type === vscode.FileType.File && isSource(name)) {
          uris.push(path)
        }
      }
    } catch (e) {
      logError(e)
    }
  }
  return uris
}
