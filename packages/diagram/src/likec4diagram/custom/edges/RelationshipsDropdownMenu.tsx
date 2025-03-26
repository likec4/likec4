import {
  type DiagramEdge,
  type EdgeId,
  type LikeC4Model,
  type NodeId,
  DiagramNode,
  nameFromFqn,
} from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
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
import { type MouseEventHandler, type PropsWithChildren, forwardRef, Fragment, memo, useCallback } from 'react'
import { filter, isTruthy, map, partition, pipe } from 'remeda'
import { Link } from '../../../components/Link'
import { IfEnabled, useDiagramEventHandlers, useEnabledFeature } from '../../../context'
import { useMantinePortalProps } from '../../../hooks'
import { useDiagram, useDiagramContext } from '../../../hooks/useDiagram'
import { useLikeC4Model } from '../../../likec4model'
import { findDiagramEdge, findDiagramNode } from '../../../state/utils'
import * as styles from './RelationshipsDropdownMenu.css'

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

export const RelationshipsDropdownMenu = memo((
  {
    edgeId,
    source,
    target,
    disabled = false,
    children,
  }: PropsWithChildren<{
    edgeId: EdgeId
    source: string
    target: string
    disabled?: boolean | undefined
  }>,
) => {
  const { diagramEdge, sourceNode, targetNode } = useDiagramContext(ctx => ({
    diagramEdge: findDiagramEdge(ctx, edgeId),
    sourceNode: findDiagramNode(ctx, source),
    targetNode: findDiagramNode(ctx, target),
  }))
  const likec4model = useLikeC4Model(true)
  const diagram = useDiagram()

  const portalProps = useMantinePortalProps()
  const onClickOpenOverlay = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation()
    diagram.openRelationshipDetails(edgeId)
  }, [edgeId])

  if (!diagramEdge || !sourceNode || !targetNode) {
    return <>{children}</>
  }

  // const { source, target } = diagramEdge

  // invariant(sourceNode.type !== 'view-group', 'View group node cannot have relationships')
  // invariant(targetNode.type !== 'view-group', 'View group node cannot have relationships')

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

  const renderRelationship = (relationship: LikeC4Model.AnyRelation, index: number) => (
    <Fragment key={relationship.id}>
      {index > 0 && <MenuDivider opacity={0.65} />}
      <MenuItem
        onClick={onClickOpenOverlay}
        component={Relationship}
        relationship={relationship}
        sourceNode={sourceNode}
        targetNode={targetNode}
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
      closeOnClickOutside
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      closeOnEscape
      keepMounted={false}
      closeOnItemClick={false}
      disabled={disabled}
      position="bottom-start"
      middlewares={{ size: { padding: 8 } }}
      {...portalProps}
    >
      <MenuTarget>
        {children}
      </MenuTarget>
      <MenuDropdown
        className={styles.menuDropdown}
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
})

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
  const viewId = diagram.currentView.id

  const sourceId = getShortId(r, r.source.id, sourceNode)
  const targetId = getShortId(r, r.target.id, targetNode)
  const navigateTo = enableNavigateTo && r.navigateTo?.id !== viewId ? r.navigateTo?.id : undefined
  const links = r.links

  return (
    <Stack ref={ref} className={cx(styles.menuItemRelationship, className)} {...props}>
      <Group gap={4}>
        <Text component="div" className={cx(css({ likec4Palette: sourceNode.color }), styles.endpoint)}>
          {sourceId}
        </Text>
        <IconArrowRight stroke={2.5} size={'11px'} />
        <Text component="div" className={cx(css({ likec4Palette: targetNode.color }), styles.endpoint)}>
          {targetId}
        </Text>
        {(navigateTo || !!onOpenSource) && (
          <TooltipGroup openDelay={100}>
            <Space w={'xs'} />
            {navigateTo && (
              <Tooltip label={'Open dynamic view'}>
                <ActionIcon
                  className={cx('nodrag nopan')}
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
            <IfEnabled feature="Vscode">
              <Tooltip label={'Open source'}>
                <ActionIcon
                  className={cx('nodrag nopan')}
                  size={'sm'}
                  radius="sm"
                  variant="default"
                  onPointerDownCapture={stopPropagation}
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
      </Group>
      <Box className={styles.title}>{r.title || 'untitled'}</Box>
      {r.description && <Text size="xs" c="dimmed">{r.description}</Text>}
      {links.length > 0 && (
        <Stack
          gap={3}
          justify="stretch"
          align="stretch">
          {links.map((link) => <Link key={link.url} size="sm" value={link} />)}
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
