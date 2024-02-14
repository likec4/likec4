import {
  defaultTheme,
  type ElementShape,
  ElementShapes,
  type Fqn,
  invariant,
  type NonEmptyArray,
  type ThemeColor
} from '@likec4/core'
import { Box, CheckIcon, ColorSwatch, Divider, Flex, rem, Select, Stack, Tooltip } from '@mantine/core'
import { useNodes, useReactFlow } from '@xyflow/react'
import { hasAtLeast, keys, takeWhile } from 'remeda'
import { type EditorEdge, EditorNode } from '../../types'
import { useLikeC4EditorTriggers } from '../../ViewEditorApi'

// const ColorPanel = () => {
//   const selectedNodes = useStore(state => state.nodeInternals
// }

const {
  primary,
  secondary,
  muted,
  ...otherColors
} = defaultTheme.elements

export const themedColors = [
  { key: 'primary', value: primary.fill },
  { key: 'secondary', value: secondary.fill },
  { key: 'muted', value: muted.fill }
] satisfies Array<{ key: ThemeColor; value: string }>

export const colors = keys.strict(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

export type ThemeColorKey = typeof themedColors[0]['key']
export type ColorKey = typeof colors[0]['key']

export const NodeOptions = ({ selectedNodeIds }: { selectedNodeIds: string[] }) => {
  const nodes = useNodes<EditorNode>().filter(node => selectedNodeIds.includes(node.id))
  const api = useReactFlow<EditorNode, EditorEdge>()
  const trigger = useLikeC4EditorTriggers()
  if (!hasAtLeast(nodes, 1)) {
    return null
  }
  return (
    <Stack>
      <ShapeOption
        nodes={nodes}
        onShapeChange={(shape: ElementShape) => {
          const targets = [] as Fqn[]
          for (const nd of nodes) {
            api.updateNodeData(nd.id, { shape })
            targets.push(nd.data.id)
          }
          invariant(hasAtLeast(targets, 1), 'targets.length < 1')
          trigger.onChange({
            op: 'change-shape',
            shape,
            targets
          })
        }}
      />
      <Colors
        nodes={nodes}
        onColorChange={(color: ColorKey | ThemeColorKey) => {
          const targets = [] as Fqn[]
          for (const nd of nodes) {
            api.updateNodeData(nd.id, { color })
            targets.push(nd.data.id)
          }
          invariant(hasAtLeast(targets, 1), 'targets.length < 1')
          trigger.onChange({
            op: 'change-color',
            color,
            targets
          })
        }}
      />
    </Stack>
  )
}

const Colors = ({
  nodes: [firstNode, ...nodes],
  onColorChange
}: {
  nodes: NonEmptyArray<EditorNode>
  onColorChange: (color: ColorKey | ThemeColorKey) => void
}) => {
  let selectedColor = firstNode.data.color as ThemeColor | null
  takeWhile(nodes, node => {
    if (node.data.color !== selectedColor) {
      selectedColor = null
      return false
    }
    return true
  })
  const changeColor = (color: ColorKey | ThemeColorKey) => () => {
    if (selectedColor === color) {
      return
    }
    onColorChange(color)
  }
  return (
    <Box>
      <Tooltip.Group openDelay={400} closeDelay={300}>
        <Divider label="color" labelPosition="left" />
        <Flex mt={'xs'} maw={150} gap="xs" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
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
                onClick={changeColor(key)}
                style={{ color: '#fff', cursor: 'pointer' }}
              >
                {selectedColor === key && <CheckIcon style={{ width: rem(12), height: rem(12) }} />}
              </ColorSwatch>
            </Tooltip>
          ))}
        </Flex>

        <Flex mt="sm" maw={150} gap="xs" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
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
                onClick={changeColor(key)}
                style={{ color: '#fff', cursor: 'pointer' }}
              >
                {selectedColor === key && <CheckIcon style={{ width: rem(12), height: rem(12) }} />}
              </ColorSwatch>
            </Tooltip>
          ))}
        </Flex>
      </Tooltip.Group>
    </Box>
  )
}

const ShapeOption = ({
  nodes: [firstNode, ...nodes],
  onShapeChange
}: {
  nodes: NonEmptyArray<EditorNode>
  onShapeChange: (shape: ElementShape) => void
}) => {
  let selectedShape = firstNode.data.shape as ElementShape | null
  takeWhile(nodes, node => {
    if (node.data.shape !== selectedShape) {
      selectedShape = null
      return false
    }
    return true
  })

  return (
    <Box>
      <Divider label="shape" labelPosition="left" />
      <Select
        mt={'xs'}
        size="xs"
        variant="filled"
        value={selectedShape}
        placeholder={'[ multiple ]'}
        data={ElementShapes}
        allowDeselect={false}
        checkIconPosition="right"
        onChange={(value) => {
          if (!value || value === selectedShape) {
            return
          }
          onShapeChange(value as ElementShape)
        }}
      />
    </Box>
  )
}
