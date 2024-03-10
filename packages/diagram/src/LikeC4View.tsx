import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import * as css from './index.css'
import { LikeC4Diagram } from './LikeC4Diagram'
import { type LikeC4ViewProps } from './props'
import { DiagramStateProvider, DiagramStateSync } from './state'
import { fromDiagramView } from './state/fromDiagramView'
import { LikeC4XYFlow } from './xyflow'

export function LikeC4View({
  view,
  reactflowProps,
  ...apiProps
}: LikeC4ViewProps) {
  return (
    <LikeC4Diagram
      view={view}
      readonly
      pannable={false}
      zoomable={false}
      controls={false}
      disableBackground
      disableHovercards
      nodesSelectable={false}
      {...apiProps}
    />
  )
}
