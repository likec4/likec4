import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { m } from 'framer-motion'
import { useIsZoomTooSmall } from '../../../hooks/useXYFlow'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

type ElementActionButtonsProps = NodeProps & {
  buttons: ElementActionButtons.Item[]
}

const container = css({
  position: 'absolute',
  top: `calc(100% - 28px)`,
  // transform: 'translateY(-100%)',
  left: 0,
  width: '100%',
  minHeight: '28px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  _smallZoom: {
    display: 'none',
  },
  // zIndex: 10,
})

const actionButtons = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export function ElementActionButtons({
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  buttons,
}: ElementActionButtonsProps) {
  const id = useId()
  const zoomTooSmall = useIsZoomTooSmall()
  if (!buttons.length || zoomTooSmall) {
    return null
  }
  return (
    <Box className={container}>
      <Box
        component={m.div}
        layoutRoot
        key={`${id}-action-buttons`}
        initial={false}
        style={{
          originY: 0,
          gap: '8px',
        }}
        animate={{
          opacity: (isHovered || selected) ? 1 : 0.75,
          scale: isHovered ? 1.1 : (selected ? 0.9 : 0.8),
          y: (isHovered || selected) ? 6 : 0,
        }}
        data-likec4-hovered={isHovered}
        className={cx('nodrag nopan', actionButtons)}
      >
        {buttons.map((button, index) => (
          <ActionIcon
            component={m.button}
            layout
            className={actionBtn({})}
            key={`${id}-${button.key ?? index}`}
            initial={false}
            whileTap={{ scale: 1 }}
            whileHover={{
              scale: 1.3,
            }}
            onClick={button.onClick}
            // Otherwise node receives click event and is selected
            onDoubleClick={stopPropagation}
          >
            {button.icon}
          </ActionIcon>
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
