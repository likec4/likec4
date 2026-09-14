import { invariant } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { SegmentedControl } from '@mantine/core'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { selectDiagramContext, useDiagram, useDiagramSelector } from '../hooks/useDiagram'
import type { ElementViewDisplayVariant } from '../likec4diagram/state/machine.setup'

/**
 * Diagram/Graph segmented control for element views.
 */
const ElementViewModeSwitcher = forwardRef<HTMLDivElement, {
  value: ElementViewDisplayVariant
  onChange: (variant: ElementViewDisplayVariant) => void
}>(({ value, onChange }, ref) => (
  <m.div ref={ref} layout="position">
    <SegmentedControl
      size="xs"
      value={value}
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

const selectElementViewVariant = selectDiagramContext(c => c.elementViewVariant)

/**
 * Renders the Diagram/Graph toggle for the current element view and switches the diagram's
 * display variant when the user picks a different mode.
 */
export function ElementViewControls() {
  const elementViewVariant = useDiagramSelector(selectElementViewVariant)
  const diagram = useDiagram()
  return (
    <ElementViewModeSwitcher
      value={elementViewVariant}
      onChange={mode => {
        diagram.switchElementViewVariant(mode)
      }}
    />
  )
}
