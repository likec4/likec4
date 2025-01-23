import { ActionIcon, Box } from '@mantine/core'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'
import * as css from './ElementActionButtons.css'

type ElementActionButtonsProps = NodeProps & {
  buttons: ElementActionButtons.Item[]
}

export function ElementActionButtons({
  id,
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  buttons,
}: ElementActionButtonsProps) {
  if (!buttons.length) {
    return null
  }
  return (
    <Box className={css.container}>
      <Box
        component={m.div}
        layoutRoot
        initial={false}
        style={{
          originY: 0,
          gap: '6px',
        }}
        animate={{
          opacity: (isHovered || selected) ? 1 : 0.75,
          scale: isHovered ? 1.1 : (selected ? 0.9 : 0.8),
          y: (isHovered || selected) ? 6 : 0,
        }}
        data-hovered={isHovered}
        className={clsx('nodrag nopan', css.actionButtons)}
      >
        {buttons.map((button, index) => (
          <m.div
            key={`action-button-${id}-${button.key ?? index}`}
            initial={false}
            whileTap={{ scale: 1 }}
            whileHover={{
              scale: 1.35,
            }}
            // @ts-expect-error onTap handles also pointer events
            onTap={button.onClick}
          >
            <ActionIcon
              className={css.actionIcon}
              size={'md'}
              radius="md"
              // Otherwise node receives click event and is selected
              onClick={stopPropagation}
              onDoubleClick={stopPropagation}
            >
              {button.icon}
            </ActionIcon>
          </m.div>
        ))}
      </Box>
    </Box>
  )
}

export namespace ElementActionButtons {
  export type Item = {
    key?: string
    icon: React.ReactNode
    onClick: (e: React.MouseEvent) => void
  }
}
