import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import { type LikeC4DiagramProps, type LikeC4ViewProps } from './props'
import { DiagramStateProvider } from './state'
import { fromDiagramView } from './state/fromDiagramView'
import './styles.css'
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
        {...apiProps}
      >
        <LikeC4XYFlow
          defaultNodes={initial.nodes}
          defaultEdges={initial.edges}
        />
      </DiagramStateProvider>
    </ReactFlowProvider>
  )
}
