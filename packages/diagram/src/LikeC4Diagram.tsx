import { Controls, ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { useRef } from 'react'
import useTilg from 'tilg'
import type { Exact } from 'type-fest'
import { scope } from './index.css'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramStateProvider } from './state'
import OptionsPanel from './ui/OptionsPanel'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitviewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import type { XYFlowData } from './xyflow/types'
import { UpdateOnDiagramChange } from './xyflow/UpdateOnDiagramChange'
import { XYFlowBackground } from './xyflow/XYFlowBackground'
import { XYFlowEventHandlers } from './xyflow/XYFlowEvents'
import { XYFlow } from './xyflow/XYFlowWrapper'

// Guard, Ensure that object contains only event handlers
const isOnlyEventHandlers = <T extends Exact<LikeC4DiagramEventHandlers, T>>(handlers: T): T => {
  return handlers
}

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4Diagram({
  view,
  className,
  fitView = true,
  colorMode,
  readonly = false,
  pannable = true,
  zoomable = true,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  background = 'dots',
  fitViewPadding = 0.05,
  controls = !readonly,
  disableHovercards = false,
  ...eventHandlers
}: LikeC4DiagramProps) {
  useTilg()
  isOnlyEventHandlers(eventHandlers)
  const initialRef = useRef<
    XYFlowData & {
      width: number
      height: number
    }
  >()
  if (!initialRef.current) {
    initialRef.current = {
      ...diagramViewToXYFlowData(view, nodesDraggable),
      width: view.width,
      height: view.height
    }
  }
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  return (
    <EnsureMantine colorMode={colorMode}>
      <XYFlowProvider
        fitView={fitView}
        defaultEdges={initialRef.current.edges}
        defaultNodes={initialRef.current.nodes}
        initialWidth={initialRef.current.width}
        initialHeight={initialRef.current.height}
      >
        <DiagramStateProvider
          view={view}
          readonly={readonly}
          disableHovercards={disableHovercards}
          eventHandlers={eventHandlers}
        >
          <XYFlowEventHandlers eventHandlers={eventHandlers}>
            <XYFlow
              className={clsx(
                scope,
                cssReactFlow,
                controls === false && cssNoControls,
                pannable !== true && cssDisablePan,
                className,
                background === 'transparent' && cssTransparentBg
              )}
              defaultNodes={initialRef.current.nodes}
              defaultEdges={initialRef.current.edges}
              readonly={readonly}
              nodesDraggable={nodesDraggable}
              nodesSelectable={nodesSelectable}
              pannable={pannable}
              zoomable={zoomable}
              fitView={fitView}
              colorMode={colorMode}
              fitViewPadding={fitViewPadding}
            >
              {isBgWithPattern && <XYFlowBackground background={background} />}
              {controls && <Controls />}
              {readonly !== true && <OptionsPanel />}
              {fitView && <FitviewOnDiagramChange />}
            </XYFlow>
            <UpdateOnDiagramChange
              view={view}
              nodesDraggable={nodesDraggable}
            />
          </XYFlowEventHandlers>
        </DiagramStateProvider>
      </XYFlowProvider>
    </EnsureMantine>
  )
}
