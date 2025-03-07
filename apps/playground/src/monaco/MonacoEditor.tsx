import { usePlayground } from '$/hooks/usePlayground'
import { loggable, rootLogger } from '@likec4/log'
import { useCallbackRef } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react'
import type { MonacoEditorLanguageClientWrapper, TextContents } from 'monaco-editor-wrapper'
import { memo, useMemo, useState } from 'react'
import { createWrapperConfig } from './config'
import { LanguageClientSync } from './LanguageClientSync'

const logger = rootLogger.getChild('monaco-editor')

const LazyMonacoEditor = memo(() => {
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
        onTextChanged={useCallbackRef((textChanges: TextContents) => {
          console.debug('onTextChanged', { textChanges })
          // const { filename, text } = playground.getActiveFile()
          // playground.send({
          //   type: 'monaco.onTextChanged',
          //   filename,
          //   modified: textChanges.modified ?? text,
          // })
        })}
        onError={useCallbackRef(err => {
          logger.error(loggable(err))
        })}
      />
      {wrapper && <LanguageClientSync config={wrapperConfig} wrapper={wrapper} />}
    </>
  )
})
LazyMonacoEditor.displayName = 'LazyMonacoEditor'

export default LazyMonacoEditor
