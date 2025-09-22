import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { IconBolt } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { BaseNodeData } from '../../base/types'
import { stopPropagation } from '../../utils/xyflow'

const container = hstack({
  position: 'absolute',
  zIndex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  _smallZoom: {
    display: 'none',
  },
})

const actionButtons = hstack({
  gap: '1.5',
  justifyContent: 'center',
  alignItems: 'center',
})

type ElementActionButtonsProps = {
  selected?: boolean
  data: BaseNodeData
  buttons: ElementActionButtons.Item[]
}

/**
 * Center-Bottom bar with action buttons. Intended to be used inside "leaf" nodes.
 *
 * @param selected - Whether the node is selected
 * @param data - Node data
 * @param buttons - Action buttons
 *
 * @example
 * ```tsx
 * <ElementActionButtons
 *   {...nodeProps}
 *   Buttons={[
 *     {
 *       key: 'action1',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('action1 clicked')
 *       },
 *     },
 *     //...
 *   ]}
 * />
 * ```
 */
export function ElementActionButtons({
  selected = false,
  data: {
    hovered: isHovered = false,
  },
  buttons,
}: ElementActionButtonsProps) {
  const id = useId()
  if (!buttons.length) {
    return null
  }
  return (
    <Box
      className={container}
      style={{
        top: `calc(100% - 30px)`,
        transform: 'translateX(-50%)',
        left: `50%`,
        width: 'auto',
        minHeight: 30,
      }}>
      <m.div
        layoutRoot
        key={`${id}-action-buttons`}
        initial={false}
        style={{
          originY: 0,
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
            // layout
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
            {button.icon || <IconBolt />}
          </ActionIcon>
        ))}
      </m.div>
    </Box>
  )
}

export namespace ElementActionButtons {
  export type Item = {
    key?: string
    icon?: React.ReactNode
    onClick: (e: React.MouseEvent) => void
  }
}
