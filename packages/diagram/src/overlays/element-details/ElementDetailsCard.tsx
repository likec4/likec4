// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// oxlint-disable no-misused-spread
import { ancestorsFqn, isAncestor, nameFromFqn, nonNullable } from '@likec4/core'
import type { ElementModel } from '@likec4/core/model'
import type {
  DeploymentFqn,
  Fqn,
  NodeId,
  ViewId,
} from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { HStack, styled, Txt } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  ActionIcon,
  ActionIconGroup,
  Badge,
  CloseButton,
  Collapse,
  Flex,
  RemoveScroll,
  ScrollArea,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Tooltip as MantineTooltip,
  UnstyledButton,
} from '@mantine/core'
import { useClipboard, useDisclosure, useLocalStorage, useSessionStorage, useViewportSize } from '@mantine/hooks'
import { useDebouncedCallback, useTimeoutEffect } from '@react-hookz/web'
import {
  IconCaretRightFilled,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileSymlink,
  IconZoomScan,
} from '@tabler/icons-react'
import type { Rect } from '@xyflow/system'
import { type PanInfo, m, useDragControls, useMotionValue } from 'motion/react'
import { type PropsWithChildren, type SyntheticEvent, Fragment, useCallback, useRef, useState } from 'react'
import { clamp, entries, only } from 'remeda'
import { Markdown } from '../../base-primitives'
import { ElementTag } from '../../base-primitives/element/ElementTags'
import { Link } from '../../components/Link'
import { DiagramFeatures, IconRenderer, IfEnabled } from '../../context'
import { useCallbackRef, useUpdateEffect } from '../../hooks'
import { useCurrentViewModel } from '../../hooks/useCurrentViewModel'
import { useDiagram } from '../../hooks/useDiagram'
import { metadataSearchQuery } from '../../search/metadata-search'
import { stopPropagation } from '../../utils'
import * as styles from './ElementDetailsCard.css'
import { CardFooter, CardFooterSection, ElementTitle } from './ElementDetailsCard.css'
import { MetadataList, MetadataProvider } from './MetadataValue'
import { PropertiesSplit } from './PropertiesSplit'
import type { DetailsSubject } from './subject'
import { TabPanelDeployments } from './TabPanelDeployments'
import { TabPanelRelationships } from './TabPanelRelationships'
import { TabPanelStructure } from './TabPanelStructure'
import { TabPanelViews } from './TabPanelViews'

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

