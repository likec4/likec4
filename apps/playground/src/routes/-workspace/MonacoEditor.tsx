import { createMonacoConfig } from '#monaco/config'
import { onDidChangeModel } from '@likec4/language-server/protocol'
import { useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import { DEV } from 'esm-env'
import { deepEqual } from 'fast-equals'
import * as monaco from 'monaco-editor'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStoreApi, useWorkspaceState } from '../../state'
import * as css from './styles.css'

export function MonacoEditor() {
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
      languageClient: () => ref.current?.getEditorWrapper().getLanguageClient() ?? null
    })
    const unsubscribe = store.subscribe(s => s.requestedLocation, (location) => {
      const editor = ref.current?.getEditorWrapper()?.getEditor()
      if (!location || !editor) {
        return
      }
      const model = monaco.editor.getModel(monaco.Uri.parse(location.uri))
      if (!model) {
        return
      }
      const { start, end } = location.range
      editor.setModel(model)
      const range = new monaco.Range(
        start.line + 1,
        start.character + 1,
        end.line + 1,
        end.character + 1
      )
      editor.setSelection(range)
      editor.revealRangeNearTop(range, monaco.editor.ScrollType.Smooth)
      requestIdleCallback(() => {
        store.setState({
          requestedLocation: null
        })
      })
    }, {
      equalityFn: deepEqual
    })
    return () => {
      unsubscribe()
      store.setState({
        initialized: ref.current?.getEditorWrapper().isStarted() ?? false,
        languageClient: () => null
      })
    }
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
    const uri = monaco.Uri.joinPath(
      monaco.Uri.file('/'),
      name,
      filename
    )
    const wrapper = ref.current?.getEditorWrapper()
    const editor = wrapper?.getEditor()
    if (!editor || !wrapper || !wrapper.isStarted()) {
      throw new Error('MonacoEditor: editor is not ready')
    }
    if (editor.getModel()?.uri.toString() === uri.toString()) {
      // already opened
      return
    }
    const code = store.getState().currentFileContent()
    editor.setModel(monaco.editor.getModel(uri) ?? monaco.editor.createModel(code, 'likec4', uri))
  }, [filename])

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
      onTextChanged={({ main }) => updateCurrentContent(main)}
      onError={(e) => {
        console.error('MonacoEditor.onError', e)
      }}
    />
  )
}
