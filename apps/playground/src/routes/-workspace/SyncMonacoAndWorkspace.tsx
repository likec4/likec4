import getFileServiceOverride, {
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  registerFileSystemOverlay
} from '@codingame/monaco-vscode-files-service-override'
import { onDidChangeModel } from '@likec4/language-server/protocol'
import { useUnmountEffect } from '@react-hookz/web'
import { DEV } from 'esm-env'
import * as monaco from 'monaco-editor'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { memo, useEffect } from 'react'
import { isString, keys } from 'remeda'
import { Uri } from 'vscode'
import { useStoreApi, useWorkspaceState } from '../../state/use-workspace'

export function SyncMonacoAndWorkspace() {
  const store = useStoreApi()
  const initialized = useWorkspaceState(s => s.initialized)
  // const {
  //   client, initialized
  // } = useWorkspaceState(s => ({
  //   client: s.languageClient,
  //   initialized: s.initialized
  //   // editor: s.editor
  // }))

  // const requestModel = useCallback((languageClient: MonacoLanguageClient) => {
  //   languageClient.sendRequest(fetchModel).then(
  //     ({model}) => {
  //       if
  //       console.info('model', model)
  //     },
  //     error => {
  //       console.error('fetchModel error', error)
  //     }
  //   )
  // }, [store])
  // useEffect(
  //   () => {
  //     if (!languageClient) {
  //       return
  //     }
  //     const subscribe = languageClient.onNotification(onDidChangeModel, () => {
  //       void store.getState().onDidChangeModel()
  //     })
  //     return () => {
  //       subscribe.dispose()
  //     }
  //   },
  //   [languageClient, store]
  // )

  useEffect(
    () => {
      if (!initialized) {
        return
      }
      let subscribe = monaco.editor.registerCommand('likec4.open-preview', (_, viewId) => {
        if (isString(viewId)) {
          store.getState().fetchDiagram(viewId)
        }
      })

      const provider = new RegisteredFileSystemProvider(false)

      const fs = registerFileSystemOverlay(1, provider)

      const { name, files } = store.getState()
      const workspaceUri = Uri.joinPath(Uri.file('/'), name)
      for (let [file, content] of Object.entries(files)) {
        try {
          const uri = Uri.joinPath(workspaceUri, file)
          provider.registerFile(new RegisteredMemoryFile(uri, content))
          // if () {
          //   continue
          // }
          // if (DEV) console.debug('createModel', uri)
          if (!monaco.editor.getModel(uri)) {
            monaco.editor.createModel(content, 'likec4', uri)
          }
          // const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(content, 'likec4', uri)
          // model.setValue(content)
          // ref.object.setLanguageId('likec4')
        } catch (e) {
          console.error(e)
        }
      }

      return () => {
        fs.dispose()
        provider.dispose()
        subscribe.dispose()
      }
    },
    [initialized, store]
  )

  useUnmountEffect(() => {
    if (DEV) {
      console.info('useUnmountEffect - StateSynchronizer')
    }
    const { name, files } = store.getState()
    const workspaceUri = Uri.joinPath(Uri.file('/'), name)
    for (let file of keys(files)) {
      try {
        const uri = Uri.joinPath(workspaceUri, file)
        monaco.editor.getModel(uri)?.dispose()
      } catch (e) {
        console.error(e)
      }
    }
  })

  return null
}
