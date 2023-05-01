import type { ComputedView, ViewID } from '@likec4/core/types'
import { equals, map } from 'rambdax'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ViewsStore {
  ready: boolean
  views: Record<string, ComputedView>
}

export const useViewsStore = create<ViewsStore>()(
  devtools(
    (_set, _get) => {
      return {
        ready: false,
        views: {},
      }
    },
    {
      name: 'views-store',
      trace: true,
    }
  )
)

export const updateViewsStore = (nextViews: Record<ViewID, ComputedView>) => {
  const currentViews = useViewsStore.getState().views
  let hasChanges = false
  const views = map(
    (next, id) => {
      const current = currentViews[id]
      if (!!current && equals(current, next)) {
        return current
      } else {
        hasChanges = true
        return next
      }
    },
    nextViews
  )
  if (hasChanges) {
    useViewsStore.setState({ ready: true, views }, false, 'updateViewsStore')
  }

}
