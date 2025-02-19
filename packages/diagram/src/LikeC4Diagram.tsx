import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { useRef } from 'react'
import { isEmpty } from 'remeda'
import {
  DiagramEventHandlers,
  DiagramFeatures,
  EnsureMantine,
  FramerMotionConfig,
  IconRendererProvider,
  RootContainer,
} from './context'
import { LikeC4CustomColors } from './LikeC4CustomColors'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { DiagramActor } from './likec4diagram/DiagramActor'
import type { Types } from './likec4diagram/types'
import { useViewToNodesEdges } from './likec4diagram/useViewToNodesEdges'
import { LikeC4DiagramXYFlow } from './likec4diagram/XYFlow'
import { useLikeC4Model } from './likec4model'

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4Diagram({
  view,
  className,
  fitView = true,
  fitViewPadding = 0,
  readonly = true,
  pannable = true,
  zoomable = true,
  background = 'dots',
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipDetails = enableElementDetails,
  enableRelationshipBrowser = enableRelationshipDetails,
  nodesSelectable = !readonly || enableFocusMode,
  nodesDraggable = !readonly,
  controls = !readonly,
  showDiagramTitle = true,
  showNotations = true,
  enableDynamicViewWalkthrough = false,
  enableSearch = true,
  initialWidth,
  initialHeight,
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
  onOpenSource,
  onBurgerMenuClick,
  renderIcon,
  where,
  showNavigationButtons = !!onNavigateTo,
}: LikeC4DiagramProps) {
  const hasLikec4model = !!useLikeC4Model()
  const initialRef = useRef<{
    defaultNodes: Types.Node[]
    defaultEdges: Types.Edge[]
    initialWidth: number
    initialHeight: number
  }>(null)

  const xyNodesEdges = useViewToNodesEdges({
    view,
    where,
    nodesSelectable,
  })

  const isDynamicView = view.__ === 'dynamic'

  if (initialRef.current == null) {
    initialRef.current = {
      defaultEdges: [],
      defaultNodes: [],
      initialWidth: initialWidth ?? view.bounds.width,
      initialHeight: initialHeight ?? view.bounds.height,
    }
  }

  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <IconRendererProvider value={renderIcon ?? null}>
          <DiagramFeatures
            features={{
              enableFitView: fitView,
              enableReadOnly: readonly,
              enableFocusMode,
              enableNavigateTo: !!onNavigateTo,
              enableElementDetails,
              enableRelationshipDetails,
              enableRelationshipBrowser,
              enableSearch,
              enableNavigationButtons: showNavigationButtons && !!onNavigateTo,
              enableDynamicViewWalkthrough: isDynamicView && enableDynamicViewWalkthrough,
              enableEdgeEditing: experimentalEdgeEditing,
              enableNotations: showNotations,
              enableVscode: !!onOpenSource,
              enableControls: controls,
              enableViewTitle: showDiagramTitle,
              enableLikeC4Model: hasLikec4model,
            }}
          >
            <DiagramEventHandlers
              handlers={{
                onCanvasClick,
                onCanvasContextMenu,
                onCanvasDblClick,
                onEdgeClick,
                onChange,
                onEdgeContextMenu,
                onNavigateTo,
                onNodeClick,
                onNodeContextMenu,
                onOpenSource,
                onBurgerMenuClick,
              }}>
              <RootContainer className={className}>
                {!isEmpty(view.customColorDefinitions) && (
                  <LikeC4CustomColors customColors={view.customColorDefinitions} />
                )}
                <XYFlowProvider
                  fitView={fitView}
                  {...initialRef.current}
                >
                  <DiagramActor
                    input={{
                      view,
                      pannable,
                      zoomable,
                      fitViewPadding,
                      ...xyNodesEdges,
                    }}>
                    <LikeC4DiagramXYFlow
                      nodesDraggable={nodesDraggable}
                      nodesSelectable={nodesSelectable}
                      background={background}
                    />
                  </DiagramActor>
                </XYFlowProvider>
              </RootContainer>
            </DiagramEventHandlers>
          </DiagramFeatures>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
