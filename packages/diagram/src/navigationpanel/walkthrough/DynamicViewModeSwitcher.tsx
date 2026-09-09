import type { DynamicViewDisplayVariant } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { type SegmentedControlItem, SegmentedControl } from '@mantine/core'
import { m } from 'motion/react'
import { useRef } from 'react'
import { selectDiagramContext, useDiagram, useDiagramSelector } from '../../hooks'

const dynamicViewModes = [
  {
    value: 'diagram',
    label: 'Diagram',
  },
  {
    value: 'sequence',
    label: 'Sequence',
  },
] satisfies SegmentedControlItem<DynamicViewDisplayVariant>[]

const selectDynamicViewVariant = selectDiagramContext(c => c.dynamicViewVariant)

export function DynamicViewModeSwitcher() {
  const value = useDiagramSelector(selectDynamicViewVariant)
  const diagram = useDiagram()

  const controlAnimation = useRef({
    initial: { opacity: 0, translateX: -10 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: -10 },
  })

  return (
    <m.div
      layout="position"
      {...controlAnimation.current}
    >
      <SegmentedControl<DynamicViewDisplayVariant>
        value={value}
        data={dynamicViewModes}
        onChange={variant => {
          diagram.switchDynamicViewVariant(variant)
        }}
        size="xs"
        classNames={{
          label: css({
            fontSize: 'xxs',
          }),
        }}
      />
    </m.div>
  )
}
