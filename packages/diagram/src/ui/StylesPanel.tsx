import { defaultTheme, ElementShapes, invariant, type ThemeColor } from '@likec4/core'
import {
  Card,
  CheckIcon,
  ColorSwatch,
  Divider,
  Flex,
  Input,
  rem,
  Select,
  SimpleGrid,
  Text,
  Tooltip
} from '@mantine/core'
import { useNodesData, useOnSelectionChange, useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { first, hasAtLeast, keys, takeWhile } from 'remeda'
import { type EditorEdge, EditorNode } from '../types'
import { useLikeC4Editor } from '../ViewEditorApi'
import styles from './StylesPanel.module.css'

const {
  primary,
  secondary,
  muted,
  ...otherColors
} = defaultTheme.elements

const themedColors = [
  { key: 'primary', value: primary.fill },
  { key: 'secondary', value: secondary.fill },
  { key: 'muted', value: muted.fill }
] satisfies Array<{ key: ThemeColor; value: string }>

const colors = keys.strict(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

type ThemeColorKey = typeof themedColors[0]['key']
type ColorKey = typeof colors[0]['key']

// const ColorPanel = () => {
//   const selectedNodes = useStore(state => state.nodeInternals
// }

const StylesPanel = memo(function StylesPanel() {
  const api = useReactFlow<EditorNode, EditorEdge>()
  const editor = useLikeC4Editor()

  const [selectedNodes, setSelectedNodes] = useState([] as string[])
  const nodeDatas = useNodesData<EditorNode>(selectedNodes)

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map(node => node.id))
    }
  })

  let selectedColor = first(nodeDatas)?.color ?? null

  if (nodeDatas.length > 1) {
    takeWhile(nodeDatas, node => {
      if (node.color !== selectedColor) {
        selectedColor = null
        return false
      }
      return true
    })
  }

  const changeColor = (color: ColorKey | ThemeColorKey) => {
    if (color === selectedColor) {
      return
    }
    invariant(hasAtLeast(selectedNodes, 1), 'selectedNodes.length < 1')
    invariant(selectedNodes.length === nodeDatas.length, 'selectedNodes.length !== nodeDatas.length')
    for (const node of selectedNodes) {
      api.updateNodeData(node, { color })
    }
    const targets = nodeDatas.map(node => node.id)
    invariant(hasAtLeast(targets, 1), 'targets.length < 1')
    editor.triggerChange({
      op: 'change-color',
      color,
      targets
    })
  }

  return (
    <AnimatePresence>
      {nodeDatas.length > 0 && (
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
          <Card shadow="xl">
            <Divider mb={'xs'} label="shape" labelPosition="left" />
            <Select
              variant="filled"
              size="xs"
              w={150}
              checkIconPosition="right"
              allowDeselect={false}
              defaultValue={ElementShapes[0]}
              data={ElementShapes}
            />

            <Divider my={'xs'} label="color" labelPosition="left" />
            <Tooltip.Group openDelay={400} closeDelay={300}>
              <Flex mb={'md'} maw={150} gap="xs" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
                {themedColors.map(({ key, value }) => (
                  <Tooltip
                    key={key}
                    label={key}
                    fz={'xs'}
                    color="dark"
                    offset={2}
                    transitionProps={{ duration: 140, transition: 'slide-up' }}>
                    <ColorSwatch
                      color={value}
                      size={20}
                      withShadow
                      onClick={() => changeColor(key)}
                      style={{ color: '#fff', cursor: 'pointer' }}
                    >
                      {selectedColor === key && <CheckIcon style={{ width: rem(12), height: rem(12) }} />}
                    </ColorSwatch>
                  </Tooltip>
                ))}
              </Flex>

              <Flex maw={150} gap="xs" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
                {colors.map(({ key, value }) => (
                  <Tooltip
                    key={key}
                    label={key}
                    fz={'xs'}
                    color="dark"
                    offset={2}
                    transitionProps={{ duration: 140, transition: 'slide-up' }}>
                    <ColorSwatch
                      color={value}
                      size={20}
                      onClick={() => changeColor(key)}
                      style={{ color: '#fff', cursor: 'pointer' }}
                    >
                      {selectedColor === key && <CheckIcon style={{ width: rem(12), height: rem(12) }} />}
                    </ColorSwatch>
                  </Tooltip>
                ))}
              </Flex>
            </Tooltip.Group>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default StylesPanel
