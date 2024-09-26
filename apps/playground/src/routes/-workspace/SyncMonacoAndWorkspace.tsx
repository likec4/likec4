import {
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  registerFileSystemOverlay
} from '@codingame/monaco-vscode-files-service-override'
import { useUnmountEffect } from '@react-hookz/web'
import { useRouter } from '@tanstack/react-router'
import { DEV } from 'esm-env'
import * as monaco from 'monaco-editor'
import { useEffect } from 'react'
import { isString, keys } from 'remeda'
import { useStoreApi, useWorkspaceState } from '../../state/use-workspace'
import { Route } from '../w.$id'

export function SyncMonacoAndWorkspace() {
  const router = useRouter()
  const store = useStoreApi()
  const initialized = useWorkspaceState(s => s.initialized)
  const { id } = Route.useParams()

  useEffect(
    () => {
      if (!initialized) {
        return
      }
      let subscribe = monaco.editor.registerCommand('likec4.open-preview', (_, viewId) => {
        if (isString(viewId)) {
          router.navigate({
            to: '/w/$id/$/',
            params: {
              id,
              _splat: viewId
            }
          })
        }
      })

      const provider = new RegisteredFileSystemProvider(false)

      const fs = registerFileSystemOverlay(1, provider)

      const { name, files } = store.getState()
      const workspaceUri = monaco.Uri.joinPath(monaco.Uri.file('/'), name)
      for (let [file, content] of Object.entries(files)) {
        try {
          const uri = monaco.Uri.joinPath(workspaceUri, file)
          provider.registerFile(new RegisteredMemoryFile(uri, content))
          if (!monaco.editor.getModel(uri)) {
            monaco.editor.createModel(content, 'likec4', uri)
          }
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
    const workspaceUri = monaco.Uri.joinPath(monaco.Uri.file('/'), name)
    for (let file of keys(files)) {
      try {
        const uri = monaco.Uri.joinPath(workspaceUri, file)
        monaco.editor.getModel(uri)?.dispose()
      } catch (e) {
        console.error(e)
      }
    }
  })

  return null
}
