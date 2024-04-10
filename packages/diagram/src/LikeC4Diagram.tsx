import { Controls, ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { useRef } from 'react'
import type { Exact } from 'type-fest'
import { scope } from './index.css'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramStateProvider } from './state/DiagramState'
import { KeepAspectRatio } from './ui/KeepAspectRatio'
import OptionsPanel from './ui/OptionsPanel'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
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
  fitViewPadding = 0,
  colorMode,
  readonly = true,
  pannable = true,
  zoomable = true,
  nodesSelectable = true,
  nodesDraggable = !readonly,
  background = 'dots',
  controls = false,
  disableHovercards = false,
  initialWidth,
  initialHeight,
  keepAspectRatio = false,
  ...eventHandlers
}: LikeC4DiagramProps) {
  // useTilg()
  isOnlyEventHandlers(eventHandlers)
  const initialRef = useRef<{
    defaultNodes: XYFlowData['nodes']
    defaultEdges: XYFlowData['edges']
    initialWidth: number
    initialHeight: number
  }>()
  if (!initialRef.current) {
    const initial = diagramViewToXYFlowData(view)
    initialRef.current = {
      defaultNodes: initial.nodes,
      defaultEdges: initial.edges,
      initialWidth: initialWidth ?? view.width,
      initialHeight: initialHeight ?? view.height
    }
  }
  const isBgWithPattern = background !== 'transparent' && background !== 'solid'
  const isNodeInteractive = nodesDraggable || nodesSelectable || !!eventHandlers.onNavigateTo
    || !!eventHandlers.onNavigateTo
  return (
    <EnsureMantine colorMode={colorMode}>
      <XYFlowProvider
        fitView={fitView}
        {...initialRef.current}
      >
        <DiagramStateProvider
          isNodeInteractive={isNodeInteractive}
          view={view}
          fitViewPadding={fitViewPadding}
          readonly={readonly}
          disableHovercards={disableHovercards}
          eventHandlers={eventHandlers}
        >
          <XYFlowEventHandlers eventHandlers={eventHandlers}>
            <KeepAspectRatio
              enabled={keepAspectRatio}
              width={view.width}
              height={view.height}
            >
              <XYFlow
                className={clsx(
                  className,
                  scope,
                  cssReactFlow,
                  controls === false && cssNoControls,
                  pannable !== true && cssDisablePan,
                  background === 'transparent' && cssTransparentBg
                )}
                defaultNodes={initialRef.current.defaultNodes}
                defaultEdges={initialRef.current.defaultEdges}
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
                {fitView && <FitViewOnDiagramChange />}
              </XYFlow>
            </KeepAspectRatio>
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
