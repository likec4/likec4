import { defaultTheme, type Fqn, invariant } from '@likec4/core'
import { Card, CheckIcon, ColorSwatch, rem, SimpleGrid } from '@mantine/core'
import { useOnSelectionChange, useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { first, hasAtLeast, keys, takeWhile } from 'remeda'
import { useDiagramViewEditor } from '../LikeC4ViewEditor'
import type { EditorNode } from '../types'
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
  const api = useReactFlow()
  const likec4Editor = useDiagramViewEditor()

  const [selectedNodes, setSelectedNodes] = useState([] as EditorNode[])

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes as EditorNode[])
    }
  })

  let selectedColor = first(selectedNodes)?.data.color ?? null

  if (selectedNodes.length > 1) {
    takeWhile(selectedNodes, node => {
      if (node.data.color !== selectedColor) {
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
      const { ids, fqns } = selectedNodes.reduce((acc, node) => {
        acc.ids.add(node.id)
        acc.fqns.push(node.data.fqn)
        return acc
      }, { ids: new Set<string>(), fqns: [] as Fqn[] })
      const newSelectedNodes = [] as EditorNode[]
      api.setNodes(current =>
        current.map(node => {
          if (ids.has(node.id)) {
            node = {
              ...node,
              data: {
                ...node.data,
                color
              }
            }
            newSelectedNodes.push(node as EditorNode)
          }
          return node
        })
      )
      invariant(hasAtLeast(fqns, 1), 'fqns.length > 0')
      likec4Editor.changeColor(fqns, color)
      setSelectedNodes(newSelectedNodes)
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
