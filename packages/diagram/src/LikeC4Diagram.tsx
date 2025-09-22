import type { Any } from '@likec4/core/types'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { type PropsWithChildren, useRef } from 'react'
import { FitViewPaddings } from './base'
import { RootContainer } from './components/RootContainer'
import {
  DiagramEventHandlers,
  DiagramFeatures,
  EnsureMantine,
  FramerMotionConfig,
  IconRendererProvider,
} from './context'
import { ControlsCustomLayoutProvider } from './context/ControlsCustomLayout'
import { ReduceGraphicsContext } from './context/ReduceGraphics'
import { TagStylesProvider } from './context/TagStylesContext'
import { useId } from './hooks/useId'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from './LikeC4Diagram.props'
import { LikeC4DiagramUI } from './likec4diagram/DiagramUI'
import { LikeC4DiagramXYFlow } from './likec4diagram/DiagramXYFlow'
import { DiagramActorProvider } from './likec4diagram/state/DiagramActorProvider'
import type { Types } from './likec4diagram/types'
import { LikeC4Styles } from './LikeC4Styles'

export type LikeC4DiagramProps<A extends Any = Any> = PropsWithChildren<
  & LikeC4DiagramProperties<A>
  & LikeC4DiagramEventHandlers<A>
>

/**
 * Low-level component to display LikeC4 view
 * Expects CSS to be injected
 *
 * Use {@link ReactLikeC4} or {@link LikeC4View} for ready-to-use component
 */
export function LikeC4Diagram<A extends Any = Any>({
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
  onInitialized,
  view,
  className,
  readonly = true,
  controls = !readonly,
  fitView = true,
  fitViewPadding = controls ? FitViewPaddings.withControls : FitViewPaddings.default,
  pannable = true,
  zoomable = true,
  background = 'dots',
  enableElementTags = false,
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipDetails = false,
  enableRelationshipBrowser = false,
  nodesDraggable = !readonly,
  nodesSelectable = !readonly || enableFocusMode || !!onNavigateTo || !!onNodeClick,
  showNotations = true,
  showNavigationButtons = !!onNavigateTo,
  enableDynamicViewWalkthrough = false,
  dynamicViewVariant,
  enableSearch = false,
  initialWidth,
  initialHeight,
  experimentalEdgeEditing = !readonly,
  reduceGraphics = 'auto',
  renderIcon,
  renderControls,
  where,
  reactFlowProps,
  renderNodes,
  children,
}: LikeC4DiagramProps<A>) {
  const id = useId()
  const initialRef = useRef<{
    defaultNodes: Types.Node[]
    defaultEdges: Types.Edge[]
    initialWidth: number
    initialHeight: number
  }>(null)

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
              enableDynamicViewWalkthrough: view._type === 'dynamic' && enableDynamicViewWalkthrough,
              enableEdgeEditing: experimentalEdgeEditing,
              enableNotations: showNotations,
              enableVscode: !!onOpenSource,
              enableControls: controls,
              enableElementTags,
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
                onInitialized,
              }}>
              <LikeC4Styles id={id} />
              <TagStylesProvider rootSelector={`#${id}`}>
                <ReduceGraphicsContext reduceGraphics={isReducedGraphicsMode}>
                  <RootContainer id={id} className={className} reduceGraphics={isReducedGraphicsMode}>
                    <XYFlowProvider
                      fitView={fitView}
                      {...initialRef.current}
                    >
                      <DiagramActorProvider
                        view={view}
                        zoomable={zoomable}
                        pannable={pannable}
                        fitViewPadding={fitViewPadding}
                        nodesSelectable={nodesSelectable}
                        where={where ?? null}
                        dynamicViewVariant={dynamicViewVariant}
                      >
                        <ControlsCustomLayoutProvider value={renderControls ?? null}>
                          <LikeC4DiagramXYFlow
                            nodesDraggable={nodesDraggable}
                            nodesSelectable={nodesSelectable}
                            background={background}
                            reactFlowProps={reactFlowProps}
                            renderNodes={renderNodes}
                          >
                            {children}
                          </LikeC4DiagramXYFlow>
                          <LikeC4DiagramUI />
                        </ControlsCustomLayoutProvider>
                      </DiagramActorProvider>
                    </XYFlowProvider>
                  </RootContainer>
                </ReduceGraphicsContext>
              </TagStylesProvider>
            </DiagramEventHandlers>
          </DiagramFeatures>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
