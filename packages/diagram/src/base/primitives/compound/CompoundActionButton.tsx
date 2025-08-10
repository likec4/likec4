import { cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconZoomScan } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { Simplify } from 'type-fest'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'
import { compoundActionBtn } from './actionbtns.css'

type CompoundActionButtonProps = Simplify<
  NodeProps<{}> & {
    icon?: React.ReactNode
    onClick: (e: React.MouseEvent) => void
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
    >
      <ActionIcon
        className={cx(
          'nodrag nopan',
          compoundActionBtn({
            delay: isHovered && !isHoverDebounced,
          }),
          actionBtn({ variant: 'transparent' }),
        )}
        // Otherwise node receives click event and is selected
        onClick={onClick}
        onDoubleClick={stopPropagation}
      >
        {icon ?? <IconZoomScan stroke={2} />}
      </ActionIcon>
    </m.div>
  )
}
