import { Background, Controls, ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { useRef } from 'react'
import useTilg from 'tilg'
import { isOnlyEventHandlers, type LikeC4DiagramEventHandlers, type LikeC4DiagramProps } from './LikeC4Diagram.props'
import { DiagramStateProvider } from './state'
import OptionsPanel from './ui/OptionsPanel'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import type { XYFlowData } from './xyflow/types'
import { UpdateViewportOnDiagramChange } from './xyflow/UpdateViewportOnDiagramChange'
import { UpdateXYFlowOnDiagramChange } from './xyflow/UpdateXYFlowOnDiagramChange'
import { XYFLowEventHandlers } from './xyflow/XYFLowEventHandlers'
import { XYFlowWrapper } from './xyflow/XYFlowWrapper'

type Props = LikeC4DiagramProps & LikeC4DiagramEventHandlers
export function LikeC4Diagram({
  view,
  fitView = true,
  colorMode,
  readonly = false,
  pannable = true,
  zoomable = true,
  fitOnSelect = fitView,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitViewPadding = 0.05,
  controls = !readonly,
  disableHovercards = false,
  ...eventHandlers
}: Props) {
  useTilg()
  isOnlyEventHandlers(eventHandlers)
  const iniitialRef = useRef<
    XYFlowData & {
      width: number
      height: number
    }
  >()
  if (!iniitialRef.current) {
    iniitialRef.current = {
      ...diagramViewToXYFlowData(view, nodesDraggable),
      width: view.width,
      height: view.height
    }
  }
  return (
    <XYFlowProvider
      fitView={fitView}
      defaultEdges={iniitialRef.current.edges}
      defaultNodes={iniitialRef.current.nodes}
      initialWidth={iniitialRef.current.width}
      initialHeight={iniitialRef.current.height}
    >
      <DiagramStateProvider
        readonly={readonly}
        disableHovercards={disableHovercards}
        eventHandlers={eventHandlers}
      >
        <XYFLowEventHandlers eventHandlers={eventHandlers}>
          <XYFlowWrapper
            defaultNodes={iniitialRef.current.nodes}
            defaultEdges={iniitialRef.current.edges}
            readonly={readonly}
            nodesDraggable={nodesDraggable}
            nodesSelectable={nodesSelectable}
            pannable={pannable}
            zoomable={zoomable}
            fitView={fitView}
            colorMode={colorMode}
            fitOnSelect={fitOnSelect}
            disableBackground={disableBackground}
            fitViewPadding={fitViewPadding}
          >
            <UpdateXYFlowOnDiagramChange
              view={view}
              nodesDraggable={nodesDraggable}
            />
            {disableBackground !== true && <Background />}
            {controls && <Controls />}
            {readonly !== true && <OptionsPanel />}
            {fitView && <UpdateViewportOnDiagramChange viewId={view.id} layout={view.autoLayout} />}
          </XYFlowWrapper>
        </XYFLowEventHandlers>
      </DiagramStateProvider>
    </XYFlowProvider>
  )
}
