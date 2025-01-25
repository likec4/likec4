import {
  type DiagramEdge,
  type EdgeId,
  type NodeId,
  DiagramNode,
  invariant,
  LikeC4Model,
  nameFromFqn,
  nonNullable,
} from '@likec4/core'
import {
  type StackProps,
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
  Text,
  Tooltip as MantineTooltip,
  TooltipGroup,
} from '@mantine/core'
import { IconArrowRight, IconFileSymlink, IconInfoCircle, IconZoomScan } from '@tabler/icons-react'
import type { InternalNode } from '@xyflow/react'
import clsx from 'clsx'
import { type MouseEventHandler, type PropsWithChildren, forwardRef, Fragment, useCallback } from 'react'
import { filter, isTruthy, map, partition, pipe } from 'remeda'
import { useDiagramEventHandlers, useEnabledFeature } from '../../../context'
import { useDiagram, useMantinePortalProps } from '../../../hooks'
import { useLikeC4Model } from '../../../likec4model'
import type { Types } from '../../types'
import { Link } from '../../ui/diagram-title/Link'
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
  withinPortal: false,
})

export function RelationshipsDropdownMenu({
  edgeId,
  sourceNode,
  targetNode,
  disabled = false,
  children,
}: PropsWithChildren<{
  edgeId: EdgeId
  sourceNode: InternalNode<Types.Node>
  targetNode: InternalNode<Types.Node>
  disabled?: boolean | undefined
}>) {
  const likec4model = useLikeC4Model(true)
  const diagram = useDiagram()

  const portalProps = useMantinePortalProps()
  const onClickOpenOverlay = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    diagram.openRelationshipDetails(edgeId)
  }, [edgeId])

  const diagramEdge = diagram.getDiagramEdge(edgeId)
  if (!diagramEdge) {
    return <>{children}</>
  }

  const { source, target } = diagramEdge

  invariant(sourceNode.type !== 'view-group', 'View group node cannot have relationships')
  invariant(targetNode.type !== 'view-group', 'View group node cannot have relationships')

  const [direct, nested] = pipe(
    diagramEdge.relations,
    map(id => {
      try {
        return likec4model.relationship(id)
      } catch (e) {
        // View was cached, but likec4model based on new data
        console.error(
          `View is cached and likec4model missing relationship ${id} from ${source} -> ${target}`,
          e,
        )
        return null
      }
    }),
    filter(isTruthy),
    partition(r => r.source.id === source && r.target.id === target),
  )

  const renderRelationship = (relationship: LikeC4Model.AnyRelation, index: number) => (
    <Fragment key={relationship.id}>
      {index > 0 && <MenuDivider opacity={0.65} />}
      <MenuItem
        onClick={onClickOpenOverlay}
        component={Relationship}
        relationship={relationship}
        sourceNode={nonNullable(diagram.getDiagramNode(sourceNode.data.id))}
        targetNode={nonNullable(diagram.getDiagramNode(targetNode.data.id))}
        edge={diagramEdge} />
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
        <Box pos={'absolute'} top={5} right={6}>
          <ActionIcon
            size={24}
            variant="subtle"
            onClick={onClickOpenOverlay}
          >
            <IconInfoCircle style={{ width: '70%' }} />
          </ActionIcon>
        </Box>
      </MenuDropdown>
    </Menu>
  )
}

const Relationship = forwardRef<
  HTMLDivElement,
  StackProps & {
    relationship: LikeC4Model.AnyRelation
    edge: DiagramEdge
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
  const diagram = useDiagram()
  const { enableNavigateTo } = useEnabledFeature('NavigateTo')
  const { onOpenSource } = useDiagramEventHandlers()
  const viewId = diagram.currentView().id

  const sourceId = getShortId(r, r.source.id, sourceNode)
  const targetId = getShortId(r, r.target.id, targetNode)
  const navigateTo = enableNavigateTo && r.navigateTo?.id !== viewId ? r.navigateTo?.id : undefined
  const links = r.links

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
        {(navigateTo || !!onOpenSource) && (
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
                    diagram.navigateTo(navigateTo)
                  }}
                  role="button"
                >
                  <IconZoomScan size="80%" stroke={2} />
                </ActionIcon>
              </Tooltip>
            )}
            {!!onOpenSource && (
              <Tooltip label={'Open source'}>
                <ActionIcon
                  className={clsx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onPointerDownCapture={stopPropagation}
                  onClick={event => {
                    event.stopPropagation()
                    onOpenSource({ relation: r.id })
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
      {r.description && <Text size="xs" c="dimmed">{r.description}</Text>}
      {links.length > 0 && (
        <Stack
          gap={3}
          justify="stretch"
          align="stretch">
          {links.map((link) => <Link key={link.url} link={link} />)}
        </Stack>
      )}
    </Stack>
  )
})

function getShortId(
  r: LikeC4Model.AnyRelation<LikeC4Model.Any>,
  actualEndpointId: NodeId<string>,
  diagramNode: DiagramNode,
) {
  const diagramNodeId = r.isDeploymentRelation()
    // Relation defined in deployment model. Use id of the deployment node as is.
    ? diagramNode.id
    // Relation defined in model. Get id of the model element
    : DiagramNode.modelRef(diagramNode) || ''

  return nameFromFqn(diagramNodeId) + actualEndpointId.slice(diagramNodeId.length)
}
