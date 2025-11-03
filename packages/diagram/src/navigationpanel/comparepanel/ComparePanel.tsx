import { hstack } from '@likec4/styles/patterns'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo } from 'react'
import { useEnabledFeatures } from '../../context'
import { ComparePanelControls } from './ComparePanelControls'

export const ComparePanel = memo(() => {
  const { enableCompareWithLatest } = useEnabledFeatures()
  return (
    <AnimatePresence>
      {enableCompareWithLatest && (
        <m.div
          layout="position"
          className={hstack({
            gap: '2',
            layerStyle: 'likec4.panel',
            position: 'relative',
            px: '2',
            py: '1',
            pl: '3',
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
          <ComparePanelControls />
        </m.div>
      )}
    </AnimatePresence>
  )
})
ComparePanel.displayName = 'ComparePanel'
