import {
  type ComputedView,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  invariant,
  type Link,
  nameFromFqn,
  type ViewID
} from '@likec4/core'
import {
  ActionIcon,
  ActionIconGroup,
  Anchor,
  Badge,
  Box,
  Card,
  CloseButton,
  CopyButton,
  Divider as MantineDivider,
  Flex,
  FocusTrap,
  FocusTrapInitialFocus,
  Group,
  Indicator,
  Paper,
  RemoveScroll,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  ThemeIcon,
  Tooltip as MantineTooltip,
  UnstyledButton
} from '@mantine/core'
import { useViewportSize } from '@mantine/hooks'
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileSymlink,
  IconInfoCircle,
  IconZoomScan
} from '@tabler/icons-react'
import { ReactFlowProvider as XYFlowProvider, useInternalNode } from '@xyflow/react'
import clsx from 'clsx'
import { m, useDragControls } from 'framer-motion'
import { type ReactNode, useCallback, useState } from 'react'
import {} from 'react-remove-scroll'
import { clamp, first, isNullish, map, only, partition, pipe, unique } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useXYFlow } from '../../hooks'
import type { ElementIconRenderer, OnNavigateTo } from '../../LikeC4Diagram.props'
import { useLikeC4Model } from '../../likec4model'
import { useOverlayDialog } from '../OverlayContext'
import { RelationshipsXYFlow } from '../relationships-of/RelationshipsXYFlow'
import * as css from './ElementDetailsCard.css'

const Divider = MantineDivider.withProps({
  mb: 8,
  labelPosition: 'left',
  variant: 'dashed'
})
const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4
})

const SmallLabel = Text.withProps({
  component: 'div',
  fz: 11,
  fw: 500,
  c: 'dimmed',
  lh: 1
})

const PropertyLabel = Text.withProps({
  component: 'div',
  fz: 'xs',
  c: 'dimmed',
  className: css.propertyLabel
})

type ElementDetailsCardProps = {
  fqn: Fqn
}

const MIN_PADDING = 24

