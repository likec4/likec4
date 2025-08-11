import { autoPlacement, autoUpdate, computePosition, hide, offset, size } from '@floating-ui/dom'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramEdge, DiagramNode, EdgeId } from '@likec4/core/types'
import { nameFromFqn } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, VStack } from '@likec4/styles/jsx'
import { bleed } from '@likec4/styles/patterns'
import {
  ActionIcon,
  Button,
  Divider,
  Portal,
  ScrollAreaAutosize,
  Space,
  Text,
  Tooltip as MantineTooltip,
  TooltipGroup,
} from '@mantine/core'
import { IconArrowRight, IconFileSymlink, IconZoomScan } from '@tabler/icons-react'
import { useActorRef, useSelector } from '@xstate/react'
import {
  type MouseEvent,
  type MouseEventHandler,
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { clamp, filter, isTruthy, map, partition, pipe } from 'remeda'
import { Link } from '../../components/Link'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { IfEnabled, useEnabledFeatures } from '../../context/DiagramFeatures'
import { MarkdownBlock } from '../../custom'
import { useDiagram, useDiagramContext, useOnDiagramEvent } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import { type XYStoreState, useXYStore } from '../../hooks/useXYFlow'
import type { LikeC4DiagramEventHandlers } from '../../LikeC4Diagram.props'
import { useLikeC4Model } from '../../likec4model'
import type { DiagramContext } from '../../state/types'
import { findDiagramEdge, findDiagramNode } from '../../state/utils'
import { roundDpr } from '../../utils'
import { RelationshipPopoverActorLogic } from './actor'
import * as styles from './styles.css'

function selectDiagramContext(c: DiagramContext) {
  let selected: EdgeId | null = null
  for (const edge of c.xyedges) {
    if (edge.selected) {
      if (selected) {
        selected = null
        break
      }
      selected = edge.data.id
    }
  }
  return {
    viewId: c.view.id,
    selected,
  }
}

export const RelationshipPopover = memo(() => {
  const actorRef = useActorRef(RelationshipPopoverActorLogic)
  const diagram = useDiagram()
  const { viewId, selected } = useDiagramContext(selectDiagramContext)

  const openedEdgeId = useSelector(actorRef, s => s.hasTag('opened') ? s.context.edgeId : null)

  useUpdateEffect(() => {
    actorRef.send({ type: 'close' })
  }, [viewId])

  useOnDiagramEvent('edgeMouseEnter', ({ edge }) => {
    actorRef.send({ type: 'xyedge.mouseEnter', edgeId: edge.data.id })
  })

  useOnDiagramEvent('edgeMouseLeave', () => {
    actorRef.send({ type: 'xyedge.mouseLeave' })
  })

  useOnDiagramEvent('edgeEditingStarted', () => {
    actorRef.send({ type: 'close' })
  })

  useUpdateEffect(() => {
    if (selected) {
      actorRef.send({ type: 'xyedge.select', edgeId: selected })
    } else {
      actorRef.send({ type: 'xyedge.unselect' })
    }
  }, [selected])

  const onMouseEnter = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!openedEdgeId) {
      return
    }
    actorRef.send({ type: 'dropdown.mouseEnter' })
    const edge = diagram.findEdge(openedEdgeId)
    if (edge && !edge.data.hovered) {
      diagram.send({ type: 'xyflow.edgeMouseEnter', edge, event })
    }
  }, [actorRef, diagram, openedEdgeId])

  const onMouseLeave = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!openedEdgeId) {
      return
    }
    actorRef.send({ type: 'dropdown.mouseLeave' })
    const edge = diagram.findEdge(openedEdgeId)
    if (edge?.data.hovered) {
      diagram.send({ type: 'xyflow.edgeMouseLeave', edge, event })
    }
  }, [actorRef, diagram, openedEdgeId])

  const { diagramEdge, sourceNode, targetNode } = useDiagramContext(
    ctx => {
      const diagramEdge = openedEdgeId ? findDiagramEdge(ctx, openedEdgeId) : null
      const sourceNode = diagramEdge ? findDiagramNode(ctx, diagramEdge.source) : null
      const targetNode = diagramEdge ? findDiagramNode(ctx, diagramEdge.target) : null
      return ({
        diagramEdge,
        sourceNode,
        targetNode,
      })
    },
    undefined,
    [openedEdgeId],
  )

  if (!diagramEdge || diagramEdge.relations.length === 0 || !sourceNode || !targetNode) {
    return null
  }

  return (
    <RelationshipPopoverInternal
      diagramEdge={diagramEdge}
      sourceNode={sourceNode}
      targetNode={targetNode}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave} />
  )
})

