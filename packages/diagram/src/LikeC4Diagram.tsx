import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { useRef } from 'react'
import { scope } from './index.css'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider } from './store'
import { KeepAspectRatio } from './ui/KeepAspectRatio'
import OptionsPanel from './ui/OptionsPanel'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import type { XYFlowData } from './xyflow/types'
import { UpdateOnDiagramChange } from './xyflow/UpdateOnDiagramChange'
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
  nodesSelectable = true,
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
    const initial = diagramViewToXYFlowData(view, nodesDraggable)
    initialRef.current = {
      defaultNodes: initial.nodes,
      defaultEdges: initial.edges,
      initialWidth: initialWidth ?? view.width,
      initialHeight: initialHeight ?? view.height
    }
  }
  const isNodeInteractive = nodesDraggable || nodesSelectable || !!onNavigateTo
  return (
    <EnsureMantine colorScheme={colorScheme}>
      <DiagramContextProvider
        view={view}
        readonly={readonly}
        fitView={fitView}
        fitViewPadding={fitViewPadding}
        isNodeInteractive={isNodeInteractive}
        showElementLinks={showElementLinks}
        nodesDraggable={nodesDraggable}
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
        <XYFlowProvider
          fitView={fitView}
          {...initialRef.current}
        >
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
              background={background}
              controls={controls}
              defaultNodes={initialRef.current.defaultNodes}
              defaultEdges={initialRef.current.defaultEdges}
              nodesDraggable={nodesDraggable}
              nodesSelectable={nodesSelectable}
              pannable={pannable}
              zoomable={zoomable}
              fitView={fitView}
              colorScheme={colorScheme}
              fitViewPadding={fitViewPadding}
            >
              {readonly !== true && <OptionsPanel />}
            </XYFlow>
          </KeepAspectRatio>
          <UpdateOnDiagramChange />
          {fitView && <FitViewOnDiagramChange />}
        </XYFlowProvider>
      </DiagramContextProvider>
    </EnsureMantine>
  )
}
