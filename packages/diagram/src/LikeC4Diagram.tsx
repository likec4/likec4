import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { type PropsWithChildren, useRef } from 'react'
import { isEmpty } from 'remeda'
import {
  DiagramEventHandlers,
  DiagramFeatures,
  EnsureMantine,
  FramerMotionConfig,
  IconRendererProvider,
  RootContainer,
} from './context'
import { ControlsCustomLayoutProvider } from './context/ControlsCustomLayout'
import { ReduceGraphicsContext } from './context/ReduceGraphics'
import { LikeC4CustomColors } from './LikeC4CustomColors'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { LikeC4DiagramXYFlow } from './likec4diagram/DiagramXYFlow'
import type { Types } from './likec4diagram/types'
import { useViewToNodesEdges } from './likec4diagram/useViewToNodesEdges'
import { useLikeC4Model } from './likec4model'
import { DiagramActorProvider } from './state/DiagramActorProvider'

export type LikeC4DiagramProps = PropsWithChildren<LikeC4DiagramProperties & LikeC4DiagramEventHandlers>
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
  reduceGraphics = 'auto',
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
  renderControls,
  where,
  showNavigationButtons = !!onNavigateTo,
  children,
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

  const isReducedGraphicsMode = reduceGraphics === 'auto'
    // If view has more then 3000 * 2000 pixels - assume it is a big diagram
    // Enable reduced graphics mode if diagram is "big" and pannable
    ? pannable && ((view.bounds?.width ?? 1) * (view.bounds?.height ?? 1) > 6_000_000)
    : reduceGraphics

  return (
    <EnsureMantine>
      <FramerMotionConfig
        {...isReducedGraphicsMode && { reducedMotion: 'always' }}
      >
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
              <ReduceGraphicsContext reduceGraphics={isReducedGraphicsMode}>
                <RootContainer className={className} reduceGraphics={isReducedGraphicsMode}>
                  {!isEmpty(view.customColorDefinitions) && (
                    <LikeC4CustomColors customColors={view.customColorDefinitions} />
                  )}
                  <XYFlowProvider
                    fitView={fitView}
                    {...initialRef.current}
                  >
                    <DiagramActorProvider
                      input={{
                        view,
                        pannable,
                        zoomable,
                        fitViewPadding,
                        ...xyNodesEdges,
                      }}>
                      <ControlsCustomLayoutProvider value={renderControls ?? null}>
                        <LikeC4DiagramXYFlow
                          nodesDraggable={nodesDraggable}
                          nodesSelectable={nodesSelectable}
                          background={background}
                        >
                          {children}
                        </LikeC4DiagramXYFlow>
                      </ControlsCustomLayoutProvider>
                    </DiagramActorProvider>
                  </XYFlowProvider>
                </RootContainer>
              </ReduceGraphicsContext>
            </DiagramEventHandlers>
          </DiagramFeatures>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
