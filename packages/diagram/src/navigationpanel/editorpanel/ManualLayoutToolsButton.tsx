import { css } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import {
  type PopoverProps,
  ActionIcon,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  TooltipGroup,
} from '@mantine/core'
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
import { useDiagram } from '../../hooks/useDiagram'
import { PanelActionIcon } from '../_common'
import { Tooltip } from './_common'

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
    <ActionIcon
      classNames={{
        root: 'action-icon',
        icon: css({
          '& > svg': {
            width: '70%',
            height: '70%',
          },
        }),
      }}
      variant="subtle"
      color="gray"
      onClick={onClick}>
      {icon}
    </ActionIcon>
  </Tooltip>
)

export const ManualLayoutToolsButton = (props: PopoverProps) => {
  const diagram = useDiagram()

  return (
    <Popover
      position="right-start"
      offset={{
        mainAxis: 10,
        crossAxis: -2,
      }}
      clickOutsideEvents={[
        'pointerdown',
      ]}
      radius="sm"
      shadow="lg"
      {...props}>
      <PopoverTarget>
        <Tooltip label="Manual layouting tools">
          <PanelActionIcon>
            <IconLayoutCollage />
          </PanelActionIcon>
        </Tooltip>
      </PopoverTarget>
      <PopoverDropdown
        className={hstack({
          gap: 1,
          layerStyle: 'likec4.panel',
          p: '2',
        })}>
        <TooltipGroup>
          <Action
            label="Align in columns"
            icon={<IconLayoutBoardSplit stroke={1.2} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Column')
            }} />
          <Action
            label="Align left"
            icon={<IconLayoutAlignLeft stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Left')
            }} />
          <Action
            label="Align center"
            icon={<IconLayoutAlignCenter stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Center')
            }} />
          <Action
            label="Align right"
            icon={<IconLayoutAlignRight stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Right')
            }} />
          <Action
            label="Align in rows"
            icon={<IconLayoutBoardSplit stroke={1.5} style={{ transform: 'rotate(90deg)' }} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Row')
            }} />
          <Action
            label="Align top"
            icon={<IconLayoutAlignTop stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Top')
            }} />
          <Action
            label="Align middle"
            icon={<IconLayoutAlignMiddle stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Middle')
            }} />
          <Action
            label="Align bottom"
            icon={<IconLayoutAlignBottom stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.align('Bottom')
            }} />
          <Action
            label="Reset all control points"
            icon={<IconRouteOff stroke={1.5} />}
            onClick={e => {
              e.stopPropagation()
              diagram.resetEdgeControlPoints()
            }} />
        </TooltipGroup>
      </PopoverDropdown>
    </Popover>
  )
}
