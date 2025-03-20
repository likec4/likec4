import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconZoomScan } from '@tabler/icons-react'
import { m } from 'framer-motion'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

type CompoundActionButtonProps = NodeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
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
  return (
    <Box
      className={cx(
        css({
          position: 'absolute',
          top: '5px',
          left: '4px',
          _smallZoom: {
            display: 'none',
          },
        }),
        'compound-action',
      )}>
      <m.div
        initial={false}
        animate={{
          scale: isHoverDebounced ? 1.2 : 1,
          x: isHoverDebounced ? -1 : 0,
          y: isHoverDebounced ? -1 : 0,
        }}
        whileHover={{
          scale: 1.4,
          x: -2,
          y: -2,
        }}
        whileTap={{ scale: 1 }}
      >
        <ActionIcon
          className={cx(
            'nodrag nopan',
            css({
              transitionDuration: 'normal',
              transitionDelay: {
                base: isHovered && !isHoverDebounced ? '0.25s' : '0s',
                _hover: '0s',
              },
              '[data-compound-title-inverse] &': {
                '--actionbtn-color': '{colors.likec4.palette.stroke}',
                '--actionbtn-color-hovered': '{colors.likec4.palette.stroke}',
                '--actionbtn-color-hovered-btn': '{colors.likec4.palette.hiContrast}',
                '--actionbtn-bg-hovered': `{colors.likec4.palette.fill/50}`,
                '--actionbtn-bg-hovered-btn': `{colors.likec4.palette.fill}`,
              },
            }),
            actionBtn(),
          )}
          // Otherwise node receives click event and is selected
          onClick={onClick}
          onDoubleClick={stopPropagation}
        >
          {icon ?? <IconZoomScan stroke={2} />}
        </ActionIcon>
      </m.div>
    </Box>
  )
}
