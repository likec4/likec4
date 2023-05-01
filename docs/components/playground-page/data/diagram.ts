import type { ComputedView, DiagramView, ViewID } from '@likec4/core/types'
import { dotLayout } from '@likec4/layouts'
import { equals, values, head } from 'rambdax'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useViewsStore } from './views'

type DiagramStore = {
  viewId: ViewID
  diagram: DiagramView | null
} | {
  viewId: null
  diagram: null
}

export const useDiagramStore = create<DiagramStore>()(
  devtools(
    (_set, _get) => {
      return {
        viewId: null,
        diagram: null,
      }
    },
    {
      name: 'diagram-store',
      trace: true,
    }
  )
)

export async function setDiagramFromView(view: ComputedView) {
  // if (useDiagramStore.getState().viewId !== view.id) {
  //   useDiagramStore.setState({ viewId: view.id }, false, 'set-current-viewId')
  // }
  const diagram = await dotLayout(view)
  useDiagramStore.setState({
    viewId: view.id,
    diagram,
  }, false,  'set-current-diagram')
}

useViewsStore.subscribe(({views}, {views: previousViews}) => {
  const { viewId } = useDiagramStore.getState()
  if (!viewId) {
    if ('index' in views) {
      void setDiagramFromView(views.index)
      return
    }
    const anyFirstView =  head(values(views))
    if (anyFirstView) {
      void setDiagramFromView(anyFirstView)
    }
    return
  }
  const currentView = views[viewId]
  if (!currentView) {
    useDiagramStore.setState({diagram: null}, false, 'reset-current-diagram')
    return
  }

  const previosView = previousViews[viewId]
  if (!equals(currentView, previosView)) {
    void setDiagramFromView(currentView)
  }
})

export function setDiagramFromViewId(viewId: string) {
  const targetView = useViewsStore.getState().views[viewId]
  if (targetView) {
    void setDiagramFromView(targetView)
  }
}

// const selector = ({diagram}: DiagramStore) => diagram

// export const useDiagram = () => useDiagramStore(selector)
