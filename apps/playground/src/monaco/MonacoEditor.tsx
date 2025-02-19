import { usePlayground } from '$/hooks/usePlayground'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import type { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { memo, useMemo, useState } from 'react'
import { createWrapperConfig } from './config'
import { LanguageClientSync } from './LanguageClientSync'

const logger = rootLogger.getChild('monaco-editor')

const LazyMonacoEditor = memo(() => {
  const playground = usePlayground()

  const onActiveEditorChanged = useCallbackRef((filename: string) => {
    if (playground.getActiveFile().filename !== filename) {
      playground.changeActiveFile(filename)
    }
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
    setWrapper(wrapper)
    // Anything else?
  })

  return (
    <>
      <MonacoEditorReactComp
        style={{ width: '100%', height: '100%' }}
        wrapperConfig={wrapperConfig}
        onLoad={onLoad}
        onError={err => {
          logger.error(loggable(err))
        }}
      />
      {wrapper && <LanguageClientSync config={wrapperConfig} wrapper={wrapper} />}
    </>
  )
})
LazyMonacoEditor.displayName = 'LazyMonacoEditor'

export default LazyMonacoEditor
