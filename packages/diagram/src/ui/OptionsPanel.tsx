import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { useDiagramState } from '../state/hooks'
import { NodeOptions } from './options/NodeOptions'
import * as styles from './OptionsPanel.css'

export default function OptionsPanel() {
  const { isFocused, viewId } = useDiagramState(s => ({
    viewId: s.view.id,
    isFocused: s.focusedNodeId !== null || s.activeDynamicViewStep !== null
  }))
  const [selected, setSelected] = useState<{
    nodes: string[]
    edges: string[]
  }>({
    nodes: [],
    edges: []
  })
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      const newSelected = {
        nodes: nodes.map(n => n.id).sort(),
        edges: edges.map(e => e.id).sort()
      }
      if (!eq(selected, newSelected)) {
        setSelected(newSelected)
      }
    }
  })
  const { nodes } = selected
  // const hasAnySelection = !isFocused && (nodes.length > 0 || edges.length > 0)
  const hasAnySelection = !isFocused && nodes.length > 0
  return (
    <AnimatePresence mode="wait">
      {hasAnySelection && (
        <m.div
          key={viewId}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.85
          }}
          transition={{ duration: 0.14 }}
          className={clsx('react-flow__panel', styles.panel)}
          style={{
            transformOrigin: 'center right',
            maxWidth: '320px'
          }}
        >
          <Card shadow="md">
            {nodes.length > 0 && <NodeOptions selectedNodeIds={nodes} />}
            {
              /* nodes.length === 0 && edges.length > 0 && (
              <EdgeOptions selectedEdgeIds={edges} />
            ) */
            }
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  )
}
