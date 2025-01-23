import type { AutoLayoutDirection } from '@likec4/core'
import {
  type PopoverProps,
  Box,
  Flex,
  FloatingIndicator,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Text,
  UnstyledButton,
} from '@mantine/core'
import {
  type UseMovePosition,
  clampUseMovePosition,
  useHover,
  useMergedRef,
  useMove,
  useUncontrolled,
} from '@mantine/hooks'
import { useDebouncedCallback } from '@react-hookz/web'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { forwardRef, useState } from 'react'
import { useDiagramEventHandlers } from '../../../context'
import { useDiagram, useDiagramContext } from '../../../hooks2'
import type { DiagramContext } from '../../state/machine'
import { ActionIcon, Tooltip } from './_shared'
import * as css from './styles.css'

const selector = (state: DiagramContext) => ({
  viewId: state.view.id,
  autoLayout: state.view.autoLayout,
})

export const ChangeAutoLayoutButton = (props: PopoverProps) => {
  const {
    onChange,
  } = useDiagramEventHandlers()
  const diagram = useDiagram()
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const [controlsRefs, setControlsRefs] = useState<Record<AutoLayoutDirection, HTMLButtonElement | null>>({} as any)
  const {
    autoLayout,
    viewId,
  } = useDiagramContext(selector)

  const { ref, hovered: isSpacingHovered } = useHover()

  const setControlRef = (name: AutoLayoutDirection) => (node: HTMLButtonElement) => {
    controlsRefs[name] = node
    setControlsRefs(controlsRefs)
  }

  const setAutoLayout = (direction: AutoLayoutDirection) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onChange?.({
      change: {
        op: 'change-autolayout',
        layout: {
          ...autoLayout,
          direction,
        },
      },
    })
  }

  const setSpacing = (nodeSep: number | null, rankSep: number | null) => {
    // Force fitDiagram
    diagram.fitDiagram()
    onChange?.({
      change: {
        op: 'change-autolayout',
        layout: {
          ...autoLayout,
          nodeSep,
          rankSep,
        },
      },
    })
  }

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
const SpacingSliders = forwardRef<HTMLDivElement | null, {
  isVertical: boolean
  nodeSep: number | undefined
  rankSep: number | undefined
  onChange: (nodeSep: number, rankSep: number) => void
}>(({
  isVertical,
  nodeSep,
  rankSep,
  onChange,
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
    250,
    2000,
  )

  const [value, setValue] = useUncontrolled({
    defaultValue: clampUseMovePosition({
      x: (nodeSep ?? 100) / MAX_SPACING,
      y: (rankSep ?? 120) / MAX_SPACING,
    }),
    onChange: propagateChange,
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
          top: `${value.y * 100}%`,
        }}
      />
      <Box pos={'absolute'} left={2} bottom={2}>
        <Text component="div" fz={8} c={'dimmed'} fw={500}>{rankSepValue}, {nodeSepValue}</Text>
      </Box>
    </Box>
  )
})
