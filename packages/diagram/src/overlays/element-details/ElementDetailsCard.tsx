// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// oxlint-disable no-misused-spread
// oxlint-disable no-misused-spread
import { nonNullable } from '@likec4/core'
import type {
  Any,
  ComputedView,
  DiagramView,
  NodeId,
  scalar,
  ViewId,
} from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import {
  ActionIcon,
  ActionIconGroup,
  Badge,
  Box,
  CloseButton,
  Divider as MantineDivider,
  Flex,
  Group,
  RemoveScroll,
  ScrollArea,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  ThemeIcon,
  Tooltip as MantineTooltip,
  UnstyledButton,
} from '@mantine/core'
import { useLocalStorage, useSessionStorage, useViewportSize } from '@mantine/hooks'
import { useDebouncedCallback, useTimeoutEffect } from '@react-hookz/web'
import { IconExternalLink, IconFileSymlink, IconStack2, IconZoomScan } from '@tabler/icons-react'
import type { Rect } from '@xyflow/system'
import { type PanInfo, m, useDragControls, useMotionValue } from 'motion/react'
import { type PropsWithChildren, type SyntheticEvent, useCallback, useRef, useState } from 'react'
import { clamp, entries, map, only, partition, pipe } from 'remeda'
import { Markdown } from '../../base-primitives'
import { ElementTag } from '../../base-primitives/element/ElementTags'
import { Link } from '../../components/Link'
import { DiagramFeatures, IconRenderer, IfEnabled } from '../../context'
import { useCallbackRef, useUpdateEffect } from '../../hooks'
import { useCurrentViewModel } from '../../hooks/useCurrentViewModel'
import { useDiagram } from '../../hooks/useDiagram'
import type { OnNavigateTo } from '../../LikeC4Diagram.props'
import { metadataSearchQuery } from '../../search/metadata-search'
import { stopPropagation } from '../../utils'
import * as styles from './ElementDetailsCard.css'
import { MetadataList, MetadataProvider } from './MetadataValue'
import { PropertiesSplit } from './PropertiesSplit'
import type { DetailsSubject } from './subject'
import { TabPanelDeployments } from './TabPanelDeployments'
import { TabPanelRelationships } from './TabPanelRelationships'
import { TabPanelStructure } from './TabPanelStructure'

const Divider = MantineDivider.withProps({
  mb: 8,
  labelPosition: 'left',
  variant: 'dashed',
})
const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4,
  withinPortal: false,
})

const diffStatusColor = {
  added: 'green',
  removed: 'red',
  modified: 'orange',
  orphan: 'gray',
} as const

