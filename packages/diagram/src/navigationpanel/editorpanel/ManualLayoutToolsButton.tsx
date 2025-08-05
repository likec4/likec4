import { css } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import {
  type PopoverProps,
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
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
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
    <PanelActionIcon
      classNames={{
        root: 'action-icon',
        icon: css({
          '& > svg': {
            width: '70%',
            height: '70%',
          },
        }),
      }}
      onClick={onClick}>
      {icon}
    </PanelActionIcon>
  </Tooltip>
)

export const ManualLayoutToolsButton = (props: PopoverProps) => {
  const diagram = useDiagram()
  const portalProps = useMantinePortalProps()
  return (
    <Popover
      position="right"
      offset={{
        mainAxis: 12,
      }}
      clickOutsideEvents={[
        'pointerdown',
      ]}
      {...portalProps}
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
          gap: '0.5',
          layerStyle: 'likec4.panel',
          padding: '1',
          pointerEvents: 'all',
        })}>
        <TooltipGroup>
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
          <Action
            label="Reset all control points"
            icon={<IconRouteOff />}
            onClick={e => {
              e.stopPropagation()
              diagram.resetEdgeControlPoints()
            }} />
        </TooltipGroup>
      </PopoverDropdown>
    </Popover>
  )
}
