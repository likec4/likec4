import { nonexhaustive, type DiagramView } from '@likec4/core'
import { logger } from '@nanostores/logger'
import { action, atom, computed, map, onMount } from 'nanostores'
import { equals } from 'rambdax'
import { $router } from '../router'
import { LikeC4Views } from './data'

export const $views = map<Record<string, DiagramView>>(LikeC4Views)
export const $updateViews = action($views, 'updateViews', (store, update: Record<string, DiagramView>) => {
  const current = store.get()
  Object.keys(current)
    .filter(id => !(id in update))
    .forEach(id => {
      // @ts-expect-error 'undefined' is not assignable to type 'DiagramView'
      store.setKey(id, undefined)
    })
  for (const [id, view] of Object.entries(update)) {
    if (!equals(current[id], view)) {
      store.setKey(id, view)
    }
  }
})

const $currentViewID = atom<string | null>('index')
onMount($currentViewID, () => {
  return $router.subscribe(route => {
    if (!route) {
      return
    }
    if (route.route === 'view') {
      $currentViewID.set(route.params.viewId)
      return
    }
    if (route.route === 'index') {
      $currentViewID.set('index')
      return
    }
    nonexhaustive(route)
  })
})

export const $currentView = computed([$currentViewID, $views], (id, views) => (id !== null && views[id]) || null)

const destroyLogger = logger({
  views: $views,
  currentViewID: $currentViewID,
  currentView: $currentView
})
if (import.meta.hot) {
  import.meta.hot.accept('./data', md => {
    console.log('accept', md)
    const update = md?.['LikeC4Views']
    if (update) {
      $updateViews(update)
    }
  })
  import.meta.hot.prune(() => {
    console.log('prune')
    destroyLogger()
  })
}
