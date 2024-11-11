import { type ComputedView, type DiagramView, type EdgeId, invariant, nameFromFqn, type ViewID } from '@likec4/core'
import {
  Anchor,
  Badge,
  Box,
  Button,
  CopyButton,
  Divider as MantineDivider,
  Flex,
  Group,
  Paper,
  ScrollAreaAutosize,
  Stack,
  Text
} from '@mantine/core'
import { useElementSize, useHotkeys } from '@mantine/hooks'
import { IconArrowRight, IconInfoCircle, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { useInternalNode, useViewport, ViewportPortal } from '@xyflow/react'
import { getNodeDimensions, getViewportForBounds, type Viewport } from '@xyflow/system'
import clsx from 'clsx'
import React, { memo, type ReactNode, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { clamp, unique } from 'remeda'
import { useDiagramStoreApi, useXYStore } from '../../../hooks'
import type { OnNavigateTo } from '../../../LikeC4Diagram.props'
import { useLikeC4Model } from '../../../likec4model'
import { MinZoom } from '../../const'
import type { ElementXYFlowNode, XYFlowState } from '../../types'
import * as css from './ElementDetails.css'

const Divider = MantineDivider.withProps({
  mb: 6,
  labelPosition: 'left',
  variant: 'dashed'
})

const selector = (state: XYFlowState) => state.domNode?.querySelector('.react-flow__renderer')
// const selector = (state: XYFlowState) => state.domNode?.querySelector('.react-flow__nodes');

export function NodeToolbarPortal({ children }: { children: ReactNode }) {
  const wrapperRef = useXYStore(selector)

  if (!wrapperRef) {
    return null
  }

  return createPortal(children, wrapperRef)
}

type ElementDetailsProps = {
  nodeId: string
}

const MAX_HEIGHT = 300

export const ElementDetails = memo<ElementDetailsProps>(({ nodeId }) => {
  const [previousViewport, setPreviousViewport] = useState<null | Viewport>(null)
  const diagramApi = useDiagramStoreApi()
  const xyviewport = useViewport()
  const { ref, height: detailsHeight } = useElementSize()
  const hoveredNode = useInternalNode<ElementXYFlowNode>(nodeId)
  invariant(hoveredNode, 'Node not found')

  const {
    data: { element },
    internals: {
      positionAbsolute
    }
  } = hoveredNode

  const likec4Model = useLikeC4Model(true)
  const elementModel = likec4Model.element(element.id)

  const incoming = elementModel.incoming().map(r => r.id)
  const outgoing = elementModel.outgoing().map(r => r.id)

  const { view: currentView, onNavigateTo } = diagramApi.getState()

  const findRelationIds = (edgeId: EdgeId) => currentView.edges.find((edge) => edge.id === edgeId)?.relations ?? []

  const incomingInView = unique(element.inEdges.flatMap(findRelationIds))
  const outgoingInView = unique(element.outEdges.flatMap(findRelationIds))

  const notIncludedRelations = [
    ...incoming,
    ...outgoing
  ].filter(r => !incomingInView.includes(r) && !outgoingInView.includes(r)).length

  const defaultView = (element.navigateTo && element.navigateTo !== currentView.id)
    ? likec4Model.view(element.navigateTo).view
    : null
  const otherViews = elementModel.views().filter(v => v.id !== currentView.id && v.id !== element.navigateTo).map(v =>
    v.view
  )

  const { width: nodeWidth, height } = getNodeDimensions(hoveredNode)
  const width = Math.round(nodeWidth * 1.015)
  const left = positionAbsolute.x
  const top = positionAbsolute.y + height

  const zoomInOut = useCallback((e: React.UIEvent) => {
    e.stopPropagation()
    const {
      xyflow,
      xystore,
      fitViewPadding
    } = diagramApi.getState()
    if (previousViewport) {
      xyflow.updateNode(nodeId, { selected: false })
      xyflow.setViewport(previousViewport, { duration: 500 })
      setPreviousViewport(null)
      return
    }
    setPreviousViewport({ ...xyflow.getViewport() })
    const xy = xystore.getState()
    xy.addSelectedNodes([nodeId])
    const viewport = getViewportForBounds(
      {
        x: positionAbsolute.x - 25,
        y: positionAbsolute.y,
        width: width + 50,
        height: height + MAX_HEIGHT + 20
      },
      xy.width,
      xy.height,
      MinZoom,
      1.3,
      fitViewPadding
    )
    xyflow.setViewport(viewport, { duration: 500 })
  }, [previousViewport, width, height, positionAbsolute])

  useHotkeys(
    previousViewport
      ? [
        ['Escape', zoomInOut as any, { preventDefault: true }]
      ]
      : []
  )

  const openRelationshipsOverlay = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    diagramApi.getState().openOverlay({
      relationshipsOf: element.id
    })
  }, [element.id])

  const onNavigateToCb = useCallback((toView: ViewID, e?: React.MouseEvent): void => {
    e?.stopPropagation()
    diagramApi.setState({
      hoveredNodeId: null,
      lastClickedNodeId: nodeId,
      lastOnNavigate: {
        fromView: currentView.id,
        toView,
        fromNode: element.id
      }
    })
    diagramApi.getState().onNavigateTo?.(toView, e)
  }, [element.id, currentView.id, nodeId])

  return (
    <ViewportPortal>
      <Paper
        shadow="lg"
        radius="sm"
        p={0}
        data-likec4-color={element.color}
        className={clsx(css.container, 'nodrag')}
        style={{
          transform: `translate(${left}px, ${top + 18}px)`,
          maxWidth: Math.max(width + 30, 450),
          width: 'max-content',
          minWidth: width,
          cursor: xyviewport.zoom < 1.01 ? 'pointer' : 'default'
        }}
        onClick={xyviewport.zoom < 1.01 ? zoomInOut : undefined}
      >
        <Group align="baseline" m="xs" wrap="nowrap" justify="space-between">
          <Box flex={0}>
            <Text component="span" size="sm" c="dimmed">kind:</Text>
            <Text component="span" size="sm" fw={600}>{element.kind}</Text>
          </Box>
          {element.tags && (
            <Flex gap={4} flex={1}>
              {/* {element.tags.map((tag) => <Text key={tag} size="xs" fw={600}>#{tag}</Text>)} */}
              {element.tags.map((tag) => (
                <Badge key={tag} color="violet" radius={'sm'} size="sm" fw={600} variant="gradient">#{tag}</Badge>
              ))}
            </Flex>
          )}
          <Box flex={0}>
            <Button
              size="xs"
              color="gray"
              variant="light"
              radius="sm"
              onClick={zoomInOut}
            >
              {previousViewport && 'Back'}
              {!previousViewport && (xyviewport.zoom < 1.01 ? 'Zoom' : 'Center')}
            </Button>
          </Box>
        </Group>
        <ScrollAreaAutosize
          mah={MAX_HEIGHT}
          mt={10}
          className={clsx(
            (detailsHeight > MAX_HEIGHT) && (
              (previousViewport || xyviewport.zoom > 1.1) ? 'nowheel' : css.noPointerEvents
            )
          )}
          pb={'sm'}
          scrollbars="y"
          type="hover">
          <Stack gap={'md'} px="xs" ref={ref}>
            {element.notation && <Text style={{ maxWidth: width }}>{element.notation}</Text>}
            {defaultView && !!onNavigateTo && (
              <Box>
                <Divider label="view of this element" />
                <ViewButton view={defaultView} onNavigateTo={onNavigateToCb} />
              </Box>
            )}
            {(incoming.length + outgoing.length) > 0 && (
              <Box>
                <Divider label="relationships" />
                <Group gap={'xs'} justify="space-between" wrap="nowrap" align="baseline">
                  <Box>
                    <Group gap={6} c={'dimmed'} mb={4} wrap="nowrap">
                      <Text
                        className={css.edgeNum}
                        mod={{
                          zero: incoming.length === 0,
                          missing: incoming.length !== incomingInView.length
                        }}>
                        {incoming.length !== incomingInView.length
                          ? (
                            <>
                              {incomingInView.length} / {incoming.length}
                            </>
                          )
                          : (
                            <>
                              {incoming.length}
                            </>
                          )}
                      </Text>
                      <IconArrowRight style={{ width: 14 }} />
                      <Text className={css.fqn}>{nameFromFqn(element.id)}</Text>
                      <IconArrowRight style={{ width: 14 }} />
                      <Text
                        className={css.edgeNum}
                        mod={{
                          zero: outgoing.length === 0,
                          missing: outgoing.length !== outgoingInView.length
                        }}>
                        {outgoing.length !== outgoingInView.length
                          ? (
                            <>
                              {outgoingInView.length} / {outgoing.length}
                            </>
                          )
                          : (
                            <>
                              {outgoing.length}
                            </>
                          )}
                      </Text>
                    </Group>
                    {notIncludedRelations > 0 && (
                      <Group
                        mt={'xs'}
                        gap={6}
                        c="orange"
                        style={{ cursor: 'pointer' }}
                        onClick={openRelationshipsOverlay}>
                        <IconInfoCircle style={{ width: 12 }} />
                        <Text size="xs">
                          {notIncludedRelations} relationship{notIncludedRelations > 1 ? 's are' : ' is'} hidden
                        </Text>
                      </Group>
                    )}
                  </Box>
                  <Box>
                    <Button
                      size="xs"
                      color="gray"
                      variant="light"
                      radius="sm"
                      leftSection={<IconTransform stroke={1.8} style={{ width: '67%' }} />}
                      styles={{
                        section: {
                          marginInline: 0
                        }
                      }}
                      onClick={openRelationshipsOverlay}>
                      Browse
                    </Button>
                  </Box>
                </Group>
              </Box>
            )}
            {element.links && (
              <Box>
                <Divider label="links" />
                <Stack gap={'xs'}>
                  {element.links.map((link) => (
                    <Group key={link.url} wrap="nowrap" gap={'sm'}>
                      <Box
                        flex={'1'}
                        style={{ overflow: 'clip', maxWidth: clamp(element.width, { min: 200, max: 400 }) }}>
                        <Anchor href={link.url} target="_blank" fz="13" truncate="end">
                          {link.title || link.url}
                        </Anchor>
                      </Box>
                      <CopyButton value={link.url}>
                        {({ copied, copy }) => (
                          <Button
                            size="compact-xs"
                            fz={'10'}
                            variant="light"
                            onClick={copy}
                            color={copied ? 'teal' : 'gray'}
                          >
                            {copied ? 'copied' : 'copy'}
                          </Button>
                        )}
                      </CopyButton>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}
            {otherViews.length > 0 && !!onNavigateTo && (
              <Box>
                <Divider label="views including this element" />
                <Stack gap={'xs'}>
                  {otherViews.map((view) => (
                    <ViewButton
                      key={view.id}
                      view={view}
                      onNavigateTo={onNavigateToCb}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </ScrollAreaAutosize>
        {
          /* <Group mt={'sm'}>
          <Stack gap={2}>
            <Button size="compact-sm" variant="light" radius="sm" color="gray" justify='start'>Base</Button>
            <Button size="compact-sm" variant="subtle" radius="sm" color="gray" justify='start'>Links</Button>
            <Button size="compact-sm" variant="subtle" radius="sm" color="gray" justify='start'>Views</Button>
            <Button size="compact-sm" variant="subtle" radius="sm" color="gray" justify='start'>Metadata</Button>
          </Stack>
        </Group> */
        }
      </Paper>
    </ViewportPortal>
  )
})

const ViewButton = ({
  view,
  onNavigateTo
}: {
  view: ComputedView | DiagramView
  onNavigateTo: OnNavigateTo
}) => {
  return (
    <Button
      className={css.viewButton}
      variant="subtle"
      radius="sm"
      color="gray"
      leftSection={<IconZoomScan stroke={1.8} />}
      styles={{
        section: {
          marginInline: 2,
          alignSelf: 'baseline'
        }
      }}
      justify="start"
      onClick={e => {
        onNavigateTo(view.id, e)
      }}>
      <Text component="div">{view.title || 'untitled'}</Text>
      <Text component="div" lh={1.2} fz={'xs'} c="dimmed">id: {view.id}</Text>
    </Button>
  )
}
