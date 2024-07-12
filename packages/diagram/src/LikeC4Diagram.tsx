import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import { domAnimation, LazyMotion } from 'framer-motion'
import { memo, useEffect, useRef, useState } from 'react'
import useTilg from 'tilg'
import { rootClassName } from './globals.css'
import { cssDisablePan, cssNoControls, cssReactFlow, cssTransparentBg } from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider } from './state/DiagramContext'
import { useDiagramStoreApi } from './state/useDiagramStore'
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
            <LikeC4DiagramInnerMemo
              defaultNodes={initialRef.current.defaultNodes}
              defaultEdges={initialRef.current.defaultEdges}
              fitView={fitView}
              zoomable={zoomable}
              background={background}
              controls={controls}
              pannable={pannable}
              showDiagramTitle={showDiagramTitle}
              showNavigationButtons={showNavigationButtons}
              enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
            />
          </LazyMotion>
        </DiagramContextProvider>
      </XYFlowProvider>
    </EnsureMantine>
  )
}

type LikeC4DiagramInnerProps = {
  background: NonNullable<LikeC4DiagramProperties['background']>
  fitView: boolean
  zoomable: boolean
  pannable: boolean
  controls: boolean
  defaultNodes: XYFlowNode[]
  defaultEdges: XYFlowEdge[]
  showDiagramTitle: boolean
  showNavigationButtons: boolean
  enableDynamicViewWalkthrough: boolean
}
const LikeC4DiagramInnerMemo = memo<LikeC4DiagramInnerProps>(function LikeC4DiagramInner({
  background,
  fitView,
  zoomable,
  controls,
  pannable,
  defaultNodes,
  defaultEdges,
  showDiagramTitle,
  showNavigationButtons,
  enableDynamicViewWalkthrough
}) {
  DEV && useTilg()
  const diagramApi = useDiagramStoreApi()
  const [isInitialized, setIsInitialized] = useState(diagramApi.getState().initialized)

  useEffect(() => {
    if (isInitialized) {
      return
    }
    return diagramApi.subscribe(
      s => s.initialized,
      setIsInitialized,
      {
        fireImmediately: true
      }
    )
  }, [isInitialized])

  return (
    <>
      <XYFlow
        defaultNodes={defaultNodes}
        defaultEdges={defaultEdges}
        className={clsx(
          'likec4-diagram',
          cssReactFlow,
          controls === false && cssNoControls,
          pannable !== true && cssDisablePan,
          background === 'transparent' && cssTransparentBg
        )}
      >
        <XYFlowInner
          showNavigationButtons={showNavigationButtons}
          showDiagramTitle={showDiagramTitle}
          enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
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
