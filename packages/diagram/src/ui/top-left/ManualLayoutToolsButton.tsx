import {
  ActionIconGroup,
  Group,
  Popover,
  PopoverDropdown,
  type PopoverProps,
  PopoverTarget,
  type TooltipProps
} from '@mantine/core'
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
import { useMantinePortalProps } from '../../hooks'
import { useDiagramStoreApi } from '../../hooks/useDiagramState'
import { ActionIcon, Tooltip } from './_shared'

export const ManualLAyoutToolsButton = (props: PopoverProps) => {
  const store = useDiagramStoreApi()

  const portalProps = useMantinePortalProps()

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
        <Tooltip label="Manual layouting tools">
          <ActionIcon>
            <IconLayoutCollage />
          </ActionIcon>
        </Tooltip>
      </PopoverTarget>
      <PopoverDropdown p={0}>
        <Group>
          <ActionIconGroup pos={'relative'}>
            <Tooltip label="Align left" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Left')
                }}>
                <IconLayoutAlignLeft />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Align center" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Center')
                }}>
                <IconLayoutAlignCenter />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Align right" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Right')
                }}>
                <IconLayoutAlignRight />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Align top" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Top')
                }}>
                <IconLayoutAlignTop />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Align middle" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Middle')
                }}>
                <IconLayoutAlignMiddle />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Align bottom" {...portalProps}>
              <ActionIcon
                onClick={e => {
                  e.stopPropagation()
                  store.getState().align('Bottom')
                }}>
                <IconLayoutAlignBottom />
              </ActionIcon>
            </Tooltip>
          </ActionIconGroup>
          <ResetControlPointsButton {...portalProps} />
        </Group>
      </PopoverDropdown>
    </Popover>
  )
}

const ResetControlPointsButton = (props: Omit<TooltipProps, 'label' | 'children'>) => {
  const store = useDiagramStoreApi()

  return (
    <Tooltip label="Reset all control points" {...props}>
      <ActionIcon
        onClick={e => {
          e.stopPropagation()
          store.getState().resetEdgeControlPoints()
        }}>
        <IconRouteOff />
      </ActionIcon>
    </Tooltip>
  )
}
