import { Card } from '@mantine/core'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, m } from 'framer-motion'
import { useCallback } from 'react'
import { reduce } from 'remeda'
import useTilg from 'tilg'
import { useDiagramState } from '../state'
import { useXYStore } from '../xyflow/hooks'
import { NodeOptions } from './options/NodeOptions'
import * as styles from './OptionsPanel.css'

const Empty = [] as string[]
export default function OptionsPanel() {
  const { isFocusDisabled, viewId } = useDiagramState(s => ({
    viewId: s.view.id,
    isFocusDisabled: s.focusedNodeId === null && s.activeDynamicViewStep === null
  }))
  const selectedNodes = useXYStore(
    useCallback(s =>
      s.elementsSelectable && isFocusDisabled
        ? reduce(s.nodes, (acc, n) => {
          if (n.selected) {
            acc.push(n.id)
          }
          return acc
        }, [] as string[])
        : Empty, [isFocusDisabled]),
    shallowEqual
  )
  DEV && useTilg()
  return (
    <AnimatePresence mode="wait">
      {selectedNodes.length > 0 && (
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
            <NodeOptions selectedNodeIds={selectedNodes} />
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  )
}
