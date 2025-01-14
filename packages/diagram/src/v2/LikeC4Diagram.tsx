import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { useRef } from 'react'
import { DiagramContainer, DiagramEventHandlers, DiagramFeatures, IconRendererProvider } from '../context'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useLikeC4Model } from '../likec4model'
import { EnsureMantine } from '../ui/EnsureMantine'
import { FramerMotionConfig } from '../ui/FramerMotionConfig'
import { DiagramActor } from './DiagramActor'
import { LikeC4DiagramXYFlow } from './LikeC4DiagramXYFlow'
import type { Types } from './types'
import { useNodeEdgesFromDiagram } from './useNodeEdgesFromDiagram'

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4DiagramV2({
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

  const enableNavigateTo = !!onNavigateTo

  const xyNodesEdges = useNodeEdgesFromDiagram({
    view,
    where,
    nodesDraggable,
    nodesSelectable,
  })

  if (initialRef.current == null) {
    initialRef.current = {
      defaultNodes: xyNodesEdges.xynodes,
      defaultEdges: xyNodesEdges.xyedges,
      initialWidth: initialWidth ?? view.bounds.width,
      initialHeight: initialHeight ?? view.bounds.height,
    }
  }

  // useEffect(() => {
  //   if (readonly !== true && where != null) {
  //     console.warn('Ignore filter, supported in readonly mode only\n', { where })
  //   }
  //   if (hasLikec4model) {
  //     return
  //   }
  //   if (enableRelationshipDetails) {
  //     console.warn('Invalid showRelationshipDetails=true, requires LikeC4ModelProvider')
  //   }
  //   if (enableElementDetails) {
  //     console.warn('Invalid enableElementDetails=true, requires LikeC4ModelProvider')
  //   }
  //   if (enableRelationshipBrowser) {
  //     console.warn('Invalid enableRelationshipBrowser=true, requires LikeC4ModelProvider')
  //   }
  // })

  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <IconRendererProvider value={renderIcon ?? null}>
          <DiagramContainer>
            <XYFlowProvider
              fitView={fitView}
              {...initialRef.current}
            >
              <DiagramFeatures
                features={{
                  enableFocusMode,
                  enableNavigateTo,
                  enableElementDetails,
                  enableRelationshipDetails,
                  enableRelationshipBrowser,
                  enableSearch,
                  enableNavigationButtons: showNavigationButtons,
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
                  <DiagramActor
                    input={{
                      view,
                      ...xyNodesEdges,
                      pannable,
                      zoomable,
                      fitViewPadding,
                    }}>
                    <LikeC4DiagramXYFlow
                      nodesDraggable={nodesDraggable}
                      nodesSelectable={nodesSelectable}
                      background={background}
                      initialHeight={initialRef.current.initialHeight}
                      initialWidth={initialRef.current.initialWidth}
                    />
                  </DiagramActor>
                </DiagramEventHandlers>
              </DiagramFeatures>
            </XYFlowProvider>
          </DiagramContainer>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
