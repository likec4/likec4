import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { UnstyledButton } from '@mantine/core'
import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { isTruthy } from 'remeda'
import type { DiagramContext } from '../../hooks/useDiagram'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import { deriveToggledFeatures } from '../../likec4diagram/state/machine.setup'

const selector = (ctx: DiagramContext) => {
  const toggledFeatures = deriveToggledFeatures(ctx)

  // Disable readonly toggle, if any of these conditions is true:
  const comparingLatest = toggledFeatures.enableCompareWithLatest && !!ctx.view.drifts && ctx.view._layout === 'auto'
  // const sequenceLayoutActive = ctx.view._type === 'dynamic' && ctx.dynamicViewVariant === 'sequence'

  // If All condition is true, we show toggle
  const noActiveWalkthrough = !isTruthy(ctx.activeWalkthrough)
  const hasEditor = ctx.features.enableEditor

  return ({
    visible: hasEditor && noActiveWalkthrough,
    disabled: comparingLatest,
    isReadOnly: ctx.toggledFeatures.enableReadOnly ?? false,
  })
}

export const ToggleReadonly = () => {
  const { visible, disabled, isReadOnly } = useDiagramContext(selector)
  const diagram = useDiagram()

  return (
    <AnimatePresence mode="popLayout">
      {visible && (
        <UnstyledButton
          component={m.button}
          layout="position"
          layoutDependency={isReadOnly}
          disabled={disabled}
          onClick={e => {
            e.stopPropagation()
            !disabled && diagram.toggleFeature('ReadOnly')
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: disabled ? 0.95 : 1 }}
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
              userSelect: 'none',
              layerStyle: 'likec4.panel.action',
              backgroundColor: {
                base: 'none',
                _notDisabled: {
                  _hover: 'likec4.panel.action.bg.hover',
                },
              },
            }),
          )}>
          <IconLockOpen2 size={14} stroke={2} style={{ display: isReadOnly ? 'none' : undefined }} />
          <IconLock size={14} stroke={2} style={{ display: !isReadOnly ? 'none' : undefined }} />
          <m.div
            className={css({
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              opacity: 0.8,
            })}
            style={{
              display: isReadOnly ? 'block' : 'none',
            }}>
            Edit
          </m.div>
        </UnstyledButton>
      )}
    </AnimatePresence>
  )
}
