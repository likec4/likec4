import { type DiagramNode, invariant, LikeC4Model, nameFromFqn } from '@likec4/core'
import {
  ActionIcon,
  Box,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Space,
  Stack,
  type StackProps,
  Text,
  Tooltip as MantineTooltip,
  TooltipGroup
} from '@mantine/core'
import { IconArrowRight, IconArrowsMaximize, IconFileSymlink, IconInfoCircle, IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { forwardRef, Fragment, type MouseEventHandler, type PropsWithChildren, useCallback } from 'react'
import { filter, isTruthy, map, partition, pick, pipe } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps, useXYNodesData } from '../../hooks'
import type { RelationshipData } from '../types'
import * as css from './RelationshipsDropdownMenu.css'

const stopPropagation: MouseEventHandler = (e) => e.stopPropagation()

export const Tooltip = MantineTooltip.withProps({
  color: 'gray',
  fz: 'xs',
  openDelay: 300,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 8,
  withinPortal: false
})

export function RelationshipsDropdownMenu({
  edge,
  disabled = false,
  likec4model,
  children
}: PropsWithChildren<{
  edge: RelationshipData['edge']
  disabled?: boolean | undefined
  likec4model: LikeC4Model
}>) {
  const {
    openOverlay,
    enableRelationshipBrowser
  } = useDiagramState(pick(['openOverlay', 'enableRelationshipBrowser']))
  const portalProps = useMantinePortalProps()
  const [sourceXYNode, targetXYNode] = useXYNodesData([edge.source, edge.target])

  invariant(sourceXYNode, `Source XYNode ${edge.source} not found for edge ${edge.id}`)
  invariant(targetXYNode, `Target XYNode ${edge.target} not found for edge ${edge.id}`)

  const [direct, nested] = pipe(
    edge.relations,
    map(id => {
      try {
        return likec4model.relationship(id)
      } catch (e) {
        // View was cached, but likec4model based on new data
        console.error(
          `View is cached and likec4model missing relationship ${id} from ${edge.source} -> ${edge.target}`,
          e
        )
        return null
      }
    }),
    filter(isTruthy),
    partition(r => r.relationship.source === edge.source && r.relationship.target === edge.target)
  )

  const onClickOpenOverlay = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    if (enableRelationshipBrowser) {
      openOverlay({
        edgeDetails: edge.id
      })
    }
  }, [edge.id, openOverlay, enableRelationshipBrowser])

  const renderRelationship = (relationship: LikeC4Model.ViewModel.Relationship, index: number) => (
    <Fragment key={relationship.id}>
      {index > 0 && <MenuDivider opacity={0.65} />}
      <MenuItem
        onClick={onClickOpenOverlay}
        component={Relationship}
        relationship={relationship}
        sourceNode={sourceXYNode.data.element}
        targetNode={targetXYNode.data.element}
        edge={edge} />
    </Fragment>
  )

  if (direct.length + nested.length === 0) {
    return <>{children}</>
  }

  return (
    <Menu
      trigger={'click-hover'}
      openDelay={300}
      closeDelay={450}
      floatingStrategy={'fixed'}
      closeOnClickOutside
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      closeOnEscape
      closeOnItemClick={false}
      disabled={disabled}
      {...portalProps}
    >
      <MenuTarget>
        {children}
      </MenuTarget>
      <MenuDropdown
        className={css.menuDropdown}
        onPointerDownCapture={stopPropagation}
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
      >
        {direct.length > 0 && (
          <>
            <MenuLabel>direct relationships</MenuLabel>
            {direct.map(renderRelationship)}
          </>
        )}
        {nested.length > 0 && (
          <>
            {direct.length > 0 && <MenuDivider />}
            <MenuLabel>resolved from nested</MenuLabel>
            {nested.map(renderRelationship)}
          </>
        )}
        {enableRelationshipBrowser && (
          <Box pos={'absolute'} top={5} right={6}>
            <ActionIcon
              size={24}
              variant="subtle"
              onClick={onClickOpenOverlay}
            >
              <IconInfoCircle style={{ width: '70%' }} />
            </ActionIcon>
          </Box>
        )}
      </MenuDropdown>
    </Menu>
  )
}

const Relationship = forwardRef<
  HTMLDivElement,
  StackProps & {
    relationship: LikeC4Model.ViewModel.Relationship
    edge: RelationshipData['edge']
    sourceNode: DiagramNode
    targetNode: DiagramNode
  }
>(({
  className,
  relationship: r,
  edge,
  sourceNode,
  targetNode,
  ...props
}, ref) => {
  const diagramApi = useDiagramStoreApi()
  const {
    viewId,
    hasOnOpenSourceRelation,
    hasOnNavigateTo
  } = useDiagramState(s => ({
    viewId: s.view.id,
    hasOnOpenSourceRelation: !!s.onOpenSourceRelation,
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  const sourceId = nameFromFqn(edge.source) + r.source.id.slice(edge.source.length)
  const targetId = nameFromFqn(edge.target) + r.target.id.slice(edge.target.length)
  const navigateTo = hasOnNavigateTo && r.relationship.navigateTo !== viewId ? r.relationship.navigateTo : undefined

  return (
    <Stack ref={ref} className={clsx(css.menuItemRelationship, className)} {...props}>
      <Group gap={4}>
        <Text component="div" className={css.endpoint} data-likec4-color={sourceNode.color}>
          {sourceId}
        </Text>
        <IconArrowRight stroke={2.5} size={11} />
        <Text component="div" className={css.endpoint} data-likec4-color={targetNode.color}>
          {targetId}
        </Text>
        {(navigateTo || hasOnOpenSourceRelation) && (
          <TooltipGroup openDelay={100}>
            <Space w={'xs'} />
            {navigateTo && (
              <Tooltip label={'Open dynamic view'}>
                <ActionIcon
                  className={clsx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onPointerDownCapture={stopPropagation}
                  onClick={event => {
                    event.stopPropagation()
                    diagramApi.getState().onNavigateTo?.(navigateTo, event)
                  }}
                  role="button"
                >
                  <IconZoomScan size="80%" stroke={2} />
                </ActionIcon>
              </Tooltip>
            )}
            {hasOnOpenSourceRelation && (
              <Tooltip label={'Open source'}>
                <ActionIcon
                  className={clsx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onPointerDownCapture={stopPropagation}
                  onClick={event => {
                    event.stopPropagation()
                    diagramApi.getState().onOpenSourceRelation?.(r.id)
                  }}
                  role="button"
                >
                  <IconFileSymlink size="80%" stroke={2} />
                </ActionIcon>
              </Tooltip>
            )}
          </TooltipGroup>
        )}
      </Group>
      <Box className={css.title}>{r.title || 'untitled'}</Box>
    </Stack>
  )
})
