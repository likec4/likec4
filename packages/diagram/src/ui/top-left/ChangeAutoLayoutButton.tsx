import type { AutoLayoutDirection } from '@likec4/core'
import {
  Box,
  FloatingIndicator,
  Group,
  Popover,
  PopoverDropdown,
  type PopoverProps,
  PopoverTarget,
  SimpleGrid,
  Text,
  UnstyledButton
} from '@mantine/core'
import { clampUseMovePosition, useMove, type UseMovePosition, useUncontrolled } from '@mantine/hooks'
import { useDebouncedCallback } from '@react-hookz/web'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { useState } from 'react'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { ActionIcon, Tooltip } from './_shared'
import * as css from './styles.css'

const selector = (state: DiagramState) => ({
  viewId: state.view.id,
  autoLayout: state.view.autoLayout
})

export const ChangeAutoLayoutButton = (props: PopoverProps) => {
  const store = useDiagramStoreApi()
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const [controlsRefs, setControlsRefs] = useState<Record<AutoLayoutDirection, HTMLButtonElement | null>>({} as any)
  const {
    autoLayout,
    viewId
  } = useDiagramState(selector)

  const setControlRef = (name: AutoLayoutDirection) => (node: HTMLButtonElement) => {
    controlsRefs[name] = node
    setControlsRefs(controlsRefs)
  }

  const setAutoLayout = (direction: AutoLayoutDirection) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    store.getState().onChange?.({
      change: {
        op: 'change-autolayout',
        layout: {
          ...autoLayout,
          direction
        }
      }
    })
  }

  const setSpacing = (nodeSep: number, rankSep: number) => {
    store.getState().onChange?.({
      change: {
        op: 'change-autolayout',
        layout: {
          ...autoLayout,
          nodeSep,
          rankSep
        }
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
      <PopoverDropdown className="likec4-top-left-panel" p={8} pt={6}>
        <Box pos={'relative'} ref={setRootRef}>
          <FloatingIndicator
            target={controlsRefs[autoLayout.direction]}
            parent={rootRef}
            className={css.autolayoutIndicator}
          />
          <Box mb={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Auto layout:</Text>
          </Box>
          <SimpleGrid cols={2} spacing={2} verticalSpacing={4}>
            <UnstyledButton className={css.autolayoutButton} ref={setControlRef('TB')} onClick={setAutoLayout('TB')}>
              Top-Bottom
            </UnstyledButton>
            <UnstyledButton className={css.autolayoutButton} ref={setControlRef('BT')} onClick={setAutoLayout('BT')}>
              Bottom-Top
            </UnstyledButton>
            <UnstyledButton className={css.autolayoutButton} ref={setControlRef('LR')} onClick={setAutoLayout('LR')}>
              Left-Right
            </UnstyledButton>
            <UnstyledButton className={css.autolayoutButton} ref={setControlRef('RL')} onClick={setAutoLayout('RL')}>
              Right-Left
            </UnstyledButton>
          </SimpleGrid>
          <Box my={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Spacing:</Text>
          </Box>
          <SpacingSliders
            isVertical={autoLayout.direction === 'TB' || autoLayout.direction === 'BT'}
            key={viewId}
            nodeSep={autoLayout.nodeSep}
            rankSep={autoLayout.rankSep}
            onChange={setSpacing}
          />
        </Box>
      </PopoverDropdown>
    </Popover>
  )
}

const SpacingSliders = ({
  isVertical,
  nodeSep,
  rankSep,
  onChange
}: {
  isVertical: boolean
  nodeSep: number | undefined
  rankSep: number | undefined
  onChange: (nodeSep: number, rankSep: number) => void
}) => {
  if (!isVertical) {
    ;[nodeSep, rankSep] = [rankSep, nodeSep]
  }

  const propagateChange = useDebouncedCallback(
    ({ x, y }: UseMovePosition) => {
      if (!isVertical) {
        ;[x, y] = [y, x]
      }
      onChange(Math.round(x * 500), Math.round(y * 500))
    },
    [onChange, isVertical],
    150,
    2000
  )

  const [value, setValue] = useUncontrolled({
    defaultValue: clampUseMovePosition({
      x: (nodeSep ?? 250) / 500,
      y: (rankSep ?? 250) / 500
    }),
    onChange: propagateChange
  })

  const { ref } = useMove(setValue)

  let nodeSepValue = Math.round(value.x * 500)
  let rankSepValue = Math.round(value.y * 500)
  if (!isVertical) {
    ;[nodeSepValue, rankSepValue] = [rankSepValue, nodeSepValue]
  }

  return (
    <Box ref={ref} className={css.spacingSliderBody} pt={'100%'}>
      <Box
        className={css.spacingSliderThumb}
        style={{
          left: `${value.x * 100}%`,
          top: `${value.y * 100}%`
        }}
      />
      <Box pos={'absolute'} left={2} bottom={2}>
        <Text component="div" fz={8} c={'dimmed'} fw={500}>{rankSepValue}, {nodeSepValue}</Text>
      </Box>
    </Box>
  )
}
