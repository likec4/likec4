import { vstack } from '@likec4/styles/patterns'
import { TooltipGroup } from '@mantine/core'
import { type Variants, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEnabledFeatures } from '../../context'
import { ApplySemanticLayout } from './ApplySemanticLayout'
import { CenterCamera } from './CenterCamera'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'
import { ToggleReadonly } from './ToggleReadonly'

const variants: Variants = {
  hidden: {
    opacity: 0,
    translateX: -20,
  },
  visible: {
    opacity: 1,
    translateX: 0,
  },
  exit: {
    opacity: 0,
    translateX: -20,
  },
}

export function EditorPanel() {
  const {
    enableReadOnly,
    enableCompareWithLatest,
    enableAISemanticLayout,
  } = useEnabledFeatures()

  const showAiSemanticLayoutButton = !enableCompareWithLatest && !enableReadOnly && enableAISemanticLayout

  return (
    <AnimatePresence propagate>
      {!enableReadOnly && (
        <m.div
          layout="position"
          className={vstack({
            gap: 'xs',
            layerStyle: 'likec4.panel',
            position: 'relative',
            cursor: 'pointer',
            padding: 'xxs',
            pointerEvents: 'all',
          })}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
        >
          <TooltipGroup openDelay={600} closeDelay={120}>
            <ChangeAutoLayoutButton />
            <ManualLayoutToolsButton />
            <CenterCamera />
            <ToggleReadonly />
            <ApplySemanticLayout visible={showAiSemanticLayoutButton} />
          </TooltipGroup>
        </m.div>
      )}
    </AnimatePresence>
  )
}
