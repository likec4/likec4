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
        }),
        hiddenIfZoomTooSmall,
        'details-button',
      )}
      onClick={stopPropagation}>
      <ActionIcon
        component={m.div}
        layout
        className={cx(
          'nodrag nopan',
          actionBtn({ variant: 'transparent' }),
          css({
            opacity: 0.4,
            _whenHovered: {
              opacity: 0.8,
            },
            _hover: {
              opacity: 1,
            },
          }),
        )}
        initial={false}
        style={{
          originX: 0.45,
          originY: 0.55,
        }}
        animate={isHovered
          ? {
            scale: 1.2,
          }
          : {
            scale: 1,
          }}
        whileHover={{
          scale: 1.42,
        }}
        whileTap={{ scale: 1.15 }}
        size={'md'}
        radius="md"
        onClick={onClick}
        onDoubleClick={stopPropagation}>
        {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
      </ActionIcon>
    </Box>
  )
}
