import '@xyflow/react/dist/style.css'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { domAnimation, LazyMotion } from 'framer-motion'
import { useRef } from 'react'
import useTilg from 'tilg'
import { rootClassName } from './globals.css'
import { KeepAspectRatioContainer } from './KeepAspectRatioContainer'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider } from './state/DiagramContext'
import { WhenInitialized } from './state/WhenInitialized'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import { SelectEdgesOnNodeFocus } from './xyflow/SelectEdgesOnNodeFocus'
import { SyncWithDiagram } from './xyflow/SyncWithDiagram'
import type { XYFlowData } from './xyflow/types'
import { XYFlow } from './xyflow/XYFlow'
import { XYFlowInner } from './xyflow/XYFlowInner'

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4Diagram({
  view,
  className,
  fitView = true,
  fitViewPadding = 0,
  readonly = true,
  pannable = true,
  zoomable = true,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  background = 'dots',
  controls = false,
  showElementLinks = true,
  showDiagramTitle = true,
  enableDynamicViewWalkthrough = true,
  initialWidth,
  initialHeight,
  keepAspectRatio = false,
  experimentalEdgeEditing = false,
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
  DEV && useTilg()
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
          pannable={pannable}
          zoomable={zoomable}
          fitViewEnabled={fitView}
          fitViewPadding={fitViewPadding}
          showElementLinks={showElementLinks}
          nodesDraggable={nodesDraggable}
          nodesSelectable={nodesSelectable}
          experimentalEdgeEditing={experimentalEdgeEditing}
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
          <LazyMotion features={domAnimation} strict>
            <KeepAspectRatioContainer
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
                defaultNodes={initialRef.current.defaultNodes}
                defaultEdges={initialRef.current.defaultEdges}
              >
                <XYFlowInner
                  showDiagramTitle={showDiagramTitle}
                  enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
                  background={background}
                  controls={controls}
                />
              </XYFlow>
              <WhenInitialized>
                <SyncWithDiagram />
                {fitView && <FitViewOnDiagramChange />}
                {fitView && zoomable && <SelectEdgesOnNodeFocus />}
              </WhenInitialized>
            </KeepAspectRatioContainer>
          </LazyMotion>
        </DiagramContextProvider>
      </XYFlowProvider>
    </EnsureMantine>
  )
}
