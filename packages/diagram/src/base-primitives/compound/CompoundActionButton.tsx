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

const variants = {
  normal: {
    scale: 1,
    x: 0,
    y: 0,
  },
  hovered: {
    scale: 1.2,
    x: -1,
    y: -1,
  },
  whileHover: {
    scale: 1.4,
    x: -3,
    y: -1,
  },
  whileTap: {
    scale: 1,
  },
}

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

  let variant: keyof typeof variants = isHoverDebounced ? 'hovered' : 'normal'

  return (
    <m.div
      initial={false}
      variants={variants}
      animate={variant}
      whileHover="whileHover"
      whileTap="whileTap"
      className="likec4-compound-navigation compound-action"
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