const SmallLabel = styled('div', {
  base: {
    textStyle: 'fieldLabel',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
})

type ElementDetailsCardProps = {
  viewId: ViewId
  fromNode: NodeId | null
  rectFromNode: Rect | null
  onClose: () => void
  subject: DetailsSubject
}

const MIN_PADDING = 24

type CardSize = { width: number; height: number }
const DEFAULT_SIZE: CardSize = { width: 700, height: 650 }
const MIN_SIZE: CardSize = { width: 320, height: 300 }

const TABS = ['Properties', 'Relationships', 'Views', 'Structure', 'Deployments'] as const
const DEPLOYMENT_TABS = ['Properties', 'Views', 'Structure'] as const
type TabName = typeof TABS[number]

export function ElementDetailsCard({
  viewId,
  fromNode,
  rectFromNode,
  subject,
  onClose,
}: ElementDetailsCardProps) {
  const [opened, setOpened] = useState(false)
  const windowSize = useViewportSize()
  const windowWidth = windowSize.width || window.innerWidth || 1200,
    windowHeight = windowSize.height || window.innerHeight || 800

  const [activeTab, setActiveTab] = useSessionStorage<TabName>({
    key: subject.deployment ? 'likec4:deployment-details:active-tab' : 'likec4:element-details:active-tab',
    defaultValue: 'Properties',
  })
  const diagram = useDiagram()
  const viewModel = useCurrentViewModel()
  const nodeModel = fromNode
    ? viewModel.findNode(fromNode)
    : subject.type === 'deployment'
    ? [...viewModel.nodes()].find(n => n.$node.deploymentRef === subject.deployment) ?? null
    : viewModel.findNodeWithElement(subject.element)

  const logicalElement = subject.type === 'element' ? viewModel.$model.element(subject.element) : null
  const deploymentElement = subject.type === 'deployment'
    ? viewModel.$model.deployment.element(subject.deployment)
    : null
  const elementModel = nonNullable(logicalElement ?? deploymentElement, 'Details subject not found')
  const tabs = subject.deployment ? DEPLOYMENT_TABS : TABS
  const hasSummary = logicalElement
    ? logicalElement.hasSummary
    : !elementModel.summary.isEmpty && elementModel.summary.text !== elementModel.description.text

  const [viewsOf, otherViews] = pipe(
    [...elementModel.views()],
    map(v => v.$view),
    partition(v => v._type === 'element' && v.viewOf === subject.element),
  )

  let defaultView = nodeModel?.navigateTo?.$view ?? logicalElement?.defaultView?.$view ?? null
  // Ignore default view if it's the current view
  if (defaultView?.id === viewId) {
    defaultView = null
  }

  const defaultLink = only(elementModel.links)
  const controls = useDragControls()

  const isCompound = (nodeModel?.$node.children?.length ?? 0) > 0

  // Size the user resized the card to, remembered across sessions.
  // Read synchronously: position and the "pop out of the node" origin are computed from it on mount
  const [savedSize, setSavedSize] = useLocalStorage<CardSize>({
    key: 'likec4:element-details:size',
    defaultValue: DEFAULT_SIZE,
    getInitialValueInEffect: false,
  })
  const maxWidth = Math.max(MIN_SIZE.width, windowWidth - MIN_PADDING * 2)
  const maxHeight = Math.max(MIN_SIZE.height, windowHeight - MIN_PADDING * 2)
  const _width = Math.round(clamp(savedSize.width, { min: MIN_SIZE.width, max: maxWidth }))
  const _height = Math.round(clamp(savedSize.height, { min: MIN_SIZE.height, max: maxHeight }))

  const fromPosition = rectFromNode
    ? {
      x: rectFromNode.x + (isCompound ? (rectFromNode.width - _width / 2) : rectFromNode.width / 2),
      y: rectFromNode.y + (isCompound ? 0 : rectFromNode.height / 2),
    }
    : {
      x: windowWidth / 2,
      y: windowHeight / 2,
    }

  const fromScale = rectFromNode ? Math.min(rectFromNode.width / _width, rectFromNode.height / _height, 0.9) : 1

  const left = Math.round(
    clamp(fromPosition.x - _width / 2, {
      min: MIN_PADDING,
      max: windowWidth - _width - MIN_PADDING,
    }),
  )
  const top = Math.round(
    clamp(fromPosition.y - (isCompound ? 0 : 60), {
      min: MIN_PADDING,
      max: windowHeight - _height - MIN_PADDING,
    }),
  )

  const originX = clamp((fromPosition.x - left) / _width, {
    min: 0.1,
    max: 0.9,
  })
  const originY = clamp((fromPosition.y - top) / _height, {
    min: 0.1,
    max: 0.9,
  })

  const width = useMotionValue(_width)
  const height = useMotionValue(_height)
  // offset after dragging the card by its header
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useUpdateEffect(() => {
    width.set(_width)
    height.set(_height)
  }, [_width, _height])

  const handleResize = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    width.set(clamp(width.get() + info.delta.x, { min: MIN_SIZE.width, max: maxWidth }))
    height.set(clamp(height.get() + info.delta.y, { min: MIN_SIZE.height, max: maxHeight }))
  }, [width, height, maxWidth, maxHeight])

  // After dragging or resizing, bring the card (and its resize handle) back inside the viewport
  const keepInViewport = useCallback(() => {
    // the card is a direct child of the dialog (RemoveScroll owns the card's ref)
    const rect = ref.current?.querySelector(':scope > [data-likec4-color]')?.getBoundingClientRect()
    if (!rect) {
      return
    }
    const overflow = (start: number, end: number, size: number) => {
      switch (true) {
        case start < MIN_PADDING:
          return MIN_PADDING - start
        case end > size - MIN_PADDING:
          return Math.max(size - MIN_PADDING - end, MIN_PADDING - start)
        default:
          return 0
      }
    }
    const dx = overflow(rect.left, rect.right, windowWidth)
    const dy = overflow(rect.top, rect.bottom, windowHeight)
    if (dx !== 0) {
      x.set(x.get() + dx)
    }
    if (dy !== 0) {
      y.set(y.get() + dy)
    }
  }, [x, y, windowWidth, windowHeight])

  const handleResizeEnd = useCallback(() => {
    setSavedSize({ width: Math.round(width.get()), height: Math.round(height.get()) })
    keepInViewport()
  }, [width, height, setSavedSize, keepInViewport])

  // Double-click on the header or the resize handle: back to the default size and position
  const resetCard = useCallback(() => {
    width.set(clamp(DEFAULT_SIZE.width, { min: MIN_SIZE.width, max: maxWidth }))
    height.set(clamp(DEFAULT_SIZE.height, { min: MIN_SIZE.height, max: maxHeight }))
    x.set(0)
    y.set(0)
    setSavedSize(DEFAULT_SIZE)
  }, [width, height, x, y, maxWidth, maxHeight, setSavedSize])

  const ref = useRef<HTMLDialogElement>(null)

  const close = useDebouncedCallback(
    useCallbackRef(onClose),
    [],
    50,
  )
  const triggerClose = useCallbackRef((event?: SyntheticEvent) => {
    event?.stopPropagation()
    close()
  })

  const notation = nodeModel?.$node.notation ?? null

  const elementIcon = IconRenderer({
    element: {
      id: elementModel.id,
      title: elementModel.title,
      icon: nodeModel?.icon ?? elementModel.icon,
    },
    className: styles.elementIcon,
  })

  useTimeoutEffect(() => {
    if (!ref.current?.open) {
      ref.current?.showModal()
    }
  }, 20)

  /**
   * This delay improves "enter" animations,
   * if  current tab is "Relationships"
   */
  useTimeoutEffect(() => {
    setOpened(true)
  }, 220)

  const technologies = elementModel.technology
    ? elementModel.technology.split(',').map(t => t.trim()).filter(Boolean)
    : []
  const hasFacts = technologies.length > 0
    || elementModel.links.length > 0
    || elementModel.hasMetadata()
    || !!deploymentElement?.isInstance()

  return (
    <m.dialog
      ref={ref}
      className={cx(styles.dialog, RemoveScroll.classNames.fullWidth)}
      layout
      initial={{
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '5%',
      }}
      animate={{
        [styles.backdropBlur]: '3px',
        [styles.backdropOpacity]: '60%',
      }}
      exit={{
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '0%',
        transition: {
          duration: 0.1,
        },
      }}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          ref.current?.close()
        }
      }}
      onDoubleClick={stopPropagation}
      onPointerDown={stopPropagation}
      onClose={triggerClose}
    >
      <RemoveScroll forwardProps removeScrollBar={false}>
        <m.div
          layout
          layoutRoot
          drag
          dragControls={controls}
          dragElastic={0}
          dragMomentum={false}
          dragListener={false}
          onDragEnd={keepInViewport}
          data-likec4-color={nodeModel?.color ?? elementModel.color}
          className={styles.card}
          initial={{
            top,
            left,
            width: _width,
            height: _height,
            opacity: 0,
            originX,
            originY,
            scale: Math.max(fromScale, 0.65),
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            translateY: -10,
            transition: {
              duration: 0.1,
            },
          }}
          style={{
            width,
            height,
            x,
            y,
          }}>
          <div
            className={styles.cardHeader}
            onPointerDown={e => {
              // dragging the card must not select text (buttons keep their default behaviour)
              if (!(e.target as Element).closest('button, a, input, textarea')) {
                e.preventDefault()
              }
              controls.start(e)
            }}
            onDoubleClick={e => {
              // ignore double-clicks on header buttons
              if ((e.target as Element).closest('button, a')) {
                return
              }
              window.getSelection()?.removeAllRanges()
              resetCard()
            }}>
            <HStack alignItems="start" justify="space-between" gap={'sm'} mb={'sm'} flexWrap="nowrap">
              <HStack
                alignItems="start"
                gap={'sm'}
                style={{ cursor: 'default', minWidth: 0, overflow: 'hidden' }}
                flexWrap="nowrap"
              >
                {elementIcon}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <Tooltip label={elementModel.title} openDelay={600} position="bottom-start">
                    <Text
                      component={'div'}
                      className={styles.title}>
                      {elementModel.title}
                    </Text>
                  </Tooltip>
                  {notation && (
                    <Text component="div" c={'dimmed'} fz={'sm'} fw={500} lh={1.3} lineClamp={1}>
                      {notation}
                    </Text>
                  )}
                </div>
              </HStack>
              <HStack gap={'xs'} flexWrap="nowrap" style={{ flex: 'none' }}>
                <ActionIconGroup
                  style={{
                    alignSelf: 'flex-start',
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
                  <IfEnabled feature="Vscode">
                    <Tooltip label="Open source">
                      <ActionIcon
                        size="lg"
                        variant="default"
                        radius="sm"
                        onClick={e => {
                          e.stopPropagation()
                          diagram.openSource(
                            subject.type === 'deployment'
                              ? { deployment: subject.deployment }
                              : { element: subject.element },
                          )
                        }}>
                        <IconFileSymlink stroke={1.8} style={{ width: '62%' }} />
                      </ActionIcon>
                    </Tooltip>
                  </IfEnabled>
                  {defaultView && (
                    <Tooltip label="Open default view">
                      <ActionIcon
                        size="lg"
                        variant="default"
                        radius="sm"
                        onClick={e => {
                          e.stopPropagation()
                          diagram.navigateTo(defaultView.id, fromNode ?? undefined)
                        }}>
                        <IconZoomScan style={{ width: '70%' }} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </ActionIconGroup>
                <CloseButton size={'lg'} onClick={triggerClose} />
              </HStack>
            </HStack>
          </div>
          <MetadataProvider>
            <Tabs
              value={activeTab}
              onChange={v => setActiveTab(v as any)}
              variant="none"
              classNames={styles.tabs()}>
              <TabsList>
                {tabs.map(tab => (
                  <TabsTab key={tab} value={tab}>
                    {tab}
                  </TabsTab>
                ))}
              </TabsList>

              <TabsPanel value="Properties">
                <PropertiesSplit
                  main={
                    <ScrollArea className={styles.propertiesMain} scrollbars="y" type="auto" offsetScrollbars>
                      <article className={styles.propertiesArticle}>
                        {hasSummary && (
                          <div className={styles.propertiesSummary}>
                            <Markdown value={elementModel.summary} />
                          </div>
                        )}
                        <div className={styles.propertiesDescription}>
                          <Markdown value={elementModel.description} emptyText="No description" />
                        </div>
                      </article>
                    </ScrollArea>
                  }
                  sidebar={hasFacts
                    ? (
                      <ScrollArea className={styles.propertiesSidebar} scrollbars="y" type="auto">
                        <div className={styles.facts}>
                          {technologies.length > 0 && (
                            <Fact label="technology">
                              {technologies.map(technology => (
                                <Badge
                                  key={technology}
                                  variant="default"
                                  radius="sm"
                                  size="sm"
                                  tt="none"
                                  className={styles.technologyBadge}>
                                  {technology}
                                </Badge>
                              ))}
                            </Fact>
                          )}
                          {elementModel.links.length > 0 && (
                            <Fact label="links">
                              {elementModel.links.map((link, i) => <Link key={i} value={link} />)}
                            </Fact>
                          )}
                          {deploymentElement?.isInstance() && (
                            <Fact label="logical element">
                              <UnstyledButton
                                onClick={() =>
                                  diagram.openNodeDetails({ type: 'element', element: deploymentElement.element.id })}>
                                {deploymentElement.element.title}
                              </UnstyledButton>
                            </Fact>
                          )}
                          {elementModel.hasMetadata() && (
                            <Fact label="metadata">
                              <MetadataList
                                entries={entries(elementModel.metadata).sort(([a], [b]) => a.localeCompare(b))}
                                onSearch={(key, value) => diagram.openSearch(metadataSearchQuery(key, value))} />
                            </Fact>
                          )}
                        </div>
                      </ScrollArea>
                    )
                    : null} />
              </TabsPanel>

              {logicalElement && (
                <TabsPanel value="Relationships">
                  <DiagramFeatures
                    overrides={{
                      enableRelationshipBrowser: false,
                      enableNavigateTo: false,
                    }}>
                    {opened && activeTab === 'Relationships' && (
                      <TabPanelRelationships
                        element={logicalElement}
                        node={nodeModel ?? null} />
                    )}
                  </DiagramFeatures>
                </TabsPanel>
              )}

              <TabsPanel value="Views">
                <ScrollArea scrollbars="y" type="auto">
                  <Stack gap={'lg'}>
                    {viewsOf.length > 0 && (
                      <Box>
                        <Divider label="views of the element (scoped)" />
                        <Stack gap={'sm'}>
                          {viewsOf.map((view) => (
                            <ViewButton
                              key={view.id}
                              view={view}
                              onNavigateTo={to => diagram.navigateTo(to as scalar.ViewId, fromNode ?? undefined)} />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    {otherViews.length > 0 && (
                      <Box>
                        <Divider
                          label={subject.deployment
                            ? 'views including this deployment'
                            : 'views including this element'} />
                        <Stack gap={'sm'}>
                          {otherViews.map((view) => (
                            <ViewButton
                              key={view.id}
                              view={view}
                              onNavigateTo={to => diagram.navigateTo(to as scalar.ViewId, fromNode ?? undefined)} />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </ScrollArea>
              </TabsPanel>

              <TabsPanel value="Structure">
                <ScrollArea scrollbars="y" type="auto">
                  <TabPanelStructure element={elementModel} />
                </ScrollArea>
              </TabsPanel>

              {logicalElement && (
                <TabsPanel value="Deployments">
                  <ScrollArea scrollbars="y" type="auto">
                    <TabPanelDeployments elementFqn={logicalElement.id} />
                  </ScrollArea>
                </TabsPanel>
              )}
            </Tabs>
          </MetadataProvider>
          <div className={styles.cardFooter}>
            <div>
              <SmallLabel>kind</SmallLabel>
              <Badge
                radius={'sm'}
                size="sm"
                fw={600}
                color="gray"
                style={{
                  cursor: 'pointer',
                }}
                onClick={e => {
                  e.stopPropagation()
                  diagram.openSearch(`kind:${elementModel.kind}`)
                }}
              >
                {elementModel.kind}
              </Badge>
            </div>
            {nodeModel?.$node.diffStatus && (
              <div>
                <SmallLabel>diff</SmallLabel>
                <Badge
                  radius={'sm'}
                  size="sm"
                  fw={600}
                  variant="light"
                  color={diffStatusColor[nodeModel.$node.diffStatus]}
                >
                  {nodeModel.$node.diffStatus}
                </Badge>
              </div>
            )}
            {elementModel.tags.length > 0 && (
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <SmallLabel>tags</SmallLabel>
                <ElementTags
                  tags={elementModel.tags}
                  onClick={tag => diagram.openSearch(`#${tag}`)} />
              </div>
            )}
          </div>
          <m.div
            className={styles.resizeHandle}
            drag
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleResize}
            onDragEnd={handleResizeEnd}
            onDoubleClick={resetCard}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} />
        </m.div>
      </RemoveScroll>
    </m.dialog>
  )
}

const ViewButton = <A extends Any>({
  view,
  onNavigateTo,
}: {
  view: ComputedView<A> | DiagramView<A>
  onNavigateTo: OnNavigateTo<A>
}) => {
  return (
    <UnstyledButton className={styles.viewButton} onClick={e => onNavigateTo(view.id, e)}>
      <Group gap={6} align="start" wrap="nowrap">
        <ThemeIcon size={'sm'} variant="transparent">
          {view._type === 'deployment'
            ? <IconStack2 stroke={1.8} />
            : <IconZoomScan stroke={1.8} />}
        </ThemeIcon>
        <Box>
          <Text component="div" className={styles.viewButtonTitle} lineClamp={1}>
            {view.title || 'untitled'}
          </Text>
          {
            /* {view.description && (
            <Text component="div" mt={2} fz={'xs'} c={'dimmed'} lh={1.4} lineClamp={1}>
              {view.description}
            </Text>
          )} */
          }
        </Box>
      </Group>
    </UnstyledButton>
  )
}

function Fact({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <section>
      <h4 className={styles.factLabel}>{label}</h4>
      <div className={styles.factValues}>{children}</div>
    </section>
  )
}

function ElementTags({ tags, onClick }: { tags: readonly string[]; onClick: (tag: string) => void }) {
  return (
    <Flex gap={4} flex={1} wrap="wrap" align="center">
      {tags.map((tag) => (
        <ElementTag
          key={tag}
          tag={tag}
          cursor="pointer"
          onClick={e => {
            e.stopPropagation()
            onClick(tag)
          }}
        />
      ))}
    </Flex>
  )
}
