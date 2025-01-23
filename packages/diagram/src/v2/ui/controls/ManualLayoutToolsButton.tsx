import { type PopoverProps, ActionIconGroup, Group, Popover, PopoverDropdown, PopoverTarget } from '@mantine/core'
import {
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutBoardSplit,
  IconLayoutCollage,
  IconRouteOff,
} from '@tabler/icons-react'
import { useDiagram } from '../../hooks'
import { ActionIcon, Tooltip } from './_shared'

const Action = ({
  label,
  icon,
  onClick,
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
  const diagram = useDiagram()

  return (
    <Popover
      position="right-start"
      clickOutsideEvents={[
        'pointerdown',
      ]}
      radius="xs"
      shadow="lg"
      offset={{
        mainAxis: 10,
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
              label="Align in columns"
              icon={<IconLayoutBoardSplit />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Column')
              }} />
            <Action
              label="Align left"
              icon={<IconLayoutAlignLeft />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Left')
              }} />
            <Action
              label="Align center"
              icon={<IconLayoutAlignCenter />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Center')
              }} />
            <Action
              label="Align right"
              icon={<IconLayoutAlignRight />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Right')
              }} />
            <Action
              label="Align in rows"
              icon={<IconLayoutBoardSplit style={{ transform: 'rotate(90deg)' }} />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Row')
              }} />
            <Action
              label="Align top"
              icon={<IconLayoutAlignTop />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Top')
              }} />
            <Action
              label="Align middle"
              icon={<IconLayoutAlignMiddle />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Middle')
              }} />
            <Action
              label="Align bottom"
              icon={<IconLayoutAlignBottom />}
              onClick={e => {
                e.stopPropagation()
                diagram.align('Bottom')
              }} />
          </ActionIconGroup>
          <Action
            label="Reset all control points"
            icon={<IconRouteOff />}
            onClick={e => {
              e.stopPropagation()
              diagram.resetEdgeControlPoints()
            }} />
        </Group>
      </PopoverDropdown>
    </Popover>
  )
}
