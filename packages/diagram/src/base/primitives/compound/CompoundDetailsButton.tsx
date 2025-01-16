import { ActionIcon, Box } from '@mantine/core'
import { IconId } from '@tabler/icons-react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { stopPropagation } from '../../../xyflow/utils'
import type { NodeProps } from '../../types'
import * as css from './CompoundDetailsButton.css'

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
    <Box className={clsx(css.container, 'details-button')} onClick={stopPropagation}>
      <Box
        component={m.div}
        className={clsx('nodrag nopan', css.actionIconWrapper)}
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
        // @ts-expect-error onTap handles also pointer events
        onTap={onClick}
      >
        <ActionIcon
          className={css.actionIcon}
          size={'md'}
          radius="md"
          // Otherwise node receives click event and is selected
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}>
          {icon ?? <IconId stroke={1.8} style={{ width: '75%' }} />}
        </ActionIcon>
      </Box>
    </Box>
  )
}
