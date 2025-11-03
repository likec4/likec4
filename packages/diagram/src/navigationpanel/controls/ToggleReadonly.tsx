import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import type { DiagramContext } from '../../hooks/useDiagram'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'

const selector = (ctx: DiagramContext) => ({
  visible: ctx.features.enableReadOnly !== true &&
    // Disable toggle in sequence mode
    (ctx.view._type !== 'dynamic' || ctx.dynamicViewVariant !== 'sequence'),
  isReadOnly: ctx.toggledFeatures.enableReadOnly ?? ctx.features.enableReadOnly,
})

export const ToggleReadonly = () => {
  const { visible, isReadOnly } = useDiagramContext(selector)
  const diagram = useDiagram()

  return (
    <AnimatePresence mode="popLayout">
      {visible && (
        <UnstyledButton
          component={m.button}
          layout="position"
          onClick={e => {
            e.stopPropagation()
            diagram.toggleFeature('ReadOnly')
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
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
              className={css({
                fontSize: '11px',
                fontWeight: 600,
                lineHeight: 1,
                opacity: 0.8,
              })}>
              Edit
            </m.div>
          )}
        </UnstyledButton>
      )}
    </AnimatePresence>
  )
}