export function ElementDetailsCard({ fqn }: ElementDetailsCardProps) {
  const windowSize = useViewportSize()
  const windowWidth = windowSize.width || window.innerWidth || 1200,
    windowHeight = windowSize.height || window.innerHeight || 800
  const xyflow = useXYFlow()
  const xynode = useInternalNode(fqn)
  invariant(xynode, `XYNode with id ${fqn} not found`)

  const overlay = useOverlayDialog()
  const [activeTab, setActiveTab] = useState<'Properties' | 'Relationships' | 'Views'>('Properties')
  const diagramApi = useDiagramStoreApi()
  const {
    currentView,
    element,
    renderIcon,
    onNavigateTo,
    onOpenSource
  } = useDiagramState(s => ({
    currentView: s.view,
    element: s.getElement(fqn),
    renderIcon: s.renderIcon,
    onOpenSource: s.onOpenSourceElement,
    onNavigateTo: s.onNavigateTo
  }))
  invariant(element, `DiagramNode with fqn ${fqn} not found`)

  const xynodeCenter = xyflow.flowToScreenPosition({
    x: xynode.internals.positionAbsolute.x + element.width / 2,
    y: xynode.internals.positionAbsolute.y + element.height / 2
  })

  const likec4Model = useLikeC4Model(true)
  const elementModel = likec4Model.element(fqn)
  const viewId = currentView.id

  const elementIcon = ElementIcon({
    element,
    viewId,
    renderIcon
  })

  const incoming = elementModel.incoming().map(r => r.id)
  const outgoing = elementModel.outgoing().map(r => r.id)

  const findRelationIds = (edgeId: EdgeId) => currentView.edges.find((edge) => edge.id === edgeId)?.relations ?? []

  const incomingInView = unique(element.inEdges.flatMap(findRelationIds))
  const outgoingInView = unique(element.outEdges.flatMap(findRelationIds))

  const notIncludedRelations = [
    ...incoming,
    ...outgoing
  ].filter(r => !incomingInView.includes(r) && !outgoingInView.includes(r)).length

  const [viewsOf, otherViews] = pipe(
    elementModel.views(),
    map(v => v.view as ComputedView),
    partition(v => v.__ !== 'dynamic' && v.viewOf === fqn)
  )

  const defaultView = element.navigateTo ? likec4Model.view(element.navigateTo).view : (first(viewsOf) ?? null)

  const defaultLink = element.links && only(element.links)

  const onNavigateToCb = useCallback((toView: ViewID, e?: React.MouseEvent): void => {
    e?.stopPropagation()
    diagramApi.setState({
      activeOverlay: null,
      hoveredNodeId: null,
      lastClickedNodeId: fqn,
      lastOnNavigate: {
        fromView: currentView.id,
        toView,
        fromNode: fqn
      }
    })
    diagramApi.getState().onNavigateTo?.(toView, e)
  }, [fqn, currentView.id])
  const controls = useDragControls()

  const width = Math.min(700, windowWidth - MIN_PADDING * 2)
  const height = Math.min(650, windowHeight - MIN_PADDING * 2)

  const left = clamp(xynodeCenter.x - width / 2, {
    min: MIN_PADDING,
    max: windowWidth - width - MIN_PADDING
  })
  const top = clamp(xynodeCenter.y, {
    min: MIN_PADDING,
    max: windowHeight - height - MIN_PADDING
  })

  return (
    (
      <RemoveScroll>
        <FocusTrap>
          <Card
            drag
            dragElastic={0}
            dragListener={false}
            dragTransition={{ power: 0.1, timeConstant: 100 }}
            dragControls={controls}
            withBorder
            shadow="md"
            component={m.div}
            className={css.card}
            layoutId={`${viewId}:element:${fqn}`}
            initial={false}
            animate={{
              opacity: 1,
              top,
              left,
              width,
              height
            }}
            exit={{
              opacity: 0
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                overlay.close()
              }
            }}
            data-likec4-color={element.color}>
            <FocusTrapInitialFocus />
            <Box className={css.cardHeader}>
              <Group align="start" gap={'sm'} mb={'sm'} onPointerDown={e => controls.start(e)}>
                {elementIcon}
                <Box flex={1}>
                  <Text
                    component={m.div}
                    layout="position"
                    layoutId={`${viewId}:element:title:${fqn}`}
                    className={css.title}>
                    {elementModel.title}
                  </Text>
                  {element.notation && (
                    <Text component="div" c={'dimmed'} fz={'sm'} fw={500} lh={1.3} lineClamp={1}>
                      {element.notation}
                    </Text>
                  )}
                </Box>
                <CloseButton
                  size={'lg'}
                  onClick={e => {
                    e.stopPropagation()
                    overlay.close()
                  }}
                />
              </Group>
              <Group align="baseline" gap={'sm'}>
                <Box>
                  <SmallLabel>kind</SmallLabel>
                  <Badge radius={'sm'} size="sm" fw={600} color="gray">{element.kind}</Badge>
                </Box>
                {
                  /* <Box>
                  <SmallLabel>technology</SmallLabel>
                  <Badge radius={'sm'} size="sm" fw={600} color="gray">{element.technology || '—'}</Badge>
                </Box> */
                }
                <Box flex={1}>
                  <SmallLabel>tags</SmallLabel>
                  <Flex gap={4} flex={1} mt={6}>
                    {element.tags?.map((tag) => (
                      <Badge key={tag} radius={'sm'} size="sm" fw={600} variant="gradient">#{tag}</Badge>
                    ))}
                    {!element.tags && <Badge radius={'sm'} size="sm" fw={600} color="gray">—</Badge>}
                  </Flex>
                </Box>
                <ActionIconGroup
                  style={{
                    alignSelf: 'flex-end'
                  }}>
                  {defaultLink && (
                    <ActionIcon
                      component="a"
                      href={defaultLink.url}
                      target="_blank"
                      size="lg"
                      variant="default"
                      radius="sm"
                    >
                      <IconExternalLink stroke={1.6} style={{ width: '65%' }} />
                    </ActionIcon>
                  )}
                  {onOpenSource && (
                    <Tooltip label="Open source">
                      <ActionIcon
                        size="lg"
                        variant="default"
                        radius="sm"
                        onClick={e => {
                          e.stopPropagation()
                          diagramApi.getState().onOpenSourceElement?.(fqn)
                        }}
                      >
                        <IconFileSymlink stroke={1.8} style={{ width: '62%' }} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {defaultView && (
                    <Tooltip label="Open default view">
                      <ActionIcon
                        size="lg"
                        variant="default"
                        radius="sm"
                        onClick={e => {
                          onNavigateToCb(defaultView.id, e)
                        }}>
                        <IconZoomScan style={{ width: '70%' }} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </ActionIconGroup>
              </Group>
            </Box>

            <Tabs
              value={activeTab}
              onChange={v => setActiveTab(v as any)}
              variant="none"
              keepMounted={false}
              classNames={{
                root: css.tabsRoot,
                list: css.tabsList,
                tab: css.tabsTab,
                panel: css.tabsPanel
              }}>
              <TabsList>
                <TabsTab value="Properties">
                  Properties
                </TabsTab>
                <TabsTab value="Relationships">
                  Relationships
                </TabsTab>
                <TabsTab value="Views">
                  Views
                </TabsTab>
                <TabsTab value="Structure">
                  Structure
                </TabsTab>
              </TabsList>

              <TabsPanel value="Properties">
                <Stack>
                  <Box className={css.propertiesGrid}>
                    <ElementProperty title="description" value={element.description} emptyValue="no description" />
                    <ElementProperty title="technology" value={element.technology} />
                    {element.links && (
                      <>
                        <PropertyLabel>links</PropertyLabel>
                        <Stack gap={4} align="flex-start">
                          {element.links.map((link, i) => <ElementLink key={i} value={link} />)}
                        </Stack>
                      </>
                    )}
                  </Box>
                </Stack>
              </TabsPanel>

              <TabsPanel value="Relationships">
                {(incoming.length + outgoing.length) > 0 && (
                  <Box>
                    <Group gap={'xs'} wrap="nowrap" align="center" justify="center">
                      <Box>
                        <Group gap={8} mb={4} wrap="nowrap">
                          <RelationshipsStat
                            title="incoming"
                            total={incoming.length}
                            included={incomingInView.length}
                          />
                          <ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                            <IconArrowRight style={{ width: 16 }} />
                          </ThemeIcon>
                          <Text className={css.fqn}>{nameFromFqn(element.id)}</Text>
                          <ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                            <IconArrowRight style={{ width: 16 }} />
                          </ThemeIcon>
                          <RelationshipsStat
                            title="outgoing"
                            total={outgoing.length}
                            included={outgoingInView.length}
                          />
                        </Group>
                      </Box>
                    </Group>
                    {notIncludedRelations > 0 && (
                      <Group
                        mt={'xs'}
                        gap={6}
                        c="orange"
                        style={{ cursor: 'pointer' }}>
                        <IconInfoCircle style={{ width: 14 }} />
                        <Text fz="sm">
                          {notIncludedRelations} relationship{notIncludedRelations > 1 ? 's are' : ' is'} hidden
                        </Text>
                      </Group>
                    )}
                  </Box>
                )}
                <Box h={240}>
                  <XYFlowProvider
                    defaultNodes={[]}
                    defaultEdges={[]}>
                    <RelationshipsXYFlow subjectId={fqn} />
                  </XYFlowProvider>
                </Box>
              </TabsPanel>

              <TabsPanel value="Views">
                <Stack gap={'lg'}>
                  {viewsOf.length > 0 && !!onNavigateTo && (
                    <Box>
                      <Divider label="views of the element (scoped)" />
                      <Stack gap={'sm'}>
                        {viewsOf.map((view) => (
                          <ViewButton
                            key={view.id}
                            view={view}
                            onNavigateTo={onNavigateToCb}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {otherViews.length > 0 && !!onNavigateTo && (
                    <Box>
                      <Divider label="views including this element" />
                      <Stack gap={'sm'}>
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
              </TabsPanel>
            </Tabs>
          </Card>
        </FocusTrap>
      </RemoveScroll>
    )
  )
}

const ElementIcon = (
  { element, viewId, renderIcon: RenderIcon }: {
    element: DiagramNode
    viewId: string
    renderIcon: ElementIconRenderer | null
  }
) => {
  if (!element.icon) {
    return null
  }
  let icon = null as React.ReactNode
  if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
    icon = <img src={element.icon} alt={element.title} />
  } else if (RenderIcon) {
    icon = <RenderIcon node={element} />
  }

  if (!icon) {
    return null
  }
  return (
    <m.div
      layout="position"
      layoutId={`${viewId}:element:icon:${element.id}`}
      className={clsx(
        css.elementIcon,
        'likec4-element-icon'
      )}
      data-likec4-icon={element.icon}
    >
      {icon}
    </m.div>
  )
}

const ViewButton = ({
  view,
  onNavigateTo
}: {
  view: ComputedView | DiagramView
  onNavigateTo: OnNavigateTo
}) => {
  return (
    <UnstyledButton className={css.viewButton} onClick={e => onNavigateTo(view.id, e)}>
      <Group gap={6} align="start">
        <ThemeIcon size={'sm'} variant="transparent">
          <IconZoomScan stroke={1.8} />
        </ThemeIcon>
        <Box>
          <Text component="div" className={css.viewButtonTitle} lineClamp={1}>
            {view.title || 'untitled'}
          </Text>
          {view.description && (
            <Text component="div" mt={2} fz={'xs'} c={'dimmed'} lh={1.4} lineClamp={1}>
              {view.description}
            </Text>
          )}
        </Box>
      </Group>
    </UnstyledButton>
  )
}

function ElementProperty({
  title,
  value,
  emptyValue = `undefined`
}: {
  title: string
  value: ReactNode
  emptyValue?: string
}) {
  return (
    <>
      <PropertyLabel>{title}</PropertyLabel>
      <Text
        lh={'sm'}
        fz={'sm'}
        {...(isNullish(value) && { c: 'dimmed' })}
        style={{
          whiteSpace: 'preserve-breaks'
        }}>
        {value || emptyValue}
      </Text>
    </>
  )
}

function ElementLink({
  value
}: {
  value: Link
}) {
  const url = new URL(value.url, window.location.href).toString()
  return (
    <CopyButton value={url}>
      {({ copied, copy }) => (
        <Anchor href={url} target="_blank" underline="never">
          <Group className={css.elementLink} gap={4} align="center" wrap="nowrap">
            <ActionIcon
              size={24}
              variant={copied ? 'light' : 'subtle'}
              color={copied ? 'teal' : 'gray'}
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                copy()
              }}
            >
              {copied ? <IconCheck /> : <IconCopy style={{ width: '65%', opacity: 0.8 }} />}
            </ActionIcon>
            <Box flex={1}>
              <Text fz={'sm'} truncate lh={1.3} fw={value.title ? 500 : 400}>
                {value.title || url}
              </Text>
              {value.title && (
                <Text component="div" fz={10} c={'dimmed'} lh={1.2} truncate>
                  {url}
                </Text>
              )}
            </Box>
          </Group>
        </Anchor>
      )}
    </CopyButton>
  )
  // <Anchor href={value.url} fz={'sm'}>
  //   {value.title || url}
  // </Anchor><Button variant='default' size='sm'>
  //     {value.title || value.url}
  //   </Button>
  //  </Box>
  // )
}

function RelationshipsStat({
  title,
  total,
  included
}: {
  title: string
  total: number
  included: number
}) {
  return (
    <Paper
      withBorder
      shadow="none"
      className={css.relationshipStat}
      px="md"
      py="xs"
      radius="md"
      mod={{
        zero: total === 0,
        missing: total !== included
      }}>
      <Stack gap={4} align="flex-end">
        <Text component="div" c={total !== included ? 'orange' : 'dimmed'} tt="uppercase" fw={600} fz={10} lh={1}>
          {title}
        </Text>
        <Text fw={600} fz={'xl'} component="div" lh={1}>
          {total !== included
            ? (
              <>
                {included} / {total}
              </>
            )
            : (
              <>
                {total}
              </>
            )}
        </Text>
        {
          /* <ThemeIcon
          color="gray"
          variant="light"
          style={{
            color: stat.diff > 0 ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'
          }}
          size={38}
          radius="md"
        >
          <DiffIcon size="1.8rem" stroke={1.5} />
        </ThemeIcon> */
        }
      </Stack>
      {
        /* <Text c="dimmed" fz="sm" mt="md">
          <Text component="span" c={stat.diff > 0 ? 'teal' : 'red'} fw={700}>
            {stat.diff}%
          </Text>{' '}
          {stat.diff > 0 ? 'increase' : 'decrease'} compared to last month
        </Text> */
      }
    </Paper>
  )
}