const getEdgeLabelElement = (edgeId: string, container: HTMLDivElement | undefined) => {
  return container?.querySelector<HTMLDivElement>(`.likec4-edge-label__root[data-edge-id="${edgeId}"]`) ?? null
}

const selectTransform = (s: XYStoreState) =>
  roundDpr(s.transform[0]) + ' ' + roundDpr(s.transform[1]) + ' ' + s.transform[2].toFixed(3)

type RelationshipPopoverInternalProps = {
  diagramEdge: DiagramEdge
  sourceNode: DiagramNode
  targetNode: DiagramNode
  onMouseEnter: MouseEventHandler<HTMLDivElement>
  onMouseLeave: MouseEventHandler<HTMLDivElement>
}
const RelationshipPopoverInternal = forwardRef<HTMLDivElement, RelationshipPopoverInternalProps>(
  ({ diagramEdge, sourceNode, targetNode, onMouseEnter, onMouseLeave }, _ref) => {
    const ref = useRef<HTMLDivElement>(null)
    const { enableNavigateTo } = useEnabledFeatures()
    const { onOpenSource } = useDiagramEventHandlers()

    const { portalProps } = useMantinePortalProps()

    const [referenceEl, setReferenceEl] = useState<HTMLDivElement | null>(null)
    const viewport = useXYStore(selectTransform)

    useEffect(() => {
      setReferenceEl(getEdgeLabelElement(diagramEdge.id, portalProps?.target))
    }, [diagramEdge, viewport])

    useEffect(() => {
      const reference = referenceEl
      const popper = ref.current
      if (!reference || !popper) {
        return
      }

      const update = () => {
        computePosition(reference, popper, {
          placement: 'bottom',
          middleware: [
            offset(4),
            autoPlacement({
              padding: 16,
              allowedPlacements: [
                'bottom-start',
                'bottom-end',
                'top-start',
                'top-end',
                'right-start',
                'right-end',
                'left-start',
                'left-end',
              ],
            }),
            size({
              padding: 16,
              apply({ availableHeight, availableWidth, elements }) {
                Object.assign(elements.floating.style, {
                  maxWidth: `${clamp(roundDpr(availableWidth), { min: 0, max: 400 })}px`,
                  maxHeight: `${clamp(roundDpr(availableHeight), { min: 0, max: 500 })}px`,
                })
              },
            }),
            hide({
              padding: 16,
            }),
          ],
        }).then(({ x, y, middlewareData }) => {
          popper.style.transform = `translate(${roundDpr(x)}px, ${roundDpr(y)}px)`
          popper.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible'
        })
      }
      return autoUpdate(reference, popper, update)
    }, [referenceEl])

    const likec4model = useLikeC4Model()
    const diagram = useDiagram()

    const [direct, nested] = pipe(
      diagramEdge.relations,
      map(id => {
        try {
          return likec4model.findRelationship(id)
        } catch (e) {
          // View was cached, but likec4model based on new data
          console.error(
            `View is cached and likec4model missing relationship ${id} from ${sourceNode.id} -> ${targetNode.id}`,
            e,
          )
          return null
        }
      }),
      filter(isTruthy),
      partition(r => r.source.id === sourceNode.id && r.target.id === targetNode.id),
    )

    const renderRelationship = (relationship: LikeC4Model.AnyRelation, index: number) => (
      <Fragment key={relationship.id}>
        {index > 0 && <Divider />}
        <Relationship
          relationship={relationship}
          sourceNode={sourceNode}
          targetNode={targetNode}
          edge={diagramEdge}
          enableNavigateTo={enableNavigateTo}
          onOpenSource={onOpenSource}
        />
      </Fragment>
    )

    return (
      <Portal {...portalProps}>
        <ScrollAreaAutosize
          ref={ref}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          type="auto"
          overscrollBehavior="contain"
          scrollbars={'y'}
          scrollbarSize={6}
          className={cx(
            'nowheel nopan',
            css({
              layerStyle: 'likec4.dropdown',
              p: '0',
              pointerEvents: 'all',
              position: 'absolute',
              top: '0',
              left: '0',
              width: 'max-content',
              cursor: 'default',
            }),
          )}
        >
          <VStack
            css={{
              gap: '3',
              padding: '4',
              paddingTop: '2.5',
            }}
          >
            <Button
              variant="default"
              color="gray"
              size="compact-xs"
              style={{
                alignSelf: 'flex-start',
                fontWeight: 500,
                ['--button-fz']: 'var(--font-sizes-xxs)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                diagram.openRelationshipDetails(diagramEdge.id)
              }}
            >
              browse relationships
            </Button>
            {direct.length > 0 && (
              <>
                <Divider label={<Label>direct relationships</Label>} labelPosition="left" />
                {direct.map(renderRelationship)}
              </>
            )}
            {nested.length > 0 && (
              <>
                {direct.length > 0 && <Space />}
                <Divider label={<Label>resolved from nested</Label>} labelPosition="left" />
                {nested.map(renderRelationship)}
              </>
            )}
          </VStack>
        </ScrollAreaAutosize>
      </Portal>
    )
  },
)

