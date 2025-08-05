import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import type { DiagramContext } from '../../state/types'

const selector = (state: DiagramContext) => ({
  visible: state.features.enableReadOnly !== true,
  isReadOnly: state.toggledFeatures.enableReadOnly ?? state.features.enableReadOnly,
})

export const ToggleReadonly = () => {
  const { visible, isReadOnly } = useDiagramContext(selector)
  const diagram = useDiagram()

  if (!visible) {
    return null
  }

  return (
    <UnstyledButton
      component={m.button}
      layout="position"
      onClick={e => {
        e.stopPropagation()
        diagram.toggleFeature('ReadOnly')
      }}
      whileTap={{
        translateY: 1,
      }}
      className={cx(
        'group',
        hstack({
          gap: '0.5',
          paddingInline: 'xxs',
          paddingBlock: 'xxs',
          rounded: 'sm',
          userSelect: 'none',
          cursor: 'pointer',
          color: {
            base: 'likec4.panel.action-icon.text',
            _hover: 'likec4.panel.action-icon.text.hover',
          },
          backgroundColor: {
            _hover: 'likec4.panel.action-icon.bg.hover',
          },
        }),
      )}>
      {isReadOnly ? <IconLock size={14} stroke={2} /> : <IconLockOpen2 size={14} stroke={2} />}
      {isReadOnly && (
        <m.div
          // layout="position"
          className={css({
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1,
            opacity: 0.8,
          })}>
          Unlock
        </m.div>
      )}
    </UnstyledButton>
  )
}
