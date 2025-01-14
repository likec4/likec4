import { ActionIcon, Box } from '@mantine/core'
import { IconId, IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { stopPropagation } from '../../../xyflow/utils'
import type { NodeProps } from '../../types'
import * as css from './ElementDetailsButton.css'

type ElementDetailsButtonProps = NodeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function ElementDetailsButton({
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: ElementDetailsButtonProps) {
  return (
    <Box className={clsx(css.container, 'details-button')}>
      <Box
        component={m.div}
        initial={false}
        style={{
          originX: 0.45,
          originY: 0.55,
        }}
        animate={(isHovered || selected)
          ? {
            scale: 1.2,
            opacity: 0.7,
          }
          : {
            scale: 1,
            opacity: 0.5,
          }}
        whileHover={{
          scale: 1.4,
          opacity: 1,
        }}
        whileTap={{ scale: 1.15 }}
        className={clsx('nodrag nopan', css.actionIconWrapper)}
      >
        <ActionIcon
          className={css.actionIcon}
          size={'md'}
          radius="md"
          onClick={onClick}
        >
          {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
        </ActionIcon>
      </Box>
    </Box>
  )
}
