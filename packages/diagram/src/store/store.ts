import { invariant } from '@likec4/core'
import { devtools } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { DiagramNodeWithNavigate } from '../LikeC4Diagram.props'
import type { DiagramInitialState, DiagramState, DiagramStore } from './types'

function createInitialState(props: DiagramInitialState): DiagramStore {
  return {
    xyflow: null,
    xyflowInitialized: false,
    viewportMoved: false,
    hoveredNodeId: null,
    hoveredEdgeId: null,
    // onCanvasClick: null,
    // onCanvasContextMenu: null,
    // onEdgeClick: null,
    // onEdgeContextMenu: null,
    // onNodeClick: null,
    // onNodeContextMenu: null,
    // onChange: null,
    // onNavigateTo: null,
    // onCanvasDblClick: null,
    ...props
  }
}

export function createDiagramStore(props: DiagramInitialState) {
  return createWithEqualityFn<
    DiagramState,
    [
      ['zustand/devtools', never],
      ['zustand/subscribeWithSelector', never]
    ]
  >(
    devtools(
      subscribeWithSelector(
        (set, get) => ({
          ...createInitialState(props),

          triggerOnChange: () => {
            //
          },

          triggerOnNavigateTo: (xynodeId, event) => {
            const { onNavigateTo, xyflow } = get()
            invariant(xyflow, 'xyflow not initialized')
            invariant(onNavigateTo, 'triggerOnNavigateTo should not be called if onNavigateTo is not set')
            const xynode = xyflow.getNode(xynodeId)
            invariant(xynode?.data.element.navigateTo, `node is not navigable: ${xynodeId}`)
            onNavigateTo({
              element: xynode.data.element as DiagramNodeWithNavigate,
              xynode,
              event
            })
          }
        })
      )
    ),
    shallow
  )
}
