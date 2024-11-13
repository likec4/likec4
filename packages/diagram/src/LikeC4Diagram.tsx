import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { memo, useEffect, useRef } from 'react'
import { isEmpty } from 'remeda'
import { rootClassName } from './globals.css'
import { useDiagramState } from './hooks/useDiagramState'
import { LikeC4CustomColors } from './LikeC4CustomColors'
import * as css from './LikeC4Diagram.css'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { useLikeC4Model } from './likec4model'
import { Overlays } from './overlays'
import { DiagramContextProvider } from './state/DiagramContext'
import { EnsureMantine } from './ui/EnsureMantine'
import { FramerMotionConfig } from './ui/FramerMotionConfig'
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
  controls = !readonly,
  showDiagramTitle = true,
  showNotations = true,
  enableDynamicViewWalkthrough = false,
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipBrowser = enableElementDetails,
  enableRelationshipDetails = enableRelationshipBrowser,
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
  useEffect(() => {
    if (readonly !== true && where != null) {
      console.warn('Ignore filter, supported in readonly mode only\n', { where })
    }
    if (hasLikec4model) {
      return
    }
    if (enableRelationshipDetails) {
      console.warn('Invalid showRelationshipDetails=true, requires LikeC4ModelProvider')
    }
    if (enableElementDetails) {
      console.warn('Invalid enableElementDetails=true, requires LikeC4ModelProvider')
    }
    if (enableRelationshipBrowser) {
      console.warn('Invalid enableRelationshipBrowser=true, requires LikeC4ModelProvider')
    }
  })

  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <XYFlowProvider
          fitView={fitView}
          {...initialRef.current}
        >
          {!isEmpty(view.customColorDefinitions) && <LikeC4CustomColors customColors={view.customColorDefinitions} />}
          <DiagramContextProvider
            view={view}
            keepAspectRatio={keepAspectRatio}
            className={clsx(rootClassName, className)}
            readonly={readonly}
            pannable={pannable}
            zoomable={zoomable}
            hasLikeC4Model={hasLikec4model}
            fitViewEnabled={fitView}
            fitViewPadding={fitViewPadding}
            controls={controls}
            showNavigationButtons={showNavigationButtons && !!onNavigateTo}
            showNotations={showNotations}
            enableRelationshipDetails={enableRelationshipDetails && hasLikec4model}
            nodesDraggable={nodesDraggable}
            nodesSelectable={nodesSelectable}
            experimentalEdgeEditing={experimentalEdgeEditing}
            enableElementDetails={enableElementDetails && hasLikec4model}
            enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
            enableFocusMode={enableFocusMode}
            enableRelationshipBrowser={enableRelationshipBrowser && hasLikec4model}
            // Apply where filter only in readonly mode
            whereFilter={readonly ? (where ?? null) : null}
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
              background={background}
              showDiagramTitle={showDiagramTitle}
            />
          </DiagramContextProvider>
        </XYFlowProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
LikeC4Diagram.displayName = 'LikeC4Diagram'

type LikeC4DiagramInnerProps = {
  background: NonNullable<LikeC4DiagramProperties['background']>
  showDiagramTitle: boolean
}
const LikeC4DiagramInnerMemo = /* @__PURE__ */ memo<LikeC4DiagramInnerProps>(function LikeC4DiagramInner({
  background,
  showDiagramTitle
}) {
  const {
    isInitialized,
    pannable,
    fitView,
    enableFocusMode,
    enableOverlays
  } = useDiagramState(s => ({
    isInitialized: s.initialized,
    pannable: s.pannable,
    fitView: s.fitViewEnabled,
    enableFocusMode: s.enableFocusMode,
    enableOverlays: s.hasLikeC4Model
      && (s.enableRelationshipBrowser || s.enableRelationshipDetails || s.enableElementDetails)
  }))

  return (
    <>
      <XYFlow
        className={clsx(
          'likec4-diagram',
          css.cssReactFlow,
          css.cssNoControls,
          pannable !== true && css.cssDisablePan,
          background === 'transparent' && css.cssTransparentBg,
          isInitialized ? 'initialized' : css.notInitialized
        )}
      >
        <XYFlowInner
          showDiagramTitle={showDiagramTitle}
          background={background}
        />
      </XYFlow>
      {enableOverlays && <Overlays />}
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
