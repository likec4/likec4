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
  Tooltip as MantineTooltip,
  TooltipGroup
} from '@mantine/core'
import { IconArrowBigDownLines, IconLayoutDashboard } from '@tabler/icons-react'
import { useState } from 'react'
import { useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import * as css from './styles.css'

const ActionIcon = MantineActionIcon.withProps({
  size: 'md',
  variant: 'subtle',
  color: 'gray'
})

const Tooltip = MantineTooltip.withProps({
  color: 'gray',
  fz: 'xs',
  position: 'right',
  openDelay: 300,
  label: '',
  children: null,
  offset: 5,
  transitionProps: { transition: 'fade', duration: 200 }
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
        <MantineActionIcon
          className="action-icon"
          variant="light"
          color="gray">
          <IconLayoutDashboard stroke={1.3} />
        </MantineActionIcon>
      </PopoverTarget>
      <PopoverDropdown className="likec4-top-left-panel" p={8} pt={4}>
        <Box pos={'relative'} ref={setRootRef}>
          <FloatingIndicator
            target={controlsRefs[autoLayout]}
            parent={rootRef}
            className={css.autolayoutIndicator}
          />
          <Box mb={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Auto layout:</Text>
          </Box>
          <TooltipGroup openDelay={100}>
            <Stack align="center" gap={1}>
              <Tooltip label="Top to Bottom">
                <ActionIcon
                  className={css.autolayoutIcon}
                  ref={setControlRef('TB')}
                  onClick={setAutoLayout('TB')}>
                  <IconArrowBigDownLines stroke={1.3} />
                </ActionIcon>
              </Tooltip>
              <Group gap={30}>
                <Tooltip label="Left to Right">
                  <ActionIcon
                    className={css.autolayoutIcon}
                    ref={setControlRef('LR')}
                    onClick={setAutoLayout('LR')}>
                    <IconArrowBigDownLines stroke={1.3} style={{ rotate: '270deg' }} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Right to Left">
                  <ActionIcon
                    className={css.autolayoutIcon}
                    ref={setControlRef('RL')}
                    onClick={setAutoLayout('RL')}>
                    <IconArrowBigDownLines stroke={1.3} style={{ rotate: '90deg' }} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Tooltip label="Bottom to Top">
                <ActionIcon
                  className={css.autolayoutIcon}
                  ref={setControlRef('BT')}
                  onClick={setAutoLayout('BT')}>
                  <IconArrowBigDownLines stroke={1.3} style={{ rotate: '180deg' }} />
                </ActionIcon>
              </Tooltip>
            </Stack>
          </TooltipGroup>
        </Box>
      </PopoverDropdown>
    </Popover>
  )
}
