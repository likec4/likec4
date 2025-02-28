import { ActionIcon, Box } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'
import * as css from './CompoundActionButton.css'

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
  return (
    <Box className={clsx(css.container, hiddenIfZoomTooSmall, 'compound-action')}>
      <ActionIcon
        className={clsx('nodrag nopan', css.actionIcon)}
        component={m.button}
        initial={false}
        animate={{
          scale: isHovered ? 1.2 : 1,
          x: isHovered ? -1 : 0,
          // y: isHovered ? -1 : 0,
        }}
        whileHover={{
          scale: 1.35,
          x: -1,
          // y: 1,
        }}
        whileTap={{ scale: 1 }}
        size={'md'}
        radius="md"
        // Otherwise node receives click event and is selected
        onClick={onClick}
        onDoubleClick={stopPropagation}
      >
        {icon ?? <IconZoomScan stroke={2} />}
      </ActionIcon>
    </Box>
  )
}