const MIN_PADDING = 16

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
  const windowSize = useViewportSize()
  const windowWidth = windowSize.width || window.innerWidth || 1200,
    windowHeight = windowSize.height || window.innerHeight || 800

  const [activeTab, setActiveTab] = useSessionStorage<TabName>({
    key: subject.deployment ? 'likec4:deployment-details:active-tab' : 'likec4:element-details:active-tab',
    defaultValue: 'Properties',
    getInitialValueInEffect: false,
  })

  const [opened, setOpened] = useState(activeTab !== 'Relationships')

  const diagram = useDiagram()
  const viewModel = useCurrentViewModel()
  const nodeModel = fromNode
    ? viewModel.findNode(fromNode)
    : subject.type === 'deployment'
    ? [...viewModel.nodes()].find(n => n.$node.deploymentRef === subject.deployment) ?? null
    : viewModel.findNodeWithElement(subject.element)

  const logicalElement = subject.type === 'element' ? viewModel.$model.findElement(subject.element) : null
  const deploymentElement = subject.type === 'deployment'
    ? viewModel.$model.deployment.findElement(subject.deployment)
    : null
  const elementModel = nonNullable(logicalElement ?? deploymentElement, 'Details subject not found')
  const tabs = subject.deployment ? DEPLOYMENT_TABS : TABS

  // Raw IDs avoid the strict model.view() lookup that throws when a partial model omits the target.
  let defaultViewId = nodeModel?.$node.navigateTo ?? logicalElement?.defaultView?.id ?? null
  // Ignore default view if it's the current view
  if (defaultViewId === viewId) {
    defaultViewId = null
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
    min: 0.05,
    max: 0.95,
  })
  const originY = clamp((fromPosition.y - top) / _height, {
    min: 0.05,
    max: 0.95,
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
  }, !opened ? 220 : undefined)

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
            <HStack alignItems="start" justify="space-between" gap={'sm'} flexWrap="nowrap">
              <HStack
                alignItems="start"
                gap={'sm'}
                style={{ cursor: 'default', minWidth: 0, overflow: 'hidden' }}
                flexWrap="nowrap"
              >
                {elementIcon}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <Tooltip label={elementModel.title} openDelay={600} position="bottom-start">
                    <ElementTitle>
                      {elementModel.title}
                    </ElementTitle>
                  </Tooltip>
                  {notation && (
                    <Txt dimmed size={'sm'} medium lineClamp={1} mt={'xxs'}>
                      {notation}
                    </Txt>
                  )}
                  <div style={{ marginTop: '0.25rem' }}>
                    <ElementFqn fqn={elementModel.id} />
                  </div>
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
                  {defaultViewId && (
                    <Tooltip label="Open default view">
                      <ActionIcon
                        size="lg"
                        variant="default"
                        radius="sm"
                        onClick={e => {
                          e.stopPropagation()
                          diagram.navigateTo(defaultViewId as ViewId, fromNode ?? undefined)
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
                  main={<ElementDescription element={elementModel} />}
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
                <TabPanelViews
                  elementModel={elementModel}
                  onNavigateTo={viewId => diagram.navigateTo(viewId, fromNode ?? undefined)}
                />
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
          <CardFooter>
            <CardFooterSection>
              <SmallLabel>kind</SmallLabel>
              <Txt
                size={'sm'}
                layerStyle={'surface.sunken'}
                px={'2'}
                py="0.5"
                medium
                rounded={'sm'}
                cursor={'pointer'}
                onClick={e => {
                  e.stopPropagation()
                  diagram.openSearch(`kind:${elementModel.kind}`)
                }}
              >
                {elementModel.kind}
              </Txt>
            </CardFooterSection>
            {nodeModel?.$node.diffStatus && (
              <CardFooterSection>
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
              </CardFooterSection>
            )}
            {elementModel.tags.length > 0 && (
              <CardFooterSection full>
                <SmallLabel>tags</SmallLabel>
                <ElementTags
                  tags={elementModel.tags}
                  onClick={tag => diagram.openSearch(`#${tag}`)} />
              </CardFooterSection>
            )}
          </CardFooter>
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

const FqnPart = styled('div', {
  base: {
    px: '1',
    paddingTop: '0.5',
    paddingBottom: '1.5',
    fontSize: 'xs',
    lineHeight: 'snug',
    fontWeight: 'medium',
    color: 'text.dimmed',
    borderRadius: 'sm',
    cursor: 'pointer',
    '& + &': {
      ml: '-1',
      pl: '0',
    },
    '&[data-hovered=true]': {
      color: 'text.bright',
      backgroundColor: 'surface.sunken',
    },
  },
})

const FqnSegment = styled('button', {
  base: {
    px: '1',
    paddingTop: '0.5',
    paddingBottom: '1.5',
    fontFamily: '[inherit]',
    fontSize: 'xs',
    lineHeight: 'snug',
    fontWeight: 'medium',
    color: 'text.dimmed',
    background: 'none',
    border: 'none',
    borderRadius: 'sm',
    cursor: 'pointer',
    '& + &': {
      ml: '-1',
      pl: '0',
    },
    '&[data-hovered=true]': {
      color: 'text.bright',
      backgroundColor: 'surface.sunken',
    },
    _focusVisible: {
      outline: '[2px solid var(--mantine-primary-color-filled)]',
      outlineOffset: '[-1px]',
    },
  },
})

const fqnCopyStatus = css({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'center',
  gap: '1',
  ml: '1',
  fontSize: 'xxs',
  color: 'text.dimmed',
  opacity: '0',
  transition: 'fast',
  pointerEvents: 'none',
  _groupHover: {
    opacity: '1',
  },
  _groupFocusWithin: {
    opacity: '1',
  },
  '&[data-copied=true]': {
    opacity: '1',
    color: 'teal.11',
  },
})

/**
 * Segments of an FQN, each with the path from the root to it.
 * `cloud.backend.api` → `cloud` (cloud), `backend` (cloud.backend), `api` (cloud.backend.api)
 */
export function fqnPathSegments<T extends string>(fqn: T): Array<{ name: string; path: T }> {
  return [...ancestorsFqn(fqn).toReversed(), fqn].map(path => ({ name: nameFromFqn(path), path }))
}

function ElementFqn<T extends Fqn | DeploymentFqn>({ fqn }: { fqn: T }) {
  const [hovered, setHovered] = useState<T | null>(null)
  const clipboard = useClipboard({ timeout: 1500 })

  const isHighlighted = (path: T) => !!hovered && (path === hovered || isAncestor(path, hovered))

  // Segments are inside the card header (drag handle, double-click resets the card)
  const segmentHandlers = (path: T) => ({
    onMouseEnter: () => setHovered(path),
    onMouseLeave: () => setHovered(null),
    onClick: (e: SyntheticEvent) => {
      e.stopPropagation()
      clipboard.copy(path)
    },
    onPointerDown: stopEventPropagation,
    onDoubleClick: stopEventPropagation,
  })

  const segments = fqnPathSegments(fqn)
  return (
    <HStack
      className="group"
      css={{
        gap: '0',
        alignItems: 'baseline',
      }}>
      <SmallLabel color={'text.non-essential'}>ID</SmallLabel>
      {segments.map(({ name, path }, index) => (
        <Fragment key={path}>
          {index > 0 && (
            <FqnPart
              aria-hidden
              {...segmentHandlers(segments[index - 1]!.path)}
              data-hovered={!!hovered && isAncestor(segments[index - 1]!.path, hovered)}>
              .
            </FqnPart>
          )}
          <FqnSegment
            type="button"
            aria-label={`Copy ${path}`}
            data-hovered={isHighlighted(path)}
            onFocus={() => setHovered(path)}
            onBlur={() => setHovered(null)}
            {...segmentHandlers(path)}>
            {name}
          </FqnSegment>
        </Fragment>
      ))}
      <span className={fqnCopyStatus} data-copied={clipboard.copied} role="status">
        {clipboard.copied
          ? (
            <>
              <IconCheck size={12} stroke={2.5} />
              Copied
            </>
          )
          : <IconCopy size={12} stroke={2} aria-hidden />}
      </span>
    </HStack>
  )
}

function stopEventPropagation(e: SyntheticEvent) {
  e.stopPropagation()
}

function ElementDescription<T extends Pick<ElementModel, 'hasSummary' | 'summary' | 'description'>>(
  { element }: { element: T },
) {
  const [opened, { toggle }] = useDisclosure()
  return (
    <ScrollArea className={styles.propertiesMain} scrollbars="y" type="auto" offsetScrollbars>
      {element.hasSummary && (
        <>
          <UnstyledButton
            className={hstack({
              gap: '1',
              fontSize: 'xs',
              layerStyle: opened ? 'likec4.panel.action.filled' : 'likec4.panel.action',
            })}
            aria-expanded={opened}
            onClick={toggle}>
            <div>Summary</div>
            <IconCaretRightFilled
              size={12}
              className={css({
                opacity: '0.6',
              })}
              style={{ transform: opened ? 'rotate(90deg)' : 'none' }} />
          </UnstyledButton>
          <Collapse expanded={opened}>
            <styled.div
              css={{
                paddingY: '2',
                paddingLeft: '4',
                marginY: '2',
                position: 'relative',
                _before: {
                  content: '""',
                  position: 'absolute',
                  left: '1',
                  top: '0',
                  width: '[2px]',
                  height: '100%',
                  backgroundColor: 'border.focus',
                },
              }}>
              <Markdown value={element.summary} />
            </styled.div>
          </Collapse>
        </>
      )}
      <styled.div
        css={{
          paddingX: '1',
          paddingTop: '2',
        }}>
        <Markdown fontSize="lg" value={element.description} emptyText="No description" />
      </styled.div>
    </ScrollArea>
  )
}
