import { ActionIcon, Box } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { m } from 'framer-motion'
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
    <Box className={clsx(css.container, 'compound-action')}>
      <Box
        className={clsx('nodrag nopan', css.actionButton)}
        component={m.div}
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
        // @ts-expect-error onTap handles also pointer events
        onTap={onClick}
      >
        <ActionIcon
          className={css.actionIcon}
          size={'md'}
          radius="md"
          // Otherwise node receives click event and is selected
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
        >
          {icon ?? <IconZoomScan stroke={2} />}
        </ActionIcon>
      </Box>
    </Box>
  )
}
