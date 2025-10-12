import { vstack } from '@likec4/styles/patterns'
import { TooltipGroup } from '@mantine/core'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEnabledFeatures } from '../../context'
import { CenterCamera } from './CenterCamera'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'

export function EditorPanel() {
  const { enableReadOnly } = useEnabledFeatures()
  return (
    <AnimatePresence>
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
          initial={{
            opacity: 0,
            translateX: -20,
          }}
          animate={{
            opacity: 1,
            translateX: 0,
          }}
          exit={{
            opacity: 0,
            translateX: -20,
          }}
        >
          <TooltipGroup openDelay={600} closeDelay={120}>
            <ChangeAutoLayoutButton />
            <ManualLayoutToolsButton />
            <CenterCamera />
          </TooltipGroup>
        </m.div>
      )}
    </AnimatePresence>
  )
}
