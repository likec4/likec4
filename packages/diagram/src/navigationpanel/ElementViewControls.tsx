import { invariant } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { SegmentedControl } from '@mantine/core'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { useDiagram } from '../hooks/useDiagram'
import type { ElementViewDisplayVariant } from '../likec4diagram/state/machine.setup'

/**
 * Diagram/Graph segmented control for element views.
 */
const ElementViewModeSwitcher = forwardRef<HTMLDivElement, {
  value: ElementViewDisplayVariant
  disabled: boolean
  onChange: (variant: ElementViewDisplayVariant) => void
}>(({ value, disabled, onChange }, ref) => (
  <m.div ref={ref} layout="position">
    <SegmentedControl
      size="xs"
      value={value}
      disabled={disabled}
      onChange={variant => {
        invariant(variant === 'diagram' || variant === 'graph', 'Invalid element view variant')
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
          value: 'graph',
          label: 'Graph',
        },
      ]} />
  </m.div>
))

/**
 * Renders the Diagram/Graph toggle for the current element view and switches the diagram's
 * display variant when the user picks a different mode.
 */
export function ElementViewControls({
  elementViewVariant,
  disabled = false,
}: {
  elementViewVariant: ElementViewDisplayVariant
  disabled?: boolean
}) {
  const diagram = useDiagram()
  return (
    <ElementViewModeSwitcher
      disabled={disabled}
      value={elementViewVariant}
      onChange={mode => {
        diagram.switchElementViewVariant(mode)
      }}
    />
  )
}
