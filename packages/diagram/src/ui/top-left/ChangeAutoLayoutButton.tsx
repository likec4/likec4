import type { AutoLayoutDirection } from '@likec4/core'
import {
  ActionIcon as MantineActionIcon,
  Box,
  FloatingIndicator,
  Group,
  Popover,
  PopoverDropdown,
  type PopoverProps,
  PopoverTarget,
  Stack,
  Text,
  TooltipGroup
} from '@mantine/core'
import { IconArrowBigDownLines, IconLayoutDashboard } from '@tabler/icons-react'
import { useState } from 'react'
import { useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { ActionIcon, Tooltip } from './_shared'
import * as css from './styles.css'

const DirectionActionIcon = MantineActionIcon.withProps({
  size: 'md',
  variant: 'subtle',
  color: 'gray'
})

export const ChangeAutoLayoutButton = (props: PopoverProps) => {
  const store = useDiagramStoreApi()
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const [controlsRefs, setControlsRefs] = useState<Record<AutoLayoutDirection, HTMLButtonElement | null>>({} as any)
  const autoLayout = useDiagramState(s => s.view.autoLayout)

  const setControlRef = (name: AutoLayoutDirection) => (node: HTMLButtonElement) => {
    controlsRefs[name] = node
    setControlsRefs(controlsRefs)
  }

  const setAutoLayout = (layout: AutoLayoutDirection) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    store.getState().onChange?.({
      change: {
        op: 'change-autolayout',
        layout
      }
    })
  }

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
        <Tooltip label="Change Auto Layout">
          <ActionIcon>
            <IconLayoutDashboard />
          </ActionIcon>
        </Tooltip>
      </PopoverTarget>
      <PopoverDropdown className="likec4-top-left-panel" p={8} pt={4}>
        <Box pos={'relative'} ref={setRootRef}>
          <FloatingIndicator
            target={controlsRefs[autoLayout.direction]}
            parent={rootRef}
            className={css.autolayoutIndicator}
          />
          <Box mb={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Auto layout:</Text>
          </Box>
          <TooltipGroup openDelay={100}>
            <Stack align="center" gap={1}>
              <Tooltip label="Top to Bottom">
                <DirectionActionIcon
                  className={css.autolayoutIcon}
                  ref={setControlRef('TB')}
                  onClick={setAutoLayout('TB')}>
                  <IconArrowBigDownLines />
                </DirectionActionIcon>
              </Tooltip>
              <Group gap={30}>
                <Tooltip label="Left to Right">
                  <DirectionActionIcon
                    className={css.autolayoutIcon}
                    ref={setControlRef('LR')}
                    onClick={setAutoLayout('LR')}>
                    <IconArrowBigDownLines style={{ rotate: '270deg' }} />
                  </DirectionActionIcon>
                </Tooltip>
                <Tooltip label="Right to Left">
                  <DirectionActionIcon
                    className={css.autolayoutIcon}
                    ref={setControlRef('RL')}
                    onClick={setAutoLayout('RL')}>
                    <IconArrowBigDownLines style={{ rotate: '90deg' }} />
                  </DirectionActionIcon>
                </Tooltip>
              </Group>
              <Tooltip label="Bottom to Top">
                <DirectionActionIcon
                  className={css.autolayoutIcon}
                  ref={setControlRef('BT')}
                  onClick={setAutoLayout('BT')}>
                  <IconArrowBigDownLines style={{ rotate: '180deg' }} />
                </DirectionActionIcon>
              </Tooltip>
            </Stack>
          </TooltipGroup>
        </Box>
      </PopoverDropdown>
    </Popover>
  )
}
