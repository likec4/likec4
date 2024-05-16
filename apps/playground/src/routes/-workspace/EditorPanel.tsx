import { onDidChangeModel } from '@likec4/language-server/protocol'
import { useUnmountEffect, useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import { DEV } from 'esm-env'
import * as monaco from 'monaco-editor'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Uri } from 'vscode'
import { createMonacoConfig } from '../../monaco/wrapperConfig'
import { useStoreApi, useWorkspaceState } from '../../state'
import * as css from './styles.css.ts'

export function EditorPanel() {
  const store = useStoreApi()
  const [languageClient, setLanguageClient] = useState<null | MonacoLanguageClient>(null)

  const {
    name,
    filename,
    updateCurrentContent
  } = useWorkspaceState(s => ({
    name: s.name,
    filename: s.currentFilename,
    updateCurrentContent: s.updateCurrentFile
  }))

  const monacoConfig = useMemo(() => {
    return createMonacoConfig(store)
  }, [store])

  const ref = useRef<MonacoEditorReactComp>(null)

  useEffect(() => {
    store.setState({
      languageClient: () => ref.current?.getEditorWrapper()?.getLanguageClient() ?? null
    })
  }, [ref, store])

  useEffect(
    () => {
      if (!languageClient) {
        return
      }
      const subscribe = languageClient.onNotification(onDidChangeModel, () => {
        void store.getState().onDidChangeModel()
      })
      return () => {
        subscribe.dispose()
      }
    },
    [languageClient, store]
  )

  useUpdateEffect(() => {
    const uri = Uri.joinPath(
      Uri.file('/'),
      name,
      filename
    )
    const editor = ref.current?.getEditorWrapper()?.getEditor()
    if (!editor || editor.getModel()?.uri.toString() === uri.toString()) {
      return
    }
    const code = store.getState().currentFileContent()
    editor.setModel(monaco.editor.getModel(uri) ?? monaco.editor.createModel(code, 'likec4', uri))
  }, [filename])

  useUnmountEffect(() => {
    if (DEV) {
      console.info('useUnmountEffect - EditorPanel')
    }
    store.setState({
      initialized: false,
      languageClient: () => null
    })
  })

  return (
    <MonacoEditorReactComp
      ref={ref}
      className={css.monacoEditor}
      userConfig={monacoConfig}
      onLoad={(wrapper) => {
        if (DEV) {
          console.info('onLoad', wrapper)
        }
        setLanguageClient(wrapper.getLanguageClient() ?? null)
        store.setState(
          {
            initialized: wrapper.isStarted(),
            languageClient: () => wrapper.getLanguageClient() ?? null
          },
          false,
          'onLoad'
        )
      }}
      onTextChanged={updateCurrentContent}
    />
  )
}
