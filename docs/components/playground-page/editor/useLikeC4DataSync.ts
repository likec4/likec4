import type { ComputedView } from '@likec4/core'
import { useUnmountEffect } from '@react-hookz/web'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { useCallback, useRef } from 'react'
import { useUpdateViews } from '../data'
import { Rpc } from './protocol'

function syncLikeC4Data(
  languageClient: MonacoLanguageClient,
  updateViews: (nextViews: Record<string, ComputedView>) => void
) {
  let tokenSource: monaco.CancellationTokenSource | undefined
  let previousOp = Promise.resolve()
  let seqId = 1

  async function fetchModel(token: monaco.CancellationToken) {
    const id = seqId++
    const tag = `syncLikeC4Data.fetchModel.${id}`
    console.time(tag)
    try {
      const { model } = await languageClient.sendRequest(Rpc.fetchModel, token)
      if (token.isCancellationRequested) {
        console.warn(`${tag}: cancel`)
        return
      }
      if (!model) {
        console.warn(`${tag}: empty model`)
        return
      }
      updateViews(model.views)
    } catch (error) {
      console.error(`${tag}: error`, error)
    } finally {
      console.timeEnd(tag)
    }
  }

  const onDidChangeModel = languageClient.onNotification(Rpc.onDidChangeModel, () => {
    console.info('syncLikeC4Data: onDidChangeModel')
    tokenSource?.cancel()
    tokenSource?.dispose()
    previousOp = previousOp
      .catch(err => {
        console.error(err)
        return Promise.resolve()
      })
      .then(() => {
        tokenSource = new monaco.CancellationTokenSource()
        return fetchModel(tokenSource.token)
      })
  })
  console.debug('syncLikeC4Data: on')

  return () => {
    tokenSource?.dispose(true)
    onDidChangeModel.dispose()
    console.debug('syncLikeC4Data: off')
  }
}

export const useLikeC4DataSync = () => {
  const updateViews = useUpdateViews()
  const syncLikeC4DataRef = useRef<null | (() => void)>(null)

  useUnmountEffect(() => {
    syncLikeC4DataRef.current?.()
    syncLikeC4DataRef.current = null
  })

  return useCallback((languageClient: MonacoLanguageClient) => {
    syncLikeC4DataRef.current?.()
    syncLikeC4DataRef.current = syncLikeC4Data(languageClient, updateViews)
  }, [updateViews])
}
