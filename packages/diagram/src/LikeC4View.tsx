import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import { type LikeC4ViewProps } from './props'
import { LikeC4ViewStateProvider, LikeC4ViewStateSync } from './state'
import { fromDiagramView } from './state/fromDiagramView'
import { LikeC4XYFlow } from './xyflow'
import './styles.css'
import Camera from './ui/Camera'
import OptionsPanel from './ui/OptionsPanel'

export function LikeC4View({
  view,
  readonly = false,
  nodesDraggable = !readonly,
  ...apiProps
}: LikeC4ViewProps) {
  useTilg()
  // Verify that the MantineProvider is available
  useMantineContext()
  const initial = useMemo(() => fromDiagramView(view, nodesDraggable), [])
  return (
    <ReactFlowProvider>
      <LikeC4ViewStateProvider
        view={view}
        readonly={readonly}
        nodesDraggable={nodesDraggable}
        {...apiProps}
      >
        <LikeC4XYFlow
          defaultNodes={initial.nodes}
          defaultEdges={initial.edges}
        />
        <LikeC4ViewStateSync />
        <Camera />
        {!readonly && <OptionsPanel />}
      </LikeC4ViewStateProvider>
    </ReactFlowProvider>
  )
}
