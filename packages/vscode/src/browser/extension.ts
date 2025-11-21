import { isLikeC4Config } from '@likec4/config'
import { delay, promiseNextTick } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import PQueue from 'p-queue'
import {
  defineExtension,
} from 'reactive-vscode'
import vscode from 'vscode'
import { activateExtension } from '../activate'
import { globPattern } from '../const'
import { useConfigureLogger } from '../useExtensionLogger'
import { isLikeC4Source } from '../utils'

export const { activate, deactivate } = defineExtension(async () => {
  const { output } = useConfigureLogger()
  try {
    // Language-server worker does not have access to the file system
    // so we do this trick - find all files and open editors
    // so that language server can load them via textDocument requests
    const docs = await recursiveSearchSources(output)

    if (docs.length <= 0) {
      output.warn(`[activate] with pattern {globPattern} no docs found`, { globPattern })
    } else {
      output.info(`[activate] with pattern {globPattern} found:\n${docs.map(s => '  - ' + s).join('\n')}`, {
        globPattern,
      })
    }

    const { rpc } = activateExtension('web')

    if (docs.length > 0) {
      const minWait = 3000
      await delay(minWait, minWait + 1000)

      output.info(`send buildDocuments`)
      await rpc.buildDocuments(docs)
    }
  } catch (e) {
    output.error(loggable(e))
  }
})

async function recursiveSearchSources(output: vscode.LogOutputChannel) {
  output.info(`recursiveSearchSources`)
  const sources = [] as vscode.Uri[]
  const folders = (vscode.workspace.workspaceFolders ?? []).map(f => f.uri)
  if (folders.length === 0) {
    output.warn(`no workspace folders found`)
    return []
  }
  // use a queue to limit concurrency of opening editors
  const queue = new PQueue({ concurrency: 1 })

  let folder
  while ((folder = folders.pop())) {
    try {
      output.info(`searching in folder ${folder.toString()}`)
      for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
        const uri = vscode.Uri.joinPath(folder, name)
        if (type === vscode.FileType.Directory) {
          folders.push(uri)
          continue
        }
        const uristr = uri.toString()
        if (type !== vscode.FileType.File) {
          output.info(`skipping non-file non-directory item: ${uristr}`)
          continue
        }
        if (isLikeC4Config(name)) {
          output.warn(`found project config: ${uristr}, not supported in web extension yet`)
          continue
        }
        if (isLikeC4Source(name)) {
          output.info(`found source file: ${uristr}`)
          sources.push(uri)
          void queue.add(async () => {
            await promiseNextTick()
            try {
              output.info(`openTextDocument: ${uristr}`)
              await vscode.workspace.openTextDocument(uri)
            } catch (e) {
              output.error(`error opening source file ${uristr}: ` + loggable(e))
            }
          })
        }
      }
    } catch (e) {
      output.error(loggable(e))
    }
  }

  await queue.onIdle()

  return sources.map(u => u.toString())
}
