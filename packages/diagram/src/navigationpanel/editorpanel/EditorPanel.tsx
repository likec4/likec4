import { vstack } from '@likec4/styles/patterns'
import { TooltipGroup } from '@mantine/core'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEnabledFeatures } from '../../context'
import { CenterCamera } from './CenterCamera'
import { ChangeAutoLayoutButton } from './ChangeAutoLayoutButton'
import { LayoutDriftNotification } from './LayoutDriftNotification'
import { ManualLayoutToolsButton } from './ManualLayoutToolsButton'

export function EditorPanel() {
  const { enableReadOnly } = useEnabledFeatures()
  return (
    <AnimatePresence>
      {!enableReadOnly && (
        <m.div
          layout="position"
          className={vstack({
            marginLeft: 'micro',
            gap: 'sm',
            layerStyle: 'likec4.panel',
            position: 'relative',
            cursor: 'pointer',
            padding: 'micro',
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
          <TooltipGroup>
            <ChangeAutoLayoutButton />
            <ManualLayoutToolsButton />
            <LayoutDriftNotification />
            <CenterCamera />
          </TooltipGroup>
        </m.div>
      )}
    </AnimatePresence>
  )
}
