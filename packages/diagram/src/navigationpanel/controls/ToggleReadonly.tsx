import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { type HTMLMotionProps, AnimatePresence, m } from 'motion/react'
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

const buttonStyle = css({
  overflow: 'hidden',
  transition: 'colors',
  transitionDuration: 'medium',
  transitionTimingFunction: 'out',
})

const iconTransition = { type: 'spring', duration: 0.35, bounce: 0.4 } as const

const labelTransition = { duration: 0.18, ease: easeOut } as const

const editingStyle = css({
  color: 'warning.text',
  backgroundColor: {
    base: 'warning.body',
    _light: 'mantine.yellow[5]',
  },
  _notDisabled: {
    _hover: {
      color: 'warning.text',
      backgroundColor: {
        base: 'warning.body',
        _light: 'mantine.yellow[5]',
      },
      filter: '[brightness(1.08)]',
    },
  },
  // Keep the "editing" hint, but muted, while the toggle is unavailable
  _disabled: {
    opacity: '0.3!',
    filter: '[saturate(0.3)]',
  },
})

export function ToggleReadonly({ disabled, isReadOnly }: { disabled: boolean; isReadOnly: boolean }) {
  const diagram = useDiagram()

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      disabled={disabled}
      onClick={e => {
        e.stopPropagation()
        !disabled && diagram.toggleFeature('ReadOnly')
      }}
      {...motionProps}
      aria-pressed={!isReadOnly}
      title={disabled
        ? 'Editing is not available in this mode'
        : isReadOnly
        ? 'Enable editing'
        : 'Editing is on, click to lock'}
      className={cx(
        'group',
        hstack({
          gap: '0.5',
          paddingInline: 'xxs',
          paddingBlock: 'xxs',
          userSelect: 'none',
          layerStyle: 'likec4.panel.action',
        }),
        buttonStyle,
        !isReadOnly && editingStyle,
      )}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={isReadOnly ? 'locked' : 'unlocked'}
          className={css({ display: 'flex' })}
          initial={{ opacity: 0, scale: 0.4, rotate: isReadOnly ? 30 : -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={iconTransition}
        >
          {isReadOnly ? <IconLock size={14} stroke={2} /> : <IconLockOpen2 size={14} stroke={2} />}
        </m.span>
      </AnimatePresence>

      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={isReadOnly ? 'edit' : 'editing'}
          className={css({
            fontSize: 'xxs',
            fontWeight: 'bold',
            lineHeight: 'snug',
          })}
          initial={{ opacity: 0, y: isReadOnly ? -8 : 8 }}
          animate={{ opacity: 0.9, y: 0 }}
          exit={{ opacity: 0, y: isReadOnly ? 8 : -8 }}
          transition={labelTransition}
        >
          {isReadOnly ? 'Edit' : 'Editing'}
        </m.div>
      </AnimatePresence>
    </UnstyledButton>
  )
}
