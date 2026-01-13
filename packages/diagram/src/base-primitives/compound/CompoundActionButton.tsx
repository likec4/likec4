import { cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconZoomScan } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { Simplify } from 'type-fest'
import type { BaseNodeProps } from '../../base/types'
import { stopPropagation } from '../../utils/xyflow'
import { compoundActionBtn } from './actionbtns.css'

type CompoundActionButtonProps = Simplify<
  BaseNodeProps & {
    icon?: ReactNode
    onClick: (e: ReactMouseEvent) => void
  }
>

export function CompoundActionButton({
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: CompoundActionButtonProps) {
  // Debounce first "isHovered"
  const debounced = useDebouncedValue(isHovered, isHovered ? 130 : 0)
  const isHoverDebounced = debounced[0] && isHovered
  return (
    <m.div
      initial={false}
      animate={{
        scale: isHoverDebounced ? 1.2 : 1,
        x: isHoverDebounced ? -1 : 0,
        y: isHoverDebounced ? -1 : 0,
      }}
      whileHover={{
        scale: 1.4,
        x: -3,
        y: -1,
      }}
      className="likec4-compound-navigation compound-action"
      whileTap={{ scale: 1 }}
      onClick={stopPropagation}
      tabIndex={-1}
    >
      <ActionIcon
        className={cx(
          'nodrag nopan',
          compoundActionBtn({
            delay: isHovered && !isHoverDebounced,
          }),
          actionBtn({ variant: 'transparent' }),
        )}
        tabIndex={-1}
        // Otherwise node receives click event and is selected
        onClick={onClick}
        onDoubleClick={stopPropagation}
      >
        {icon ?? <IconZoomScan stroke={2} />}
      </ActionIcon>
    </m.div>
  )
}
