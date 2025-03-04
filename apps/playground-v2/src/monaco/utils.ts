import * as monaco from '@codingame/monaco-vscode-editor-api'
import { type IDisposable } from '@codingame/monaco-vscode-editor-api'
import {
  type RegisteredFileSystemProvider,
  RegisteredMemoryFile,
} from '@codingame/monaco-vscode-files-service-override'
import { nonNullable } from '@likec4/core'
import { loggable, logger } from '@likec4/log'
import { first } from 'remeda'

export const setActiveEditor = (filename: monaco.Uri) => {
  const activeTextEditor = first(monaco.editor.getEditors())
  if (!activeTextEditor) {
    throw new Error('MonacoEditor: editor is not ready')
  }
  if (activeTextEditor.getModel()?.uri.toString() === filename.toString()) {
    // already opened
    return
  }
  // vscode.window.showTextDocument(filename)
  activeTextEditor.setModel(
    nonNullable(
      monaco.editor.getModel(filename),
      `MonacoEditor: model ${filename} not found`,
    ),
  )
}

export function cleanDisposables(disposables: IDisposable[]) {
  // Iterate in reverse order and dispose
  for (let i = disposables.length - 1; i >= 0; i--) {
    try {
      disposables[i]?.dispose()
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error(e)
      }
    }
  }
  disposables.length = 0
}

export function createMemoryFileSystem(fsProvider: RegisteredFileSystemProvider, files: Record<string, string>) {
  const log = logger.getChild('createMemoryFileSystem')
  const uris = [] as string[]
  const currentModels = new Map(monaco.editor.getModels().map((model) => [model.uri.toString(), model]))
  for (let [file, content] of Object.entries(files)) {
    try {
      const uri = monaco.Uri.file(file)
      const uriAsString = uri.toString()
      let model = currentModels.get(uriAsString)
      if (model) {
        log.debug`update existing ${file}`
        model.setValue(content)
        currentModels.delete(uriAsString)
      } else {
        log.debug`create new ${file}`
        try {
          fsProvider.registerFile(new RegisteredMemoryFile(uri, content))
        } catch (e) {
          // Most likely the file is already registered
        }
        model = monaco.editor.createModel(content, 'likec4', uri)
      }
      uris.push(uriAsString)
    } catch (e) {
      log.error(loggable(e))
    }
  }

  // Clean up models that are not in the files
  if (currentModels.size > 0) {
    log.debug(`dispose monaco models: ${[...currentModels.keys()]}`)
    currentModels.values().forEach((model) => {
      try {
        model.dispose()
      }
      catch (e) {
        // Ignore errors
      }
    })
  }

  return uris
}
