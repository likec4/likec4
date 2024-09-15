import { type DiagramNode, LikeC4Model, nameFromFqn } from '@likec4/core'
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
  Text
} from '@mantine/core'
import { IconArrowRight, IconFileSymlink, IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { forwardRef, type MouseEventHandler, type PropsWithChildren } from 'react'
import { map, partition, pipe } from 'remeda'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps, useXYNodesData } from '../../hooks'
import type { RelationshipData } from '../types'
import * as css from './RelationshipsDropdownMenu.css'

const stopPropagation: MouseEventHandler = (e) => e.stopPropagation()

export function RelationshipsDropdownMenu(
  { edge, likec4model, children }: PropsWithChildren<{
    edge: RelationshipData['edge']
    likec4model: LikeC4Model.Layouted
  }>
) {
  const portalProps = useMantinePortalProps()
  const [sourceXYNode, targetXYNode] = useXYNodesData([edge.source, edge.target])

  if (!sourceXYNode || !targetXYNode) return children

  const [direct, nested] = pipe(
    edge.relations,
    map(id => likec4model.relationship(id)),
    partition(r => r.relationship.source === edge.source && r.relationship.target === edge.target)
  )

  const renderRelationship = (relationship: LikeC4Model.Layouted.Relationship) => (
    <MenuItem
      key={relationship.id}
      component={Relationship}
      relationship={relationship}
      sourceNode={sourceXYNode.data.element}
      targetNode={targetXYNode.data.element}
      edge={edge} />
  )

  return <Menu
    trigger={'click-hover'}
    openDelay={400}
    closeDelay={300}
    floatingStrategy={'fixed'}
    closeOnClickOutside
    clickOutsideEvents={['pointerdown']}
    closeOnEscape
    closeOnItemClick
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
      onDoubleClick={stopPropagation}
    >
      {direct.length > 0 && (
        <>
          <MenuLabel>direct</MenuLabel>
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
    </MenuDropdown>
  </Menu>

  // return (
  //   <Popover
  //     shadow="sm"
  //     radius={'sm'}
  //     // openDelay={400}
  //     // closeDelay={500}
  //     floatingStrategy={'fixed'}
  //     closeOnClickOutside={true}
  //     clickOutsideEvents={['pointerdown']}
  //     closeOnEscape={true}
  //     {...portalProps}
  //   >
  //     <PopoverTarget>
  //       {children}
  //     </PopoverTarget>
  //     <PopoverDropdown
  //       onPointerDownCapture={stopPropagation}
  //       onClick={stopPropagation}
  //       onDoubleClick={stopPropagation}
  //       miw={200}
  //       maw={500}
  //       p={8}
  //     >
  //       <Stack gap={'md'}>
  //         <RelationshipsGroup
  //           title={'direct'}
  //           relationships={direct}
  //           sourceNode={sourceXYNode.data.element}
  //           targetNode={targetXYNode.data.element}
  //           edge={edge}
  //         />
  //         <RelationshipsGroup
  //           title={'resolved from nested'}
  //           relationships={nested}
  //           sourceNode={sourceXYNode.data.element}
  //           targetNode={targetXYNode.data.element}
  //           edge={edge}
  //         />
  //       </Stack>
  //     </PopoverDropdown>
  //   </Popover>
  // )
}

//
// const RelationshipsGroup = ({
//                               title,
//                               relationships,
//                               ...props
//                             }: {
//   title: string
//   relationships: LikeC4Model.Layouted.Relationship[]
//   edge: RelationshipData['edge']
//   sourceNode: DiagramNode
//   targetNode: DiagramNode
// }) => {
//   if (relationships.length === 0) return null
//   return (
//     <Box>
//       <Divider label={title} labelPosition="left" mx={'xs'} mb={2}/>
//       {/*<Space h={'xs'} />*/}
//       <Stack gap={8}>
//         {relationships.map(r => (
//           <Relationship
//             key={r.id}
//             relationship={r}
//             {...props}
//           />
//         ))}
//       </Stack>
//     </Box>
//   )
// }

const Relationship = forwardRef<
  HTMLDivElement,
  StackProps & {
    relationship: LikeC4Model.Layouted.Relationship
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
          <>
            <Space w={'xs'} />
            {navigateTo && (
              <ActionIcon
                className={clsx('nodrag nopan')}
                size={'sm'}
                radius="sm"
                variant="light"
                color="gray"
                onPointerDownCapture={stopPropagation}
                onClick={event => {
                  event.stopPropagation()
                  diagramApi.getState().onNavigateTo?.(navigateTo, event)
                }}
                role="button"
              >
                <IconZoomScan size="80%" stroke={2} />
              </ActionIcon>
            )}
            {hasOnOpenSourceRelation && (
              <ActionIcon
                className={clsx('nodrag nopan')}
                size={'sm'}
                radius="sm"
                variant="light"
                color="gray"
                onPointerDownCapture={stopPropagation}
                onClick={event => {
                  event.stopPropagation()
                  diagramApi.getState().onOpenSourceRelation?.(r.id)
                }}
                role="button"
              >
                <IconFileSymlink size="80%" stroke={2} />
              </ActionIcon>
            )}
          </>
        )}
      </Group>
      <Box className={css.title}>{r.title || 'untitled'}</Box>
    </Stack>
  )
})
