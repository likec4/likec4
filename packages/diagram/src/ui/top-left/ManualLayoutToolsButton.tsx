import { ActionIconGroup, Group, Popover, PopoverDropdown, type PopoverProps, PopoverTarget } from '@mantine/core'
import {
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutCollage,
  IconRouteOff
} from '@tabler/icons-react'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import { ActionIcon, Tooltip } from './_shared'

const Action = ({
  label,
  icon,
  onClick
}: {
  label: string
  icon: React.ReactNode
  onClick: React.MouseEventHandler
}) => (
  <Tooltip label={label} withinPortal={false} position="top">
    <ActionIcon onClick={onClick}>
      {icon}
    </ActionIcon>
  </Tooltip>
)

export const ManualLayoutToolsButton = (props: PopoverProps) => {
  const store = useDiagramStoreApi()

  return (
    <Popover
      position="right-start"
      clickOutsideEvents={[
        'pointerdown'
      ]}
      radius="xs"
      shadow="lg"
      offset={{
        mainAxis: 10
      }}
      {...props}>
      <PopoverTarget>
        <Tooltip label="Manual layouting tools" withinPortal={false} position="top-end">
          <ActionIcon>
            <IconLayoutCollage />
          </ActionIcon>
        </Tooltip>
      </PopoverTarget>
      <PopoverDropdown p={0}>
        <Group gap={'xs'}>
          <ActionIconGroup pos={'relative'}>
            <Action
              label="Align left"
              icon={<IconLayoutAlignLeft />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Left')
              }} />
            <Action
              label="Align center"
              icon={<IconLayoutAlignCenter />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Center')
              }} />
            <Action
              label="Align right"
              icon={<IconLayoutAlignRight />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Right')
              }} />
            <Action
              label="Align top"
              icon={<IconLayoutAlignTop />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Top')
              }} />
            <Action
              label="Align middle"
              icon={<IconLayoutAlignMiddle />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Middle')
              }} />
            <Action
              label="Align bottom"
              icon={<IconLayoutAlignBottom />}
              onClick={e => {
                e.stopPropagation()
                store.getState().align('Bottom')
              }} />
          </ActionIconGroup>
          <Action
            label="Reset all control points"
            icon={<IconRouteOff />}
            onClick={e => {
              e.stopPropagation()
              store.getState().resetEdgeControlPoints()
            }} />
        </Group>
      </PopoverDropdown>
    </Popover>
  )
}
