import { cx } from '@likec4/styles/css'
import { actionBtn, actionButtons } from '@likec4/styles/recipes'
import { ActionIcon } from '@mantine/core'
import { useId } from '@mantine/hooks'
import { IconBolt } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { stopPropagation } from '../../utils/xyflow'

type ElementActionButtonsProps = {
  selected?: boolean
  data: {
    hovered?: boolean
  }
  buttons: ElementActionButtons.Item[]
}

const variants = {
  normal: {
    originY: 0,
    opacity: 0.75,
    scale: 0.8,
    y: 0,
  },
  selected: {
    originY: 0,
    opacity: 1,
    scale: 0.9,
    y: 7,
  },
  hovered: {
    originY: 0,
    opacity: 1,
    scale: 1.12,
    y: 7,
  },
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

  let variant: keyof typeof variants
  switch (true) {
    case isHovered:
      variant = 'hovered'
      break
    case selected:
      variant = 'selected'
      break
    default:
      variant = 'normal'
  }

  return (
    <div className={actionButtons()}>
      <m.div
        layoutRoot
        initial={false}
        variants={variants}
        animate={variant}
        layoutDependency={`${isHovered}-${selected}`}
        data-likec4-hovered={isHovered}
        className={cx('nodrag nopan')}
        onClick={stopPropagation}
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
            tabIndex={-1}
            onClick={button.onClick}
            // Otherwise node receives click event and is selected
            onDoubleClick={stopPropagation}
          >
            {button.icon || <IconBolt />}
          </ActionIcon>
        ))}
      </m.div>
    </div>
  )
}

export namespace ElementActionButtons {
  export type Item = {
    key?: string
    icon?: ReactNode
    onClick: (e: ReactMouseEvent) => void
  }
}
