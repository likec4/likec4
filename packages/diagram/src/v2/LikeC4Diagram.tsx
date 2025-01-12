import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import {
  ReactFlowProvider as XYFlowProvider,
} from '@xyflow/react'
import { fitView } from '@xyflow/system'
import { useCallback, useMemo, useRef, useTransition } from 'react'
import { type NodeProps, BaseXYFlow, DiagramContainer, DiagramEventHandlers, IconRendererProvider } from '../base'
import { useDiagramEventHandlers } from '../base/context/DiagramEventHandlers'
import {
  ActionButtons,
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  DefaultHandles,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../base/primitives'
import { type LikeC4DiagramEventHandlers, type LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useLikeC4Model } from '../likec4model'
import { EnsureMantine } from '../ui/EnsureMantine'
import { FramerMotionConfig } from '../ui/FramerMotionConfig'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'
import { FitViewOnDiagramChange } from './FitviewOnDiagramChange'
import { RelationshipEdge } from './RelationshipEdge'
import { type Context, StoreProvider, useDiagramContext } from './store'
import type { Types } from './types'
import { useDiagram } from './useDiagram'

export type LikeC4DiagramProps = LikeC4DiagramProperties & LikeC4DiagramEventHandlers
export function LikeC4DiagramV2({
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
  enableRelationshipDetails = enableElementDetails,
  enableRelationshipBrowser = enableRelationshipDetails,
  enableSearch = true,
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

  if (initialRef.current == null) {
    const data = diagramViewToXYFlowData(view, {
      whereFilter: where ?? null,
      nodesDraggable,
      nodesSelectable,
    })
    initialRef.current = {
      defaultNodes: data.xynodes,
      defaultEdges: data.xyedges,
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
          <XYFlowProvider
            fitView={fitView}
            {...initialRef.current}
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
              <DiagramContainer>
                <StoreProvider
                  input={{
                    view,
                    nodesDraggable,
                    nodesSelectable,
                    pannable,
                    zoomable,
                    fitViewPadding,
                    whereFilter: where ?? null,
                  }}>
                  <XYFlow
                    enableRelationshipBrowser={enableRelationshipBrowser}
                    background={background}
                  />
                </StoreProvider>
              </DiagramContainer>
            </DiagramEventHandlers>
          </XYFlowProvider>
        </IconRendererProvider>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}

const selectXYProps = (ctx: Context) => ({
  initialized: ctx.initialized,
  nodesDraggable: ctx.nodesDraggable,
  nodesSelectable: ctx.nodesSelectable,
  pannable: ctx.pannable,
  zoomable: ctx.zoomable,
  fitViewPadding: ctx.fitViewPadding,
})

const XYFlow = ({
  background = 'dots',
  enableRelationshipBrowser = true,
}: Pick<LikeC4DiagramProps, 'background' | 'enableRelationshipBrowser'>) => {
  const { fitDiagram, actor } = useDiagram()
  const {
    initialized,
    ...props
  } = useDiagramContext(selectXYProps)
  const nodeTypes = useMemo(() => ({
    element: customNode<Types.ElementNodeData>((props) => (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <ElementActions enableRelationshipBrowser={enableRelationshipBrowser} {...props} />
        <DefaultHandles />
      </ElementNodeContainer>
    )),
    deployment: customNode<Types.DeploymentElementNodeData>((props) => (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <DefaultHandles />
      </ElementNodeContainer>
    )),
    'compound-element': customNode<Types.CompoundElementNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
    'compound-deployment': customNode<Types.CompoundDeploymentNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
    'view-group': customNode<Types.ViewGroupNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
  } satisfies { [key in Types.Node['type']]: any }), [enableRelationshipBrowser])

  const edgeTypes = useMemo(() => ({
    relationship: RelationshipEdge,
  } satisfies { [key in Types.Edge['type']]: any }), [])

  return (
    <BaseXYFlow<Types.Node, Types.Edge>
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      actorRef={actor}
      background={background}
      // Fitview is handled in onInit
      fitView={false}
      onNodeClick={useCallback((_, node) => {
        actor.send({ type: 'onNodeClick', node })
      }, [actor])}
      onMoveEnd={useCallback((event, _viewport) => {
        // if event is present, the move was triggered by user
        const viewportChanged = !!event
        if (actor.getSnapshot().context.viewportChangedManually !== viewportChanged) {
          actor.send({ type: 'onViewportChange', manually: viewportChanged })
        }
      }, [])}
      onInit={() => {
        actor.send({ type: 'onInit' })
        fitDiagram(0)
      }}
      {...props}
    >
      {initialized && <FitViewOnDiagramChange />}
    </BaseXYFlow>
  )
}

type ElementActionsProps = NodeProps<Types.ElementNodeData> & {
  enableRelationshipBrowser: boolean
}
const ElementActions = ({ enableRelationshipBrowser, ...props }: ElementActionsProps) => {
  const { onNavigateTo } = useDiagramEventHandlers()
  const [, startTransition] = useTransition()

  const buttons = [] as ActionButtons.Item[]

  const { navigateTo, fqn } = props.data
  if (navigateTo && onNavigateTo) {
    buttons.push({
      key: 'navigate',
      icon: <IconZoomScan />,
      onClick: (e) => {
        e.stopPropagation()
        startTransition(() => {
          onNavigateTo(navigateTo, e)
        })
      },
    })
  }
  if (enableRelationshipBrowser) {
    buttons.push({
      key: 'relationships',
      icon: <IconTransform />,
      onClick: (e) => {
        e.stopPropagation()
        // store.getState().openOverlay({ relationshipsOf: fqn })
      },
    })
  }
  return (
    <ActionButtons
      buttons={buttons}
      {...props}
    />
  )
}
