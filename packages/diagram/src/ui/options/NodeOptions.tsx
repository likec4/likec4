import {
  defaultTheme,
  type ElementShape,
  ElementShapes,
  type Fqn,
  type NonEmptyArray,
  type ThemeColor
} from '@likec4/core'
import {
  Box,
  CheckIcon,
  ColorSwatch,
  Divider,
  Flex,
  rem,
  Select,
  Stack,
  Text,
  Tooltip,
  TooltipGroup
} from '@mantine/core'
import { hasAtLeast, keys, takeWhile } from 'remeda'
import { useXYFlow, useXYNodesData } from '../../xyflow/hooks'
import { XYFlowNode } from '../../xyflow/types'
import { useXYFlowEvents } from '../../xyflow/XYFlowEvents'

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

type XYNodesData = Pick<XYFlowNode, 'id' | 'data' | 'type'>

export function NodeOptions({ selectedNodeIds }: { selectedNodeIds: string[] }) {
  const { onChange } = useXYFlowEvents()
  const nodes = useXYNodesData(selectedNodeIds)
  const api = useXYFlow()
  if (!hasAtLeast(nodes, 1)) {
    return null
  }
  // Makes sense to show shape option only if there is at least one element node
  const showShapeOption = nodes.some(node => node.type === 'element')

  const [firstNode, ...rest] = nodes
  return (
    <Stack>
      <Box maw={200}>
        <Text size="xs" c={rest.length > 0 ? 'dimmed' : ''} truncate>
          {rest.length === 0 ? firstNode.data.element.title : `[ multiple ]`}
        </Text>
      </Box>
      {showShapeOption && (
        <ShapeOption
          nodes={nodes}
          onShapeChange={(shape: ElementShape) => {
            const targets = [] as Fqn[]
            for (const nd of nodes) {
              api.updateNodeData(nd.id, ({ data }: XYFlowNode) => {
                if (data.element.shape === shape) {
                  return data
                }

                return ({
                  ...data,
                  element: {
                    ...data.element,
                    shape
                  }
                })
              })
              targets.push(nd.data.element.id)
            }
            if (hasAtLeast(targets, 1)) {
              onChange({
                op: 'change-shape',
                shape,
                targets
              })
            }
          }} />
      )}
      <Colors
        nodes={nodes}
        onColorChange={(color: ColorKey | ThemeColorKey) => {
          const targets = [] as Fqn[]
          for (const nd of nodes) {
            api.updateNodeData(nd.id, ({ data }: XYFlowNode) => {
              if (data.element.color === color) {
                return data
              }
              return ({
                ...data,
                element: {
                  ...data.element,
                  color
                }
              })
            })
            targets.push(nd.data.element.id)
          }
          if (hasAtLeast(targets, 1)) {
            onChange({
              op: 'change-color',
              color,
              targets
            })
          }
        }} />
      <NavigateToOption nodes={nodes} />
    </Stack>
  )
}

function Colors({
  nodes: [firstNode, ...nodes],
  onColorChange
}: {
  nodes: NonEmptyArray<XYNodesData>
  onColorChange: (color: ColorKey | ThemeColorKey) => void
}) {
  let selectedColor = firstNode.data.element.color as ThemeColor | null
  takeWhile(nodes, node => {
    if (node.data.element.color !== selectedColor) {
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
      <TooltipGroup openDelay={400} closeDelay={300}>
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
      </TooltipGroup>
    </Box>
  )
}

function ShapeOption({
  nodes: [firstNode, ...nodes],
  onShapeChange
}: {
  nodes: NonEmptyArray<XYNodesData>
  onShapeChange: (shape: ElementShape) => void
}) {
  let selectedShape = firstNode.data.element.shape as ElementShape | null
  takeWhile(nodes, node => {
    if (node.data.element.shape !== selectedShape) {
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
        }} />
    </Box>
  )
}

function NavigateToOption({
  nodes: [node, ...nodes]
}: {
  nodes: NonEmptyArray<XYNodesData>
}) {
  const isMultiple = nodes.length >= 1
  return (
    <Box>
      <Divider label="navigate to" labelPosition="left" />
      <Select
        mt={'xs'}
        size="xs"
        variant="filled"
        value={!isMultiple ? (node.data.element.navigateTo ?? null) : null}
        disabled={isMultiple}
        placeholder={isMultiple ? '[ multiple ]' : 'select'}
        data={node.data.element.navigateTo
          ? [{ value: node.data.element.navigateTo, label: node.data.element.navigateTo }]
          : []}
        // data={ElementShapes}
        allowDeselect={true}
        checkIconPosition="right"
        // onChange={(value) => {
        //   if (!value || value === selectedShape) {
        //     return
        //   }
        //   onShapeChange(value as ElementShape)
        // }} />
      />
    </Box>
  )
}
