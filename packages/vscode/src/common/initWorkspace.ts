import { delay } from '@likec4/core'
import * as vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import { globPattern, isVirtual, isWebUi } from '../const'
import { logger, logWarn } from '../logger'
import type { Rpc } from '../Rpc'

// LSP web extensions does not have access to the file system
// so we do this trick (find all files and open them)
export async function initWorkspace(rpc: Rpc) {
  try {
    const docs = await findSources(rpc.client)
    if (docs.length <= 0) {
      logger.warn('[InitWorkspace] with pattern "{globPattern}" no docs found', { globPattern })
    } else {
      logger.info(`[InitWorkspace] with pattern "{globPattern}" found:\n {docs} `, {
        globPattern,
        docs: docs.map(s => '  - ' + s),
      })
    }
    const isweb = isWebUi() || isVirtual()
    const minWait = isweb ? 2000 : 500
    await delay(minWait, minWait + 500)
    logger.info(`[InitWorkspace] Send request buildDocuments`)
    await rpc.buildDocuments(docs)
  } catch (e) {
    logWarn(e)
  }
}

export async function rebuildWorkspace(rpc: Rpc) {
  try {
    logger.info(`Rebuilding...`)
    const docs = await findSources(rpc.client)
    if (docs.length <= 0) {
      logger.warn('[RebuildWorkspace] with pattern "{globPattern}" no docs found', { globPattern })
    } else {
      logger.info(`[RebuildWorkspace] with pattern "{globPattern}" found:\n {docs} `, {
        globPattern,
        docs: docs.map(s => '  - ' + s),
      })
    }
    await delay(500, 1000)
    logger.info`Send request buildDocuments`
    await rpc.buildDocuments(docs)
  } catch (e) {
    logWarn(e)
  }
}

async function findSources(client: LanguageClient) {
  const isweb = isWebUi() || isVirtual()
  const c2pConverter = client.code2ProtocolConverter
  const uris = await (isweb ? recursiveSearchSources : findFiles)()
  const docs = [] as string[]
  for (const uri of uris) {
    try {
      // Langium started with EmptyFileSystem
      // so we need to open all files to make them available
      if (isweb || uri.scheme !== 'file') {
        await vscode.workspace.openTextDocument(uri)
      }
      docs.push(c2pConverter.asUri(uri))
    } catch (e) {
      logWarn(e)
    }
  }
  return docs
}

async function findFiles() {
  logger.info`call vscode.workspace.findFiles with pattern "${globPattern}"`
  return await vscode.workspace.findFiles(globPattern)
}

export const isLikeC4Source = (path: string) => {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

async function recursiveSearchSources() {
  logger.info(`recursiveSearchSources`)
  const uris = [] as vscode.Uri[]
  const folders = (vscode.workspace.workspaceFolders ?? []).map(f => f.uri)
  let folder
  while (folder = folders.pop()) {
    try {
      for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
        const path = vscode.Uri.joinPath(folder, name)
        if (type === vscode.FileType.File && isLikeC4Source(name)) {
          uris.push(path)
        }
        if (type === vscode.FileType.Directory) {
          folders.push(path)
        }
      }
    } catch (e) {
      logWarn(e)
    }
  }
  return uris
}
