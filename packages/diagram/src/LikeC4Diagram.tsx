import type { Any } from '@likec4/core/types'
import { useCustomCompareMemo } from '@react-hookz/web'
import { type FitViewOptions, ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { type PropsWithChildren, Profiler, useRef } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { isEmptyish, isPlainObject, mapValues } from 'remeda'
import { FitViewPaddings, MaxZoom, MinZoom } from './base'
import { RootContainer } from './components/RootContainer'
import {
  DiagramEventHandlers,
  DiagramFeatures,
  EnsureMantine,
  FramerMotionConfig,
  IconRendererProvider,
} from './context'
import { CurrentViewModelProvider } from './context/CurrentViewModelProvider'
import { TagStylesProvider } from './context/TagStylesContext'
import { useOptionalLikeC4Editor } from './editor'
import { useId } from './hooks/useId'
import { useOptionalLikeC4Model } from './hooks/useLikeC4Model'
import type {
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProperties,
  PaddingWithUnit,
  ViewPadding,
  ViewPaddings,
} from './LikeC4Diagram.props'
import { LikeC4DiagramUI } from './likec4diagram/DiagramUI'
import { LikeC4DiagramXYFlow } from './likec4diagram/DiagramXYFlow'
import { DiagramActorProvider } from './likec4diagram/state/DiagramActorProvider'
import type { Types } from './likec4diagram/types'
import { LikeC4Styles } from './LikeC4Styles'
import { pickViewBounds } from './utils/view-bounds'

export type LikeC4DiagramProps<A extends Any = Any> = PropsWithChildren<
  & LikeC4DiagramProperties<A>
  & LikeC4DiagramEventHandlers<A>
>

const noop = () => {}

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
  onEdgeContextMenu,
  onNavigateTo,
  onNodeClick,
  onNodeContextMenu,
  onOpenSource,
  onLogoClick,
  onLayoutTypeChange,
  onInitialized,
  view,
  className,
  controls = true,
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
  enableCompareWithLatest = !!onLayoutTypeChange,
  nodesSelectable,
  enableNotations = false,
  showNavigationButtons = !!onNavigateTo,
  enableDynamicViewWalkthrough = false,
  dynamicViewVariant,
  enableSearch = false,
  enableNotes = true,
  initialWidth,
  initialHeight,
  reduceGraphics = 'auto',
  renderIcon,
  where,
  reactFlowProps,
  renderNodes,
  children,
}: LikeC4DiagramProps<A>): JSX.Element {
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

  // Enable compare with latest if there are manual layouts
  const optionalLikeC4Model = useOptionalLikeC4Model()
  enableCompareWithLatest = enableCompareWithLatest &&
    !!onLayoutTypeChange &&
    !!optionalLikeC4Model &&
    !isEmptyish(optionalLikeC4Model.$data.manualLayouts)

  const hasLikeC4Model = !!optionalLikeC4Model
  const hasEditor = !!useOptionalLikeC4Editor()
  const readonly = !hasEditor

  nodesSelectable ??= hasEditor || enableFocusMode || !!onNavigateTo || !!onNodeClick

  const bounds = pickViewBounds(view, dynamicViewVariant)
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
    // If view has more then 4000 * 4000 pixels - assume it is a big diagram
    // Enable reduced graphics mode if diagram is "big" and pannable, and has compounds
    ? pannable && ((view.bounds.width * view.bounds.height) > 16_000_000) &&
      view.nodes.some(n => n.children?.length > 0)
    : reduceGraphics

  return (
    <Profiler id="LikeC4Diagram" onRender={noop}>
      <EnsureMantine>
        <FramerMotionConfig reducedMotion={isReducedGraphicsMode ? 'always' : undefined}>
          <IconRendererProvider value={renderIcon ?? null}>
            <DiagramFeatures
              features={{
                enableFitView: fitView,
                enableEditor: hasEditor,
                enableReadOnly: readonly,
                enableFocusMode,
                enableNavigateTo: !!onNavigateTo,
                enableElementDetails: enableElementDetails && hasLikeC4Model,
                enableRelationshipDetails: enableRelationshipDetails && hasLikeC4Model,
                enableRelationshipBrowser: enableRelationshipBrowser && hasLikeC4Model,
                enableSearch: enableSearch && hasLikeC4Model,
                enableNavigationButtons: showNavigationButtons && !!onNavigateTo,
                enableDynamicViewWalkthrough: view._type === 'dynamic' && enableDynamicViewWalkthrough,
                enableNotations,
                enableVscode: !!onOpenSource,
                enableControls: controls,
                enableElementTags,
                enableCompareWithLatest,
                enableNotes,
              }}
            >
              <DiagramEventHandlers
                handlers={{
                  onCanvasClick,
                  onCanvasContextMenu,
                  onCanvasDblClick,
                  onEdgeClick,
                  onEdgeContextMenu,
                  onNavigateTo,
                  onNodeClick,
                  onNodeContextMenu,
                  onOpenSource,
                  onLogoClick,
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
                        id={id}
                        view={view}
                        zoomable={zoomable}
                        pannable={pannable}
                        fitViewPadding={fitViewPadding}
                        nodesDraggable={hasEditor}
                        nodesSelectable={nodesSelectable}
                        where={where ?? null}
                        dynamicViewVariant={dynamicViewVariant}
                      >
                        <CurrentViewModelProvider>
                          <LikeC4DiagramXYFlow
                            background={background}
                            reactFlowProps={reactFlowProps}
                            renderNodes={renderNodes}
                          >
                            {children}
                          </LikeC4DiagramXYFlow>
                          <LikeC4DiagramUI />
                        </CurrentViewModelProvider>
                      </DiagramActorProvider>
                    </XYFlowProvider>
                  </RootContainer>
                </TagStylesProvider>
              </DiagramEventHandlers>
            </DiagramFeatures>
          </IconRendererProvider>
        </FramerMotionConfig>
      </EnsureMantine>
    </Profiler>
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
function useNormalizedViewPadding(raw: ViewPadding): ViewPaddings {
  return useCustomCompareMemo(
    () => {
      if (isPlainObject(raw)) {
        return mapValues(raw, toLiteralPaddingWithUnit)
      }
      const v = toLiteralPaddingWithUnit(raw)
      return {
        x: v,
        y: v,
      }
    },
    [raw],
    deepEqual,
  )
}
