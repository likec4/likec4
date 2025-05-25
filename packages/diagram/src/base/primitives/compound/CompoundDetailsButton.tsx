import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconId } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { Simplify } from 'type-fest'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'
import { compoundActionBtn } from './actionbtns.css'

type CompoundDetailsButtonProps = Simplify<
  NodeProps<{}> & {
    icon?: React.ReactNode
    onClick: (e: React.MouseEvent) => void
  }
>

export function CompoundDetailsButton({
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: CompoundDetailsButtonProps) {
  // Debounce first "isHovered"
  const debounced = useDebouncedValue(isHovered, isHovered ? 130 : 0)
  const isHoverDebounced = debounced[0] && isHovered
  return (
    <Box
      className={cx(
        css({
          position: 'absolute',
          top: '[2px]',
          right: '[2px]',
          _smallZoom: {
            display: 'none',
          },
        }),
        'details-button',
      )}
      onClick={stopPropagation}>
      <m.div
        initial={false}
        animate={{
          scale: isHoverDebounced ? 1.2 : 1,
          opacity: isHoverDebounced ? 1 : 0.6,
        }}
        whileHover={{
          scale: 1.4,
        }}
        whileTap={{ scale: 1 }}
      >
        <ActionIcon
          className={cx(
            'nodrag nopan',
            compoundActionBtn({
              delay: isHovered && !isHoverDebounced,
            }),
            css({
              _whenHovered: {
                opacity: .75,
              },
              _hover: {
                opacity: 1,
              },
            }),
            actionBtn({ variant: 'transparent' }),
          )}
          onClick={onClick}
          onDoubleClick={stopPropagation}>
          {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
        </ActionIcon>
      </m.div>
    </Box>
  )
}
