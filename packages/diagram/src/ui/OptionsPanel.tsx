import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { deepEqual as eq } from 'fast-equals'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import useTilg from 'tilg'
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
  const hasAnySelection = !isFocused && (selected.nodes.length > 0) // || selected.edges.length > 0)
  DEV && useTilg()`
    OptionsPanel
      isFocused: ${isFocused}
      selected.nodes: ${JSON.stringify(selected.nodes)}
      selected.edges: ${JSON.stringify(selected.edges)}
    `
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
            transformOrigin: 'center right'
          }}
        >
          <Card shadow="sm">
            <NodeOptions selectedNodeIds={selected.nodes} />
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  )
}
