import { updateModelStore, updateViewInModelStore } from '@/data'
import { fetchC4XModel, onDidChangeC4XModel } from '@c4x/language-server-protocol'
import { dotLayout } from '@c4x/layouts'
import { throttle } from 'froebel/function'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { indexBy, mapParallelAsync, values } from 'rambdax'

export function syncModel(languageClient: MonacoLanguageClient) {

  const fetch = async () => {
    const { state } = await languageClient.sendRequest(fetchC4XModel)
    if (state) {
      const { elements, relations } = state
      const layoutedViews = await mapParallelAsync(async (view) => {
        const viewWithDiagram = await dotLayout(view)
        updateViewInModelStore(viewWithDiagram)
        return viewWithDiagram
      }, values(state.views))
      const views = indexBy(v => v.id, layoutedViews)
      updateModelStore({
        elements,
        relations,
        views
      })
    }
  }

  languageClient.onNotification(onDidChangeC4XModel, throttle(() => {
    console.debug('[throttled] onDidChangeC4XModel')
    void fetch()
  }, 500, {
    leading: true,
    trailing: true
  }))
}
