import type { Any } from '@likec4/core/types'
import { type DependenciesComparator, useCustomCompareMemo } from '@react-hookz/web'
import { type FitViewOptions, ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { type PropsWithChildren, useRef } from 'react'
import { isPlainObject, mapValues } from 'remeda'
import { FitViewPaddings, MaxZoom, MinZoom } from './base'
import { RootContainer } from './components/RootContainer'
import {
  DiagramEventHandlers,
  DiagramFeatures,
  EnsureMantine,
  FramerMotionConfig,
  IconRendererProvider,
} from './context'
import { TagStylesProvider } from './context/TagStylesContext'
import { useId } from './hooks/useId'
import type {
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProperties,
  PaddingWithUnit,
  ViewPadding,
} from './LikeC4Diagram.props'
import { LikeC4DiagramUI } from './likec4diagram/DiagramUI'
import { LikeC4DiagramXYFlow } from './likec4diagram/DiagramXYFlow'
import { DiagramActorProvider } from './likec4diagram/state/DiagramActorProvider'
import type { Types } from './likec4diagram/types'
import { LikeC4Styles } from './LikeC4Styles'
import { getViewBounds } from './utils/get-view-bounds'

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
  onLayoutTypeChange,
  onInitialized,
  view,
  className,
  readonly = true,
  controls = !readonly,
  fitView = true,
  fitViewPadding: _fitViewPadding = controls ? FitViewPaddings.withControls : FitViewPaddings.default,
  pannable = true,
  zoomable = true,
  background = 'dots',
  enableElementTags = false,
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipDetails = false,
  enableRelationshipBrowser = false,
  enableCompareWithLatest = false,
  nodesDraggable = !readonly,
  nodesSelectable = !readonly || enableFocusMode || !!onNavigateTo || !!onNodeClick,
  enableNotations = false,
  showNavigationButtons = !!onNavigateTo,
  enableDynamicViewWalkthrough = false,
  dynamicViewVariant,
  enableSearch = false,
  initialWidth,
  initialHeight,
  reduceGraphics = 'auto',
  renderIcon,
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
    initialFitViewOptions?: FitViewOptions
    initialMinZoom: number
    initialMaxZoom: number
  }>(null)

  const bounds = getViewBounds(view, dynamicViewVariant)
  const fitViewPadding = useNormalizedViewPadding(_fitViewPadding)

  if (initialRef.current == null) {
    initialRef.current = {
      defaultEdges: [],
      defaultNodes: [],
      initialWidth: initialWidth ?? bounds.width,
      initialHeight: initialHeight ?? bounds.height,
      initialFitViewOptions: {
        maxZoom: MaxZoom,
        minZoom: MinZoom,
        padding: fitViewPadding,
      },
      initialMaxZoom: MaxZoom,
      initialMinZoom: MinZoom,
    }
  }

  const isReducedGraphicsMode = reduceGraphics === 'auto'
    // If view has more then 3000 * 2000 pixels - assume it is a big diagram
    // Enable reduced graphics mode if diagram is "big" and pannable, and has compounds
    ? pannable && ((bounds.width ?? 1) * (bounds.height ?? 1) > 6_000_000) &&
      view.nodes.some(n => n.children?.length > 0)
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
              enableNotations,
              enableVscode: !!onOpenSource,
              enableControls: controls,
              enableElementTags,
              enableCompareWithLatest,
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
                onLayoutTypeChange,
              }}>
              <LikeC4Styles id={id} />
              <TagStylesProvider rootSelector={`#${id}`}>
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
                      where={where ?? null}
                      dynamicViewVariant={dynamicViewVariant}
                    >
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
                    </DiagramActorProvider>
                  </XYFlowProvider>
                </RootContainer>
              </TagStylesProvider>
            </DiagramEventHandlers>
          </DiagramFeatures>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}

const toLiteralPaddingWithUnit = (value: PaddingWithUnit): PaddingWithUnit & string => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

/**
 * Converts number values to px and keep referential integrity
 */
function useNormalizedViewPadding(raw: ViewPadding): ViewPadding {
  return useCustomCompareMemo(
    () => {
      if (isPlainObject(raw)) {
        return mapValues(raw, toLiteralPaddingWithUnit)
      }
      return toLiteralPaddingWithUnit(raw)
    },
    [raw],
    compareViewPaddingObject,
  )
}
const compareViewPaddingObject: DependenciesComparator<[ViewPadding]> = ([a], [b]) => {
  return a === b ||
    (isPlainObject(a)
      && isPlainObject(b)
      && a.bottom == b.bottom
      && a.left == b.left
      && a.right == b.right
      && a.top == b.top)
}
