import { type LayoutType, invariant } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { type SegmentedControlItem, SegmentedControl } from '@mantine/core'
import * as m from 'motion/react-m'
import { useMemo } from 'react'

export function LayoutTypeSwitcher({
  value,
  onChange,
}: {
  value: LayoutType
  onChange: (layout: LayoutType) => void
}) {
  const data = useMemo((): SegmentedControlItem[] => [
    { value: 'manual', label: 'Saved' },
    { value: 'auto', label: 'Latest' },
  ], [])
  return (
    <m.div layout="position">
      <SegmentedControl
        size="xs"
        color={value === 'manual' ? 'orange' : 'green'}
        value={value}
        component={m.div}
        onChange={layout => {
          invariant(layout === 'manual' || layout === 'auto', 'Invalid layout type')
          onChange(layout)
        }}
        classNames={{
          label: css({
            fontSize: 'xxs',
            fontWeight: 'medium',
          }),
        }}
        data={data} />
    </m.div>
  )
}
