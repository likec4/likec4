import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import * as css from './index.css'
import { type LikeC4ViewProps } from './props'
import { DiagramStateProvider, DiagramStateSync } from './state'
import { fromDiagramView } from './state/fromDiagramView'
import { LikeC4XYFlow } from './xyflow'

export function LikeC4View({
  view,
  reactflowProps,
  ...apiProps
}: LikeC4ViewProps) {
  useTilg()
  // Verify that the MantineProvider is available
  useMantineContext()
  const initial = useMemo(() => fromDiagramView(view, false), [])
  return (
    <ReactFlowProvider>
      <DiagramStateProvider
        view={view}
        readonly={true}
        pannable={false}
        zoomable={false}
        controls={false}
        disableBackground={true}
        nodesSelectable={false}
        {...apiProps}
      >
        <LikeC4XYFlow
          className={css.scope}
          defaultNodes={initial.nodes}
          defaultEdges={initial.edges}
          {...reactflowProps}
        />
        <DiagramStateSync />
      </DiagramStateProvider>
    </ReactFlowProvider>
  )
}
