import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { type HTMLMotionProps, m } from 'motion/react'
import { useDiagram } from '../../hooks/useDiagram'

const easeOut = [0.23, 1, 0.32, 1] as const

const motionProps = {
  initial: {
    opacity: 0,
    scale: 0.9,
    translateX: -10,
  },
  animate: {
    opacity: [0.8, 0.9, 1],
    scale: 1,
    translateX: 0,
  },
  whileTap: {
    translateY: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    translateX: -10,
    transition: { duration: 0.2, ease: easeOut },
  },
} satisfies HTMLMotionProps<'button'>

export function ToggleReadonly({ disabled, isReadOnly }: { disabled: boolean; isReadOnly: boolean }) {
  const diagram = useDiagram()

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      layoutDependency={isReadOnly}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation()
        !disabled && diagram.toggleFeature('ReadOnly')
      }}
      {...motionProps}
      className={cx(
        'group',
        hstack({
          gap: '0.5',
          paddingInline: 'xxs',
          paddingBlock: 'xxs',
          userSelect: 'none',
          layerStyle: 'likec4.panel.action',
        }),
      )}>
      {/* Open lock icon when editing is enabled */}
      <IconLockOpen2 size={14} stroke={2} style={{ display: isReadOnly ? 'none' : undefined }} />
      {/* Closed lock icon when editing is disabled */}
      <IconLock size={14} stroke={2} style={{ display: !isReadOnly ? 'none' : undefined }} />
      {isReadOnly && (
        <m.div
          layout="position"
          className={css({
            fontSize: 'xxs',
            fontWeight: 'bold',
            lineHeight: 'snug',
            opacity: '0.9',
          })}
        >
          Edit
        </m.div>
      )}
    </UnstyledButton>
  )
}
