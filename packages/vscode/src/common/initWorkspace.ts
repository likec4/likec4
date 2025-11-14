import { isLikeC4Config, serializableLikeC4ProjectConfig, validateProjectConfig } from '@likec4/config'
import { delay } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import { joinRelativeURL } from 'ufo'
import * as vscode from 'vscode'
import { globPattern, isVirtual, isWebUi } from '../const'
import { loggerOutput } from '../logger'
import type { Rpc } from '../Rpc'
import { useExtensionLogger } from './useExtensionLogger'

// LSP web extensions does not have access to the file system
// so we do this trick (find all files and open them)
export async function initWorkspace(rpc: Rpc) {
  const { logger, loggerOutput } = useExtensionLogger()
  try {
    const docs = await findSources(rpc)
    if (docs.length <= 0) {
      logger.warn('[InitWorkspace] with pattern {globPattern} no docs found', { globPattern })
    } else {
      logger.info(`[InitWorkspace] with pattern {globPattern} found:\n${docs.map(s => '  - ' + s).join('\n')}`, {
        globPattern,
      })
    }
    const isweb = isWebUi() || isVirtual()
    const minWait = isweb ? 2000 : 500
    await delay(minWait, minWait + 500)
    logger.info(`[InitWorkspace] Send request buildDocuments`)
    await rpc.buildDocuments(docs)
  } catch (e) {
    loggerOutput.error(loggable(e))
  }
}

export async function rebuildWorkspace(rpc: Rpc) {
  const { logger, loggerOutput } = useExtensionLogger()
  try {
    logger.info(`Rebuilding...`)
    const docs = await findSources(rpc)
    if (docs.length <= 0) {
      logger.warn('[rebuildWorkspace] with pattern {globPattern} no docs found', { globPattern })
    } else {
      logger.info(`[rebuildWorkspace] with pattern {globPattern} found:\n${docs.map(s => '  - ' + s).join('\n')}`, {
        globPattern,
      })
    }
    await delay(500, 1000)
    logger.info`Send request buildDocuments`
    await rpc.buildDocuments(docs)
  } catch (e) {
    loggerOutput.error(loggable(e))
  }
}

async function findSources(rpc: Rpc) {
  const { logger, loggerOutput } = useExtensionLogger()
  // const isweb = isWebUi() || isVirtual()
  // const uris = await (isweb ? recursiveSearchSources : findFiles)()
  const client = rpc.client
  const c2pConverter = client.code2ProtocolConverter
  const { sources, projects } = await recursiveSearchSources()
  if (projects.length === 0) {
    logger.info('[findSources] no projects found')
  }
  for (const uri of projects) {
    try {
      const cfgUri = c2pConverter.asUri(uri)
      logger.info`read project config ${cfgUri}`
      const bytes = await vscode.workspace.fs.readFile(uri)
      const decoder = new TextDecoder()
      const config = serializableLikeC4ProjectConfig(validateProjectConfig(decoder.decode(bytes)))
      const folderUri = joinRelativeURL(cfgUri, '..')
      await rpc.registerProject({ folderUri, config })
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  }

  const docs = [] as string[]
  for (const uri of sources) {
    try {
      // Langium started with EmptyFileSystem
      // so we need to open all files to make them available
      await vscode.workspace.openTextDocument(uri)
      docs.push(c2pConverter.asUri(uri))
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  }
  return docs
}

// async function findFiles() {
//   logger.info`call vscode.workspace.findFiles with pattern "${globPattern}"`
//   return await vscode.workspace.findFiles(globPattern)
// }

export function isLikeC4Source(path: string) {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}

async function recursiveSearchSources() {
  const { logger, loggerOutput } = useExtensionLogger()
  loggerOutput.info(`recursiveSearchSources`)
  const projects = [] as vscode.Uri[]
  const sources = [] as vscode.Uri[]
  const folders = (vscode.workspace.workspaceFolders ?? []).map(f => f.uri)
  let folder
  while ((folder = folders.pop())) {
    try {
      for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
        const path = vscode.Uri.joinPath(folder, name)
        if (type === vscode.FileType.File) {
          if (isLikeC4Config(name)) {
            projects.push(path)
          } else if (isLikeC4Source(name)) {
            sources.push(path)
          }
        }
        if (type === vscode.FileType.Directory) {
          folders.push(path)
        }
      }
    } catch (e) {
      loggerOutput.error(loggable(e))
    }
  }
  return { projects, sources }
}
