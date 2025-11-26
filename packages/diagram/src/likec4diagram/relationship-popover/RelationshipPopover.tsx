// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2025 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { autoPlacement, autoUpdate, computePosition, hide, offset, size } from '@floating-ui/dom'
import { nameFromFqn } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramEdge, DiagramNode, EdgeId, ViewId } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, VStack } from '@likec4/styles/jsx'
import { bleed } from '@likec4/styles/patterns'
import {
  ActionIcon,
  Button,
  Divider,
  ScrollAreaAutosize,
  Text,
  Tooltip as MantineTooltip,
  TooltipGroup,
} from '@mantine/core'
import { IconArrowRight, IconFileSymlink, IconInfoCircle, IconZoomScan } from '@tabler/icons-react'
import { useActorRef, useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import {
  type MouseEvent,
  type MouseEventHandler,
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { clamp, entries, filter, isEmpty, isTruthy, map, partition, pipe } from 'remeda'
import { Markdown } from '../../base-primitives'
import { Link } from '../../components/Link'
import { PortalToContainer } from '../../components/PortalToContainer'
import { useRootContainerRef } from '../../context'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import type { DiagramContext } from '../../hooks/useDiagram'
import { useDiagram, useDiagramContext, useOnDiagramEvent } from '../../hooks/useDiagram'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { roundDpr } from '../../utils'
import { findDiagramEdge, findDiagramNode } from '../state/utils'
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
  const likec4model = useLikeC4Model()
  const actorRef = useActorRef(RelationshipPopoverActorLogic)
  const diagram = useDiagram()
  const { viewId, selected } = useDiagramContext(selectDiagramContext)

  const openedEdgeId = useSelector(actorRef, s => s.hasTag('opened') ? s.context.edgeId : null)

  useOnDiagramEvent('navigateTo', () => {
    actorRef.send({ type: 'close' })
  })

  useOnDiagramEvent('edgeMouseEnter', ({ edge }) => {
    actorRef.send({ type: 'xyedge.mouseEnter', edgeId: edge.data.id })
  })

  useOnDiagramEvent('edgeMouseLeave', () => {
    actorRef.send({ type: 'xyedge.mouseLeave' })
  })

  useOnDiagramEvent('walkthroughStarted', () => {
    actorRef.send({ type: 'close' })
  })

  useEffect(() => {
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
    shallowEqual,
    [openedEdgeId],
  )

  if (!diagramEdge || !sourceNode || !targetNode || isEmpty(diagramEdge.relations)) {
    return null
  }

  const [direct, nested] = pipe(
    diagramEdge.relations,
    map(id => {
      try {
        return likec4model.relationship(id)
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

  if (direct.length === 0 && nested.length === 0) {
    console.warn('No relationships found  diagram edge', {
      diagramEdge,
      sourceNode,
      targetNode,
    })
    return null
  }

  return (
    <PortalToContainer>
      <RelationshipPopoverInternal
        viewId={viewId}
        direct={direct}
        nested={nested}
        diagramEdge={diagramEdge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave} />
    </PortalToContainer>
  )
})

const getEdgeLabelElement = (edgeId: string, container: HTMLElement | null | undefined) => {
  return container?.querySelector<HTMLDivElement>(`.likec4-edge-label[data-edge-id="${edgeId}"]`) ??
    container?.querySelector<SVGCircleElement>(`.react-flow__edge[data-id="${edgeId}"] .edge-center-point`) ??
    null
}

type RelationshipPopoverInternalProps = {
  viewId: ViewId
  direct: LikeC4Model.AnyRelation[]
  nested: LikeC4Model.AnyRelation[]
  diagramEdge: DiagramEdge
  sourceNode: DiagramNode
  targetNode: DiagramNode
  onMouseEnter: MouseEventHandler<HTMLDivElement>
  onMouseLeave: MouseEventHandler<HTMLDivElement>
}
const POPOVER_PADDING = 8
const RelationshipPopoverInternal = ({
  viewId,
  diagramEdge,
  direct,
  nested,
  sourceNode,
  targetNode,
  onMouseEnter,
  onMouseLeave,
}: RelationshipPopoverInternalProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { enableNavigateTo, enableVscode } = useEnabledFeatures()
  const { onOpenSource } = useDiagramEventHandlers()

  const containerRef = useRootContainerRef()

  const [referenceEl, setReferenceEl] = useState<HTMLDivElement | SVGCircleElement | null>(null)

  useLayoutEffect(() => {
    setReferenceEl(getEdgeLabelElement(diagramEdge.id, containerRef.current))
  }, [diagramEdge])

  useEffect(() => {
    const reference = referenceEl
    const popper = ref.current
    if (!reference || !popper) {
      return
    }
    let wasCanceled = false

    const update = () => {
      void computePosition(reference, popper, {
        placement: 'bottom-start',
        middleware: [
          offset(4),
          autoPlacement({
            crossAxis: true,
            padding: POPOVER_PADDING,
            allowedPlacements: [
              'bottom-start',
              'top-start',
              'right-start',
              'right-end',
              'left-end',
            ],
          }),
          size({
            padding: POPOVER_PADDING,
            apply({ availableHeight, availableWidth, elements }) {
              if (wasCanceled) {
                return
              }
              Object.assign(elements.floating.style, {
                maxWidth: `${clamp(roundDpr(availableWidth), { min: 200, max: 400 })}px`,
                maxHeight: `${clamp(roundDpr(availableHeight), { min: 0, max: 500 })}px`,
              })
            },
          }),
          hide({
            padding: POPOVER_PADDING * 2,
          }),
        ],
      }).then(({ x, y, middlewareData }) => {
        if (wasCanceled) {
          return
        }
        popper.style.transform = `translate(${roundDpr(x)}px, ${roundDpr(y)}px)`
        popper.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible'
      })
    }
    const cleanup = autoUpdate(reference, popper, update, {
      ancestorResize: false,
      animationFrame: true,
    })
    return () => {
      wasCanceled = true
      cleanup()
    }
  }, [referenceEl])

  const diagram = useDiagram()

  const renderRelationship = useCallback(
    (relationship: LikeC4Model.AnyRelation, index: number) => (
      <Fragment key={relationship.id}>
        {index > 0 && <Divider />}
        <Relationship
          viewId={viewId}
          relationship={relationship}
          sourceNode={sourceNode}
          targetNode={targetNode}
          onNavigateTo={enableNavigateTo
            ? (viewId: ViewId) => {
              diagram.navigateTo(viewId)
            }
            : undefined}
          {...(onOpenSource && enableVscode && {
            onOpenSource: () => onOpenSource({ relation: relationship.id }),
          })}
        />
      </Fragment>
    ),
    [viewId, sourceNode, targetNode, diagram, enableNavigateTo, onOpenSource, enableVscode],
  )

  return (
    <ScrollAreaAutosize
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      type="auto"
      scrollbars={'y'}
      scrollbarSize={6}
      styles={{
        viewport: {
          overscrollBehavior: 'contain',
          minWidth: 180,
        },
      }}
      className={cx(
        css({
          layerStyle: 'likec4.dropdown',
          p: '0',
          pointerEvents: {
            base: 'all',
            _whenPanning: 'none',
          },
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
          paddingTop: '2',
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
            <Label>DIRECT RELATIONSHIPS</Label>
            {direct.map(renderRelationship)}
          </>
        )}
        {nested.length > 0 && (
          <>
            <Label
              css={{
                mt: direct.length > 0 ? '2' : '0',
              }}
            >
              RESOLVED FROM NESTED
            </Label>
            {nested.map(renderRelationship)}
          </>
        )}
      </VStack>
    </ScrollAreaAutosize>
  )
}

const Relationship = forwardRef<
  HTMLDivElement,
  {
    // current view id
    viewId: ViewId
    relationship: LikeC4Model.AnyRelation
    sourceNode: DiagramNode
    targetNode: DiagramNode
    onOpenSource?: () => void
    onNavigateTo?: ((next: ViewId) => void) | undefined
  }
>(({
  viewId,
  relationship: r,
  sourceNode,
  targetNode,
  onNavigateTo,
  onOpenSource,
}, ref) => {
  const sourceId = getEndpointId(r, 'source', sourceNode)
  const targetId = getEndpointId(r, 'target', targetNode)
  const navigateTo = onNavigateTo && r.navigateTo?.id !== viewId ? r.navigateTo?.id : undefined
  const links = r.links

  // Build metadata tooltip content
  const metadataEntries = r.hasMetadata()
    ? entries(r.getMetadata()).sort(([a], [b]) => a.localeCompare(b))
    : null

  const metadataTooltipLabel = metadataEntries && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: '10px',
          color: '#868e96',
          marginBottom: '2px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
        Metadata
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          paddingTop: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
        {metadataEntries.map(([key, value]) => {
          const displayValue = Array.isArray(value) ? value.join(', ') : value
          return (
            <div key={key} style={{ display: 'flex', gap: '12px', fontSize: '12px', lineHeight: '1.4' }}>
              <span
                style={{
                  fontWeight: 600,
                  minWidth: '110px',
                  color: '#495057',
                }}>
                {key}:
              </span>
              <span
                style={{
                  color: '#212529',
                  wordBreak: 'break-word',
                  flex: 1,
                }}>
                {displayValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <VStack
      ref={ref}
      className={bleed({
        block: '2',
        inline: '2',
        paddingY: '2.5',
        paddingX: '2',
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
        <TooltipGroup openDelay={200}>
          <Tooltip label={sourceId.full} offset={2} position="top-start">
            <Text component="div" data-likec4-color={sourceNode.color} className={styles.endpoint}>
              {sourceId.short}
            </Text>
          </Tooltip>
          <IconArrowRight stroke={2.5} size={'11px'} opacity={0.65} />
          <Tooltip label={targetId.full} offset={2} position="top-start">
            <Text component="div" data-likec4-color={targetNode.color} className={styles.endpoint}>
              {targetId.short}
            </Text>
          </Tooltip>
          {navigateTo && (
            <Tooltip label={'Open dynamic view'}>
              <ActionIcon
                size={'sm'}
                radius="sm"
                variant="default"
                onClick={event => {
                  event.stopPropagation()
                  onNavigateTo?.(navigateTo)
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
          {onOpenSource && (
            <Tooltip label={'Open source'}>
              <ActionIcon
                size={'sm'}
                radius="sm"
                variant="default"
                onClick={event => {
                  event.stopPropagation()
                  onOpenSource()
                }}
                role="button"
              >
                <IconFileSymlink size="80%" stroke={2} />
              </ActionIcon>
            </Tooltip>
          )}
        </TooltipGroup>
      </HStack>
      <HStack gap={'xs'} alignItems="center">
        <Box className={styles.title}>{r.title || 'untitled'}</Box>
        {metadataTooltipLabel && (
          <Tooltip
            label={metadataTooltipLabel}
            w={350}
            position="right"
            offset={10}
            openDelay={300}
            withArrow
            bg="white"
            c="dark"
            withinPortal
            styles={{
              tooltip: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #dee2e6',
              },
            }}
          >
            <Box display="inline-flex">
              <IconInfoCircle
                size={14}
                opacity={0.5}
                style={{ flexShrink: 0, cursor: 'help' }}
              />
            </Box>
          </Tooltip>
        )}
      </HStack>
      {r.kind && (
        <HStack gap="2">
          <Label>kind</Label>
          <Text size="xs" className={css({ userSelect: 'all' })}>{r.kind}</Text>
        </HStack>
      )}
      {r.technology && (
        <HStack gap="2">
          <Label>technology</Label>
          <Text size="xs" className={css({ userSelect: 'all' })}>{r.technology}</Text>
        </HStack>
      )}
      {r.summary.nonEmpty && (
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
            <Markdown value={r.summary} fontSize={'sm'} />
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

const Label = styled('div', {
  base: {
    display: 'block',
    fontSize: 'xxs',
    fontWeight: 500,
    userSelect: 'none',
    lineHeight: 'sm',
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

function getEndpointId(
  r: LikeC4Model.AnyRelation,
  endpoint: 'source' | 'target',
  diagramNode: DiagramNode,
) {
  const diagramNodeId = r.isDeploymentRelation()
    // Relation defined in deployment model. Use id of the deployment node as is.
    ? diagramNode.id
    // Relation defined in model. Get id of the model element
    : diagramNode.modelRef || ''

  const full = r[endpoint].id
  const short = nameFromFqn(diagramNodeId) + full.slice(diagramNodeId.length)
  return { full, short }
}
