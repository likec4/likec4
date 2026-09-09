import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { m } from 'motion/react'
import { useDiagram } from '../../hooks/useDiagram'

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
      initial={{ opacity: 0, scale: 0.9, translateX: -10 }}
      animate={{ opacity: 1, scale: disabled ? 0.95 : 1, translateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, translateX: -10 }}
      whileTap={{
        translateY: 1,
      }}
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
          layout
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
