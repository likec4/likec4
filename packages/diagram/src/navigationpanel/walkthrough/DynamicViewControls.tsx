import { invariant } from '@likec4/core'
import type { DynamicViewDisplayVariant } from '@likec4/core/types'
import { css } from '@likec4/styles/css'
import { type ButtonProps, Button, SegmentedControl } from '@mantine/core'
import {
  IconPlayerPlayFilled,
} from '@tabler/icons-react'
import { type HTMLMotionProps, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { useEnabledFeatures } from '../../context/DiagramFeatures'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import { Tooltip } from '../_common'
import { useNavigationActor } from '../hooks'

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

function StartWalkthroughButton() {
  const { enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const diagram = useDiagram()
  const actor = useNavigationActor()

  let tooltipLabel = 'Start Dynamic View Walkthrough'
  switch (true) {
    case !enableReadOnly:
      tooltipLabel = 'Walkthrough not available in Edit mode'
      break
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
        initial={{ opacity: 0, scale: 0.6, translateX: -10 }}
        animate={{ opacity: 1, scale: 1, translateX: 0 }}
        exit={{ opacity: 0, translateX: -20 }}
        size="compact-xs"
        h={26}
        disabled={!enableReadOnly || enableCompareWithLatest}
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

function DynamicViewModeSwitcher({
  value,
  onChange,
}: {
  value: DynamicViewDisplayVariant
  onChange: (variant: DynamicViewDisplayVariant) => void
}) {
  return (
    <m.div layout="position">
      <SegmentedControl
        size="xs"
        value={value}
        component={m.div}
        onChange={variant => {
          invariant(variant === 'diagram' || variant === 'sequence', 'Invalid dynamic view variant')
          onChange(variant)
        }}
        classNames={{
          label: css({
            fontSize: 'xxs',
          }),
        }}
        data={[
          {
            value: 'diagram',
            label: 'Diagram',
          },
          {
            value: 'sequence',
            label: 'Sequence',
          },
        ]} />
    </m.div>
  )
}

export function DynamicViewControls() {
  const dynamicViewVariant = useDiagramContext(c => c.dynamicViewVariant)
  const diagram = useDiagram()
  return (
    <AnimatePresence propagate mode="popLayout">
      <DynamicViewModeSwitcher
        key="dynamic-view-mode-switcher"
        value={dynamicViewVariant}
        onChange={mode => {
          diagram.switchDynamicViewVariant(mode)
        }}
      />
      <StartWalkthroughButton key="trigger-dynamic-walkthrough" />
    </AnimatePresence>
  )
}