const Relationship = forwardRef<
  HTMLDivElement,
  {
    relationship: LikeC4Model.AnyRelation
    edge: DiagramEdge
    sourceNode: DiagramNode
    targetNode: DiagramNode
    enableNavigateTo: boolean
    onOpenSource: LikeC4DiagramEventHandlers['onOpenSource']
  }
>(({
  relationship: r,
  edge,
  sourceNode,
  targetNode,
  enableNavigateTo,
  onOpenSource,
  ...props
}, ref) => {
  const diagram = useDiagram()
  const viewId = diagram.currentView.id

  const sourceId = getShortId(r, r.source.id, sourceNode)
  const targetId = getShortId(r, r.target.id, targetNode)
  const navigateTo = enableNavigateTo && r.navigateTo?.id !== viewId ? r.navigateTo?.id : undefined
  const links = r.links

  return (
    <VStack
      ref={ref}
      className={bleed({
        block: '2',
        inline: '2',
        paddingBlock: '2',
        paddingInline: '2',
        gap: '1',
        rounded: 'sm',
        backgroundColor: {
          _hover: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]/70',
          },
        },
      })}
    >
      <HStack gap={'0.5'}>
        <Text component="div" data-likec4-color={sourceNode.color} className={styles.endpoint}>
          {sourceId}
        </Text>
        <IconArrowRight stroke={2.5} size={'11px'} opacity={0.65} />
        <Text component="div" data-likec4-color={targetNode.color} className={styles.endpoint}>
          {targetId}
        </Text>
        {(navigateTo || !!onOpenSource) && (
          <TooltipGroup openDelay={100}>
            {navigateTo && (
              <Tooltip label={'Open dynamic view'}>
                <ActionIcon
                  className={cx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onClick={event => {
                    event.stopPropagation()
                    diagram.navigateTo(navigateTo)
                  }}
                  style={{
                    alignSelf: 'flex-end',
                  }}
                  role="button"
                >
                  <IconZoomScan size="80%" stroke={2} />
                </ActionIcon>
              </Tooltip>
            )}
            <IfEnabled feature="Vscode">
              <Tooltip label={'Open source'}>
                <ActionIcon
                  className={cx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onClick={event => {
                    event.stopPropagation()
                    diagram.openSource({ relation: r.id })
                  }}
                  role="button"
                >
                  <IconFileSymlink size="80%" stroke={2} />
                </ActionIcon>
              </Tooltip>
            </IfEnabled>
          </TooltipGroup>
        )}
      </HStack>
      <Box className={styles.title}>{r.title || 'untitled'}</Box>
      {r.kind && (
        <HStack gap="2">
          <Label>kind</Label>
          <Text size="xs">{r.kind}</Text>
        </HStack>
      )}
      {r.technology && (
        <HStack gap="2">
          <Label>technology</Label>
          <Text size="xs">{r.technology}</Text>
        </HStack>
      )}
      {r.description.nonEmpty && (
        <>
          <Label>description</Label>
          <Box
            css={{
              paddingLeft: '2.5',
              py: '1.5',
              borderLeft: '2px dotted',
              borderLeftColor: {
                base: 'mantine.colors.gray[3]',
                _dark: 'mantine.colors.dark[4]',
              },
            }}
          >
            <MarkdownBlock value={r.description} fontSize={'sm'} />
          </Box>
        </>
      )}
      {links.length > 0 && (
        <>
          <Label>links</Label>
          <HStack gap="1" flexWrap={'wrap'}>
            {links.map((link) => <Link key={link.url} size="sm" value={link} />)}
          </HStack>
        </>
      )}
    </VStack>
  )
})

const Label = styled('span', {
  base: {
    display: 'inline-block',
    fontSize: 'xxs',
    fontWeight: 500,
    userSelect: 'none',
    lineHeight: '[1.11]',
    color: 'mantine.colors.dimmed',
  },
})

const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  label: '',
  children: null,
  offset: 8,
  withinPortal: false,
})

function getShortId(
  r: LikeC4Model.AnyRelation,
  actualEndpointId: string,
  diagramNode: DiagramNode,
) {
  const diagramNodeId = r.isDeploymentRelation()
    // Relation defined in deployment model. Use id of the deployment node as is.
    ? diagramNode.id
    // Relation defined in model. Get id of the model element
    : diagramNode.modelRef || ''

  return nameFromFqn(diagramNodeId) + actualEndpointId.slice(diagramNodeId.length)
}
