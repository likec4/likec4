import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { useRef } from 'react'
import { rootClassName } from './globals.css'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider, WhenInitialized } from './state'
import { KeepAspectRatio } from './ui/KeepAspectRatio'
import OptionsPanel from './ui/OptionsPanel'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import { SyncWithDiagram } from './xyflow/SyncWithDiagram'
import type { XYFlowData } from './xyflow/types'
import { XYFlow } from './xyflow/XYFlowWrapper'

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4Diagram({
  view,
  className,
  fitView = true,
  fitViewPadding = 0,
  colorScheme,
  readonly = true,
  pannable = true,
  zoomable = true,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  background = 'dots',
  controls = false,
  showElementLinks = true,
  initialWidth,
  initialHeight,
  keepAspectRatio = false,
  onCanvasClick,
  onCanvasContextMenu,
  onCanvasDblClick,
  onEdgeClick,
  onChange,
  onEdgeContextMenu,
  onNavigateTo,
  onNodeClick,
  onNodeContextMenu
}: LikeC4DiagramProps) {
  const initialRef = useRef<{
    defaultNodes: XYFlowData['nodes']
    defaultEdges: XYFlowData['edges']
    initialWidth: number
    initialHeight: number
  }>()
  if (!initialRef.current) {
    const initial = diagramViewToXYFlowData(view, {
      selectable: nodesSelectable,
      draggable: nodesDraggable
    })
    initialRef.current = {
      defaultNodes: initial.nodes,
      defaultEdges: initial.edges,
      initialWidth: initialWidth ?? view.width,
      initialHeight: initialHeight ?? view.height
    }
  }
  return (
    <EnsureMantine>
      <XYFlowProvider
        fitView={fitView}
        {...initialRef.current}
      >
        <DiagramContextProvider
          view={view}
          readonly={readonly}
          fitViewEnabled={fitView}
          fitViewPadding={fitViewPadding}
          showElementLinks={showElementLinks}
          nodesDraggable={nodesDraggable}
          nodesSelectable={nodesSelectable}
          onCanvasClick={onCanvasClick}
          onCanvasContextMenu={onCanvasContextMenu}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onChange={onChange}
          onNavigateTo={onNavigateTo}
          onCanvasDblClick={onCanvasDblClick}
        >
          <KeepAspectRatio
            className={clsx(rootClassName, className)}
            enabled={keepAspectRatio}
            width={view.width}
            height={view.height}
          >
            <XYFlow
              className={clsx(
                'likec4-diagram',
                cssReactFlow,
                controls === false && cssNoControls,
                pannable !== true && cssDisablePan,
                background === 'transparent' && cssTransparentBg
              )}
              background={background}
              controls={controls}
              defaultNodes={initialRef.current.defaultNodes}
              defaultEdges={initialRef.current.defaultEdges}
              pannable={pannable}
              zoomable={zoomable}
            >
              {readonly !== true && <OptionsPanel />}
            </XYFlow>
          </KeepAspectRatio>
          <WhenInitialized>
            <SyncWithDiagram />
            <FitViewOnDiagramChange />
          </WhenInitialized>
        </DiagramContextProvider>
      </XYFlowProvider>
    </EnsureMantine>
  )
}
