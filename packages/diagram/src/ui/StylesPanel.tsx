import { defaultTheme } from '@likec4/core'
import { Card, CheckIcon, ColorSwatch, rem, SimpleGrid } from '@mantine/core'
import { useNodesData, useOnSelectionChange, useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { first, hasAtLeast, keys, takeWhile } from 'remeda'
import { type EditorEdge, EditorNode } from '../types'
import { useLikeC4Editor } from '../ViewEditorApi'
import styles from './StylesPanel.module.css'

const colors = keys.strict(defaultTheme.elements).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

type ColorKey = typeof colors[0]['key']

// const ColorPanel = () => {
//   const selectedNodes = useStore(state => state.nodeInternals
// }

const StylesPanel = memo(function StylesPanel() {
  const api = useReactFlow<EditorNode, EditorEdge>()
  const likec4Editor = useLikeC4Editor()

  const [selectedNodes, setSelectedNodes] = useState([] as string[])
  const nodesData = useNodesData<EditorNode>(selectedNodes)

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map(node => node.id))
    }
  })

  let selectedColor = first(nodesData)?.color ?? null

  if (nodesData.length > 1) {
    takeWhile(nodesData, node => {
      if (node.color !== selectedColor) {
        selectedColor = null
        return false
      }
      return true
    })
  }

  const changeColor = (color: ColorKey) => {
    if (color === selectedColor) {
      return
    }
    if (hasAtLeast(selectedNodes, 1)) {
      for (const node of selectedNodes) {
        api.updateNodeData(node, { color })
      }
      // setSelectedNodes([...selectedNodes])
      // const { ids, fqns } = selectedNodes.reduce((acc, node) => {
      //   acc.ids.add(node.id)
      //   acc.fqns.push(node.data.id)
      //   return acc
      // }, { ids: new Set<string>(), fqns: [] as Fqn[] })
      // const newSelectedNodes = [] as EditorNode[]
      // api.updateNode
      // api.setNodes(current =>
      //   current.map(node => {
      //     if (ids.has(node.id) && EditorNode.is(node)) {
      //       // set(node, 'data.color', color)
      //       node.data = {
      //         // ...node,
      //         // data: {
      //         ...node.data,
      //         color
      //         // }
      //       }
      //       newSelectedNodes.push(node as EditorNode)
      //     }
      //     return node
      //   })
      // )
      // invariant(hasAtLeast(fqns, 1), 'fqns.length > 0')
      // // likec4Editor.changeColor(fqns, color)
      // setSelectedNodes(newSelectedNodes)
    }
  }

  return (
    <AnimatePresence>
      {selectedNodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0.3, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          className={styles.stylesPanel}
          style={{
            transformOrigin: 'center right'
          }}
        >
          <Card>
            <SimpleGrid cols={4} spacing="xs">
              {colors.map(({ key, value }) => (
                <ColorSwatch
                  key={key}
                  // component="button"
                  color={value}
                  size={18}
                  onClick={() => changeColor(key)}
                  style={{ color: '#fff', cursor: 'pointer' }}
                >
                  {selectedColor === key && <CheckIcon style={{ width: rem(12), height: rem(12) }} />}
                </ColorSwatch>
              ))}
            </SimpleGrid>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default StylesPanel
