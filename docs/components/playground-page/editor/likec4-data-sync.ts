import type { MonacoLanguageClient } from 'monaco-languageclient'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
// import { CancellationTokenSource, type CancellationToken } from 'monaco-editor'
import { Rpc } from '@likec4/language-server/protocol'
import { updateViewsStore } from '../data'
import { useEffect, useRef} from 'react'

function syncLikeC4Data(languageClient: MonacoLanguageClient) {

  let tokenSource: monaco.CancellationTokenSource | undefined

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
      updateViewsStore(model.views)
    } catch (error) {
      console.error(`${tag}: error`, error)
    } finally {
      console.timeEnd(tag)
    }
  }

  const onDidChangeModel = languageClient.onNotification(Rpc.onDidChangeModel, () => {
    console.debug('syncLikeC4Data: onDidChangeModel')
    if (tokenSource) {
      tokenSource.dispose(true)
    }
    const opToken = tokenSource = new monaco.CancellationTokenSource()
    fetchModel(opToken.token).finally(() => {
      if (opToken === tokenSource) {
        tokenSource = undefined
      }
      opToken.dispose()
    })
  })
  console.debug('syncLikeC4Data: on')

  return () => {
    tokenSource?.dispose(true)
    onDidChangeModel.dispose()
    console.debug('syncLikeC4Data: off')
  }
}

export const useLikeC4DataSyncEffect = (languageClient: () => MonacoLanguageClient) =>
  useEffect(() => syncLikeC4Data(languageClient()), [])
