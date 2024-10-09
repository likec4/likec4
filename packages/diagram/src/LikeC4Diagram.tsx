import type { DiagramView } from '@likec4/core'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { domAnimation, LazyMotion } from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import { rootClassName } from './globals.css'
import { useDiagramState } from './hooks/useDiagramState'
import { LikeC4CustomColors } from './LikeC4CustomColors'
import * as css from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { useLikeC4Model } from './likec4model'
import { EnsureMantine } from './mantine/EnsureMantine'
import { DiagramContextProvider } from './state/DiagramContext'
import { FitViewOnDiagramChange } from './xyflow/FitviewOnDiagramChange'
import { SelectEdgesOnNodeFocus } from './xyflow/SelectEdgesOnNodeFocus'
import type { XYFlowEdge, XYFlowNode } from './xyflow/types'
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
  showNotations = true,
  showRelationshipDetails = true,
  enableDynamicViewWalkthrough = false,
  enableFocusMode = false,
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
  onOpenSourceElement,
  onOpenSourceView,
  onOpenSourceRelation,
  onBurgerMenuClick,
  renderIcon,
  where,
  showNavigationButtons = !!onNavigateTo
}: LikeC4DiagramProps) {
  const hasLikec4model = !!useLikeC4Model()
  const initialRef = useRef({
    defaultNodes: [] as XYFlowNode[],
    defaultEdges: [] as XYFlowEdge[],
    initialWidth: initialWidth ?? view.bounds.width,
    initialHeight: initialHeight ?? view.bounds.height
  })
  if (readonly !== true && !!where) {
    console.warn('where filter is only supported in readonly mode')
  }
  useEffect(() => {
    if (showRelationshipDetails && !hasLikec4model) {
      console.warn('Relationship details require LikeC4ModelProvider')
    }
  }, [showRelationshipDetails, hasLikec4model])

  return (
    <EnsureMantine>
      <LazyMotion features={domAnimation} strict>
        <XYFlowProvider
          fitView={fitView}
          {...initialRef.current}
        >
          {customColorsDefined(view) && <LikeC4CustomColors customColors={view.customColorDefinitions} />}
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
            showNavigationButtons={showNavigationButtons}
            showNotations={showNotations}
            showRelationshipDetails={showRelationshipDetails && hasLikec4model}
            nodesDraggable={nodesDraggable}
            nodesSelectable={nodesSelectable}
            experimentalEdgeEditing={experimentalEdgeEditing}
            enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
            enableFocusMode={enableFocusMode}
            whereFilter={where ?? null}
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
            onOpenSourceView={onOpenSourceView ?? null}
            onOpenSourceElement={onOpenSourceElement ?? null}
            onOpenSourceRelation={onOpenSourceRelation ?? null}
            onBurgerMenuClick={onBurgerMenuClick ?? null}
          >
            <LikeC4DiagramInnerMemo
              controls={controls}
              background={background}
              showDiagramTitle={showDiagramTitle}
            />
          </DiagramContextProvider>
        </XYFlowProvider>
      </LazyMotion>
    </EnsureMantine>
  )
}
LikeC4Diagram.displayName = 'LikeC4Diagram'

type LikeC4DiagramInnerProps = {
  background: NonNullable<LikeC4DiagramProperties['background']>
  controls: boolean
  showDiagramTitle: boolean
}
const LikeC4DiagramInnerMemo = /* @__PURE__ */ memo<LikeC4DiagramInnerProps>(function LikeC4DiagramInner({
  background,
  controls,
  showDiagramTitle
}) {
  const {
    isInitialized,
    pannable,
    fitView,
    enableFocusMode
  } = useDiagramState(s => ({
    isInitialized: s.initialized,
    zoomable: s.zoomable,
    pannable: s.pannable,
    fitView: s.fitViewEnabled,
    enableFocusMode: s.enableFocusMode
  }))

  return (
    <>
      <XYFlow
        className={clsx(
          'likec4-diagram',
          css.cssReactFlow,
          controls === false && css.cssNoControls,
          pannable !== true && css.cssDisablePan,
          background === 'transparent' && css.cssTransparentBg
        )}
      >
        <XYFlowInner
          showDiagramTitle={showDiagramTitle}
          background={background}
          controls={controls}
        />
      </XYFlow>
      {isInitialized && (
        <>
          {fitView && <FitViewOnDiagramChange />}
          {enableFocusMode && <SelectEdgesOnNodeFocus />}
        </>
      )}
    </>
  )
}, shallowEqual)
LikeC4DiagramInnerMemo.displayName = 'LikeC4DiagramInnerMemo'

function customColorsDefined(view: DiagramView) {
  return Object.keys(view.customColorDefinitions).length > 0
}
