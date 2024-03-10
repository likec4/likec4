import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { NodeOptions } from './options/NodeOptions'
import * as styles from './OptionsPanel.css'

const OptionsPanelMemo = memo(function OptionsPanel() {
  // const viewId = useDiagramStateTracked().viewId
  const [selectedNodes, setSelectedNodes] = useState([] as string[])
  // const [selectedEdges, setSelectedEdges] = useState([] as string[])

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes.map(n => n.id))
      // if (nodes.length === 0 && edges.length === 0) {
      //   setSelectedNodes([])
      //   // setSelectedEdges([])
      //   return
      // }
      // const selected = new Set([
      //   ...nodes.map((n) => n.id),
      //   ...edges.flatMap((edge) => [
      //     edge.source,
      //     edge.target
      //   ])
      // ])
      // setSelectedNodes([...selected])
      // setSelectedEdges(edges.map(e => e.id))
    }
  })

  // useUpdateEffect(() => {
  //   setSelectedNodes([])
  // }, [viewId])

  return (
    <AnimatePresence>
      {selectedNodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0.3, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          className={clsx('react-flow__panel', styles.panel)}
          style={{
            transformOrigin: 'center right'
          }}
        >
          <Card shadow="sm">
            <NodeOptions selectedNodeIds={selectedNodes} />
            {
              /* <Divider mb={'xs'} label="shape" labelPosition="left" />
            <Select
              variant="filled"
              size="xs"
              w={150}
              checkIconPosition="right"
              allowDeselect={false}
              defaultValue={ElementShapes[0]}
              data={ElementShapes}
            /> */
            }
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default OptionsPanelMemo
