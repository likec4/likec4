import { invariant } from '@likec4/core'
import type { DynamicViewDisplayVariant } from '@likec4/core/types'
import { css } from '@likec4/styles/css'
import { type ButtonProps, type SegmentedControlItem, Button } from '@mantine/core'
import {
  IconPlayerPlayFilled,
} from '@tabler/icons-react'
import { type HTMLMotionProps, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { selectDiagramContext, useDiagram } from '../../hooks/useDiagram'
import { Tooltip } from '../_common'
import { useNavigationActor } from '../hooks'
import { DynamicViewModeSwitcher } from './DynamicViewModeSwitcher'

export const TriggerWalkthroughButton = forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<'button'>>((
  props,
  ref,
) => (
  <Button
    variant="filled"
    size="xs"
    fw="500"
    {...props}
    ref={ref}
    component={m.button}
    whileTap={{
      scale: 0.95,
    }}
    layout="position"
    layoutId={'trigger-dynamic-walkthrough'}
    className={css({
      flexShrink: 0,
    })}
  />
))

export function StartWalkthroughButton() {
  const { enableCompareWithLatest } = useEnabledFeatures()
  const diagram = useDiagram()
  const actor = useNavigationActor()

  let tooltipLabel = 'Start Dynamic View Walkthrough'
  switch (true) {
    // case !enableReadOnly:
    //   tooltipLabel = 'Walkthrough not available in Edit mode'
    //   break
    case enableCompareWithLatest:
      tooltipLabel = 'Walkthrough not available when Compare is active'
      break
  }

  return (
    <Tooltip label={tooltipLabel}>
      <TriggerWalkthroughButton
        onClick={e => {
          e.stopPropagation()
          actor.closeDropdown()
          diagram.startWalkthrough()
        }}
        initial={{ opacity: 0, scale: 0.9, translateX: -10 }}
        animate={{ opacity: 1, scale: 1, translateX: 0 }}
        exit={{ opacity: 0, translateX: -20 }}
        size="compact-xs"
        h={26}
        disabled={enableCompareWithLatest}
        classNames={{
          label: css({
            display: {
              base: 'none',
              '@/md': 'inherit',
            },
          }),
          section: css({
            marginInlineStart: {
              base: '0',
              '@/md': '2',
            },
          }),
        }}
        rightSection={<IconPlayerPlayFilled size={10} />}
      >
        Start
      </TriggerWalkthroughButton>
    </Tooltip>
  )
}

export function DynamicViewControls() {
  return (
    <>
      <DynamicViewModeSwitcher />
      <StartWalkthroughButton />
    </>
  )
}
