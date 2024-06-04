import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { isNullish, isTruthy } from 'remeda'
import { useDiagramState } from '../state'
import { NodeOptions } from './options/NodeOptions'
import * as styles from './OptionsPanel.css'

export default function OptionsPanel() {
  const isFocusDisabled = useDiagramState(s => isNullish(s.focusedNodeId))
  const [selectedNodes, setSelectedNodes] = useState([] as string[])

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const next = nodes.map(n => n.id).sort()
      setSelectedNodes(prev => {
        return shallowEqual(prev, next) ? prev : next
      })
    }
  })

  return (
    <AnimatePresence mode="wait">
      {isFocusDisabled && selectedNodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.85
          }}
          transition={{ duration: 0.14 }}
          className={clsx('react-flow__panel', styles.panel)}
          style={{
            transformOrigin: 'center right'
          }}
        >
          <Card shadow="sm">
            <NodeOptions selectedNodeIds={selectedNodes} />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
