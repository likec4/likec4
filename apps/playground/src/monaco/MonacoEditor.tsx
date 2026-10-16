import { usePlayground } from '$/hooks/usePlayground'
import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider'
import * as monaco from '@codingame/monaco-vscode-editor-api'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import type { EditorApp } from 'monaco-languageclient/editorApp'
import type { LanguageClientManager } from 'monaco-languageclient/lcwrapper'
import { memo, useEffect, useMemo, useState } from 'react'
import { createWrapperConfig, LIKEC4_LANGUAGE_ID } from './config'
import { type MonacoHandle, createMonacoHandle } from './handle'
import { LanguageClientSync } from './LanguageClientSync'

const logger = rootLogger.getChild('monaco-editor')

export type MonacoEditorProps = {
  setLayoutedModelApi?: (api: LayoutedModelApi | null) => void
}

/**
 * Lazy-loaded Monaco editor component. Memoized; accepts setLayoutedModelApi for Draw.io export.
 * @param props - MonacoEditorProps (setLayoutedModelApi, etc.).
 * @returns Rendered Monaco editor React element.
 */
const LazyMonacoEditor = memo((props: MonacoEditorProps) => {
  const { setLayoutedModelApi } = props
  const playground = usePlayground()

  // Ensure that late-loading fonts are remeasured to prevent layout issues (cursor drift)
  useEffect(() => {
    const remeasureFonts = () => monaco.editor.remeasureFonts()
    let mounted = true

    document.fonts.addEventListener('loadingdone', remeasureFonts)
    void document.fonts.ready.then(() => {
      if (mounted) {
        remeasureFonts()
      }
    })

    return () => {
      mounted = false
      document.fonts.removeEventListener('loadingdone', remeasureFonts)
    }
  }, [])

  const onActiveEditorChanged = useCallbackRef((filename: string) => {
    playground.changeActiveFile(filename)
  })

  const [editorApp, setEditorApp] = useState<EditorApp | null>(null)
  const [languageClients, setLanguageClients] = useState<LanguageClientManager | null>(null)
  const editorAppRef = useSyncedRef(editorApp)

  const wrapperConfig = useMemo(() =>
    createWrapperConfig({
      getActiveEditor: () => editorAppRef.current?.getEditor() ?? null,
      onActiveEditorChanged,
    }), [])

  useUpdateEffect(() => {
    setEditorApp(null)
    setLanguageClients(null)
  }, [wrapperConfig])

  const onEditorStartDone = useCallbackRef((app?: EditorApp) => {
    if (app) {
      setEditorApp(app)
    }
  })

  const onLanguageClientsStartDone = useCallbackRef((manager: LanguageClientManager) => {
    if (!manager.getLanguageClientWrapper(LIKEC4_LANGUAGE_ID)) {
      console.warn('LikeC4 LanguageClientWrapper not found, waiting for it to be created')
      return
    }
    setLanguageClients(manager)
  })

  const wrapper: MonacoHandle | null = useMemo(
    () => editorApp && languageClients ? createMonacoHandle(editorApp, languageClients) : null,
    [editorApp, languageClients],
  )

  return (
    <>
      <MonacoEditorReactComp
        style={{ width: '100%', height: '100%' }}
        vscodeApiConfig={wrapperConfig.vscodeApiConfig}
        editorAppConfig={wrapperConfig.editorAppConfig}
        languageClientConfig={wrapperConfig.languageClientConfig}
        onEditorStartDone={onEditorStartDone}
        onLanguageClientsStartDone={onLanguageClientsStartDone}
        onError={useCallbackRef(err => {
          const message = err instanceof Error ? err.message : String(err)
          const isConnectionError = message.includes('connection to server is erroring') ||
            message.includes('Reader received error') ||
            message.includes('Writer received error')
          logger.error(loggable(err))
          if (import.meta.env.DEV && isConnectionError) {
            console.warn(
              '[LikeC4] Language server connection failed. Check the console for "[LikeC4 LSP worker]" for the cause. Try: refresh the page; run `pnpm build` in the repo root and restart the dev server.',
            )
          }
        })}
      />
      {wrapper && (
        <LanguageClientSync
          config={wrapperConfig}
          wrapper={wrapper}
          {...(setLayoutedModelApi != null && { setLayoutedModelApi })}
        />
      )}
    </>
  )
})
LazyMonacoEditor.displayName = 'LazyMonacoEditor'

export default LazyMonacoEditor
