import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import clsx from 'clsx'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import * as styles from './OptionsPanel.css'
import { NodeOptions } from './options/NodeOptions'

export default function OptionsPanel() {
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
      {selectedNodes.length > 0 && (
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
