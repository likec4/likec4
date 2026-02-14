import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider'
import { usePlayground } from '$/hooks/usePlayground'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { memo, useMemo, useState } from 'react'
import { createWrapperConfig } from './config'
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

  const onActiveEditorChanged = useCallbackRef((filename: string) => {
    playground.changeActiveFile(filename)
  })

  const [wrapper, setWrapper] = useState<MonacoEditorLanguageClientWrapper | null>(null)
  const wrapperRef = useSyncedRef(wrapper)

  const wrapperConfig = useMemo(() =>
    createWrapperConfig({
      getActiveEditor: () => wrapperRef.current?.getEditor() ?? null,
      onActiveEditorChanged,
    }), [])

  useUpdateEffect(() => {
    setWrapper(null)
  }, [wrapperConfig])

  const onLoad = useCallbackRef((wrapper: MonacoEditorLanguageClientWrapper) => {
    if (import.meta.env.DEV) {
      console.log('MonacoEditor: wrapper loaded', wrapper)
      console.log(`Wrapper.isInitializing: ${wrapper.isInitializing()}`)
      console.log(`Wrapper.isStarting: ${wrapper.isStarting()}`)
      console.log(`Wrapper.isStarted: ${wrapper.isStarted()}`)
      console.log(`Wrapper.haveLanguageClients: ${wrapper.haveLanguageClients()}`)
    }

    const likeC4ClientWrapper = wrapper.getLanguageClientWrapper('likec4')
    if (!likeC4ClientWrapper) {
      console.warn('LikeC4 LanguageClientWrapper not found, waiting for it to be created')
      return
    }
    setWrapper(wrapper)
  })

  return (
    <>
      <MonacoEditorReactComp
        style={{ width: '100%', height: '100%' }}
        wrapperConfig={wrapperConfig}
        onLoad={onLoad}
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
          setLayoutedModelApi={setLayoutedModelApi}
        />
      )}
    </>
  )
})
LazyMonacoEditor.displayName = 'LazyMonacoEditor'

export default LazyMonacoEditor
