import type { AutoLayoutDirection } from '@likec4/core'
import {
  Box,
  Flex,
  FloatingIndicator,
  Popover,
  PopoverDropdown,
  type PopoverProps,
  PopoverTarget,
  Text,
  UnstyledButton
} from '@mantine/core'
import {
  clampUseMovePosition,
  useHover,
  useMergedRef,
  useMove,
  type UseMovePosition,
  useUncontrolled
} from '@mantine/hooks'
import { useDebouncedCallback } from '@react-hookz/web'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { forwardRef, useState } from 'react'
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

  const { ref, hovered: isSpacingHovered } = useHover()

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

  const setSpacing = (nodeSep: number | null, rankSep: number | null) => {
    // Force fitDiagram
    store.setState({
      viewportChanged: false
    })
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
      <PopoverDropdown className="likec4-top-left-panel" p={8} pt={6} opacity={isSpacingHovered ? 0.6 : 1}>
        <Box pos={'relative'} ref={setRootRef}>
          <FloatingIndicator
            target={controlsRefs[autoLayout.direction]}
            parent={rootRef}
            className={css.autolayoutIndicator}
          />
          <Box mb={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Auto layout:</Text>
          </Box>
          <Flex gap={2} wrap={'wrap'} justify={'stretch'} maw={160}>
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
          </Flex>
          <Box my={10}>
            <Text inline fz={'xs'} c={'dimmed'} fw={500}>Spacing:</Text>
          </Box>
          <SpacingSliders
            ref={ref}
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

const MAX_SPACING = 400
const SpacingSliders = forwardRef<HTMLDivElement, {
  isVertical: boolean
  nodeSep: number | undefined
  rankSep: number | undefined
  onChange: (nodeSep: number, rankSep: number) => void
}>(({
  isVertical,
  nodeSep,
  rankSep,
  onChange
}, _ref) => {
  if (!isVertical) {
    ;[nodeSep, rankSep] = [rankSep, nodeSep]
  }

  const propagateChange = useDebouncedCallback(
    ({ x, y }: UseMovePosition) => {
      if (!isVertical) {
        ;[x, y] = [y, x]
      }
      onChange(Math.round(x * MAX_SPACING), Math.round(y * MAX_SPACING))
    },
    [onChange, isVertical],
    150,
    2000
  )

  const [value, setValue] = useUncontrolled({
    defaultValue: clampUseMovePosition({
      x: (nodeSep ?? 100) / MAX_SPACING,
      y: (rankSep ?? 120) / MAX_SPACING
    }),
    onChange: propagateChange
  })

  const { ref } = useMove(setValue)

  let nodeSepValue = Math.round(value.x * MAX_SPACING)
  let rankSepValue = Math.round(value.y * MAX_SPACING)
  if (!isVertical) {
    ;[nodeSepValue, rankSepValue] = [rankSepValue, nodeSepValue]
  }

  const mergedRef = useMergedRef(ref, _ref)

  return (
    <Box ref={mergedRef} className={css.spacingSliderBody} pt={'100%'}>
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
})
