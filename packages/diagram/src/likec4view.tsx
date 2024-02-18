import { useMantineContext } from '@mantine/core'
import { ReactFlowProvider } from '@xyflow/react'
import { useMemo } from 'react'
import useTilg from 'tilg'
import { fromDiagramView } from './fromDiagramView'
import { LikeC4ViewStateProvider } from './likec4view_.state'
import { LikeC4ViewStateSync } from './likec4view_.state-sync'
import { type LikeC4ViewProps } from './likec4view_.types'
import { LikeC4ViewXYFlow } from './likec4view_.xyflow'
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
        <LikeC4ViewXYFlow
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
