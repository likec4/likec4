import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import * as css from './index.css'
import { type LikeC4DiagramProps } from './props'
import { DiagramStateProvider, DiagramStateSync } from './state'
import { fromDiagramView } from './state/fromDiagramView'
import { LikeC4XYFlow } from './xyflow'

export function LikeC4Diagram({
  view,
  readonly = false,
  nodesDraggable = !readonly,
  ...apiProps
}: LikeC4DiagramProps) {
  useTilg()
  // Verify that the MantineProvider is available
  useMantineContext()
  const initial = useMemo(() => fromDiagramView(view, nodesDraggable), [])
  return (
    <ReactFlowProvider>
      <DiagramStateProvider
        view={view}
        nodesDraggable={nodesDraggable}
        readonly={readonly}
        {...apiProps}
      >
        <LikeC4XYFlow
          className={css.scope}
          defaultNodes={initial.nodes}
          defaultEdges={initial.edges}
        />
        <DiagramStateSync />
      </DiagramStateProvider>
    </ReactFlowProvider>
  )
}
