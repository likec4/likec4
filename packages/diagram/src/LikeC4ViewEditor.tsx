import { type DiagramView } from '@likec4/core'
import { ReactFlowProvider } from '@xyflow/react'
import { memo, useMemo } from 'react'

import { IsolatedJotaiProvider } from './jotai'
import type { LikeC4ViewEditorApiProps } from './ViewEditorApi'
import { LikeC4EditorProvider } from './ViewEditorApi'
import { DataSync } from './ViewEditorDataSync'
import { LikeC4ReactFlow } from './ViewEditorReactFlow'
import './styles.css'
import useTilg from 'tilg'
import { fromDiagramView } from './fromDiagramView'
import Camera from './ui/Camera'
import StylesPanel from './ui/StylesPanel'

export type LikeC4ViewEditorProps = LikeC4ViewEditorApiProps & {
  view: DiagramView
}

export function LikeC4ViewEditor({
  view,
  readonly = false,
  nodesDraggable = !readonly,
  ...apiProps
}: LikeC4ViewEditorProps) {
  useTilg()
  const initial = useMemo(() => fromDiagramView(view, nodesDraggable), [])
  return (
    <IsolatedJotaiProvider>
      <ReactFlowProvider>
        <LikeC4EditorProvider
          view={view}
          readonly={readonly}
          nodesDraggable={nodesDraggable}
          {...apiProps}
        >
          <LikeC4ReactFlow
            defaultNodes={initial.nodes}
            defaultEdges={initial.edges} />
          <DataSync view={view} />
          <Camera viewId={view.id} />
          {!readonly && <StylesPanel />}
        </LikeC4EditorProvider>
      </ReactFlowProvider>
    </IsolatedJotaiProvider>
  )
}
