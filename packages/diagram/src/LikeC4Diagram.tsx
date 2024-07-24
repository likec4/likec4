import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { domAnimation, LazyMotion } from 'framer-motion'
import { memo, useRef } from 'react'
import { rootClassName } from './globals.css'
import * as css from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider } from './state/DiagramContext'
import { useDiagramState } from './state/useDiagramStore'
import { diagramViewToXYFlowData } from './xyflow/diagram-to-xyflow'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import { SelectEdgesOnNodeFocus } from './xyflow/SelectEdgesOnNodeFocus'
import { SyncWithDiagram } from './xyflow/SyncWithDiagram'
import type { XYFlowData, XYFlowEdge, XYFlowNode } from './xyflow/types'
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
  showNavigationButtons = false,
  enableDynamicViewWalkthrough = false,
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
  onNodeContextMenu,
  renderIcon
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
      <LazyMotion features={domAnimation} strict>
        <XYFlowProvider
          fitView={fitView}
          {...initialRef.current}
        >
          <DiagramContextProvider
            view={view}
            keepAspectRatio={keepAspectRatio}
            className={clsx(rootClassName, className)}
            readonly={readonly}
            pannable={pannable}
            zoomable={zoomable}
            fitViewEnabled={fitView}
            fitViewPadding={fitViewPadding}
            showElementLinks={showElementLinks}
            nodesDraggable={nodesDraggable}
            nodesSelectable={nodesSelectable}
            experimentalEdgeEditing={experimentalEdgeEditing}
            enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
            renderIcon={renderIcon ?? null}
            onCanvasClick={onCanvasClick ?? null}
            onCanvasContextMenu={onCanvasContextMenu ?? null}
            onEdgeClick={onEdgeClick ?? null}
            onEdgeContextMenu={onEdgeContextMenu ?? null}
            onNodeClick={onNodeClick ?? null}
            onNodeContextMenu={onNodeContextMenu ?? null}
            onChange={onChange ?? null}
            onNavigateTo={onNavigateTo ?? null}
            onCanvasDblClick={onCanvasDblClick ?? null}
          >
            <LikeC4DiagramInnerMemo
              defaultNodes={initialRef.current.defaultNodes}
              defaultEdges={initialRef.current.defaultEdges}
              controls={controls}
              background={background}
              showDiagramTitle={showDiagramTitle}
              showNavigationButtons={showNavigationButtons}
            />
          </DiagramContextProvider>
        </XYFlowProvider>
      </LazyMotion>
    </EnsureMantine>
  )
}

type LikeC4DiagramInnerProps = {
  background: NonNullable<LikeC4DiagramProperties['background']>
  controls: boolean
  defaultNodes: XYFlowNode[]
  defaultEdges: XYFlowEdge[]
  showDiagramTitle: boolean
  showNavigationButtons: boolean
}
const LikeC4DiagramInnerMemo = memo<LikeC4DiagramInnerProps>(function LikeC4DiagramInner({
  background,
  controls,
  defaultNodes,
  defaultEdges,
  showDiagramTitle,
  showNavigationButtons
}) {
  const {
    isInitialized,
    zoomable,
    pannable,
    fitView
  } = useDiagramState(s => ({
    isInitialized: s.initialized,
    zoomable: s.zoomable,
    pannable: s.pannable,
    fitView: s.fitViewEnabled
  }))

  return (
    <>
      <XYFlow
        defaultNodes={defaultNodes}
        defaultEdges={defaultEdges}
        className={clsx(
          'likec4-diagram',
          css.cssReactFlow,
          controls === false && css.cssNoControls,
          pannable !== true && css.cssDisablePan,
          background === 'transparent' && css.cssTransparentBg
        )}
      >
        <XYFlowInner
          showNavigationButtons={showNavigationButtons}
          showDiagramTitle={showDiagramTitle}
          background={background}
          controls={controls}
        />
      </XYFlow>
      {isInitialized && (
        <>
          <SyncWithDiagram />
          {fitView && <FitViewOnDiagramChange />}
          {fitView && zoomable && <SelectEdgesOnNodeFocus />}
        </>
      )}
    </>
  )
}, shallowEqual)
