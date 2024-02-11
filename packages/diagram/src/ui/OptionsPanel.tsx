import { Card } from '@mantine/core'
import { useOnSelectionChange } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { NodeOptions } from './options/NodeOptions'
import classes from './OptionsPanel.module.css'

const OptionsPanelMemo = memo(function OptionsPanel() {
  const [selectedNodes, setSelectedNodes] = useState([] as string[])
  const [selectedEdges, setSelectedEdges] = useState([] as string[])

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes.map(n => n.id))
      setSelectedEdges(edges.map(e => e.id))
    }
  })

  return (
    <AnimatePresence>
      {selectedNodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0.3, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          className={classes.panel}
          style={{
            transformOrigin: 'center right'
          }}
        >
          <Card shadow="xl">
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
