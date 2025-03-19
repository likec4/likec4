import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { IconId } from '@tabler/icons-react'
import { m } from 'framer-motion'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

type CompoundDetailsButtonProps = NodeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function CompoundDetailsButton({
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: CompoundDetailsButtonProps) {
  return (
    <Box
      className={cx(
        css({
          position: 'absolute',
          top: '[2px]',
          right: '[2px]',
          // [`:where([data-mantine-color-scheme='light']) [data-compound-transparent="true"] &:hover`]: {
          //   ['--_compound-title-color']: '{colors.likec4.palette.loContrast}',
          // },
          // },
        }),
        hiddenIfZoomTooSmall,
        'details-button',
      )}
      onClick={stopPropagation}>
      <m.div
        layout
        initial={false}
        animate={{
          scale: isHovered ? 1.2 : 1,
        }}
        whileHover={{
          scale: 1.3,
        }}
        whileTap={{ scale: 1 }}
      >
        <ActionIcon
          className={cx(
            'nodrag nopan',
            actionBtn({ variant: 'transparent' }),
            css({
              opacity: 0.4,
              _whenHovered: {
                opacity: 0.8,
                transitionDelay: '150ms',
              },
              _hover: {
                opacity: 1,
              },
            }),
          )}
          onClick={onClick}
          onDoubleClick={stopPropagation}>
          {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
        </ActionIcon>
      </m.div>
    </Box>
  )
}
