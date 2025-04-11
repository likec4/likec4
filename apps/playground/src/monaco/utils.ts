import * as monaco from '@codingame/monaco-vscode-editor-api'
import { type IDisposable } from '@codingame/monaco-vscode-editor-api'
import {
  type RegisteredFileSystemProvider,
  RegisteredMemoryFile,
} from '@codingame/monaco-vscode-files-service-override'
import { loggable, logger } from '@likec4/log'
import { first, forEach } from 'remeda'

export const setActiveEditor = (filename: monaco.Uri) => {
  const activeTextEditor = first(monaco.editor.getEditors())
  if (!activeTextEditor) {
    console.error('MonacoEditor: no active editor')
    return
  }
  if (activeTextEditor.getModel()?.uri.toString() === filename.toString()) {
    // already opened
    return
  }
  const model = monaco.editor.getModel(filename)
  if (!model) {
    console.error(`MonacoEditor: model ${filename} not found`)
    return
  }
  activeTextEditor.setModel(model)
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

export function createMemoryFileSystem(
  fsProvider: RegisteredFileSystemProvider,
  files: Record<string, string>,
  activeFilename: string,
) {
  const log = logger.getChild('createMemoryFileSystem')
  const docs = [] as string[]
  const currentModels = new Map(monaco.editor.getModels().map((model) => [model.uri.toString(), model]))
  let activeModel
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
      if (file === activeFilename) {
        activeModel = model
      }
      docs.push(uriAsString)
    } catch (e) {
      log.error(loggable(e))
    }
  }

  // Clean up models that are not in the files
  if (currentModels.size > 0) {
    forEach([...currentModels.values()], (model) => {
      try {
        model.dispose()
        log.debug`disposed monaco model: ${model.uri.toString()}`
      }
      catch (e) {
        console.warn(`Failed to dispose monaco model ${model.uri.toString()}`, e)
      }
    })
  }

  return {
    docs,
    activeModel,
  }
}
