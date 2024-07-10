import {
  type BorderStyle,
  defaultTheme,
  type ElementShape,
  ElementShapes,
  invariant,
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
  SegmentedControl,
  Select,
  Slider,
  Space,
  Stack,
  Text,
  Tooltip,
  TooltipGroup
} from '@mantine/core'
import { shallowEqual } from 'fast-equals'
import { memo, useState } from 'react'
import { hasAtLeast, keys, takeWhile } from 'remeda'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { Changes } from '../../LikeC4Diagram.props'
import { useDiagramStoreApi } from '../../state/hooks'
import { useXYNodesData } from '../../xyflow/hooks'
import { XYFlowNode } from '../../xyflow/types'

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

export const colors = keys(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

export type ThemeColorKey = typeof themedColors[0]['key']
export type ColorKey = typeof colors[0]['key']

type XYNodesData = Pick<XYFlowNode, 'id' | 'data' | 'type'>

export const NodeOptions = memo<{ selectedNodeIds: string[] }>(({ selectedNodeIds }) => {
  // export function NodeOptions(props: { nodes: XYFlowNode[] }) {
  const diagramApi = useDiagramStoreApi()
  // const nodes = useXYNodesData(props.nodes.map(node => node.id))
  const nodes = useXYNodesData(selectedNodeIds)
  if (!hasAtLeast(nodes, 1)) {
    return null
  }
  if (nodes.length !== selectedNodeIds.length) {
    throw new Error('NodeOptions: nodes and props.nodes should have the same length')
  }
  // Makes sense to show shape option only if there is at least one element node
  const showShapeOption = nodes.some(node => node.type === 'element')

  const [firstNode, ...rest] = nodes

  // Makes sense to show opacity option only if there is at least one compound node
  const showOpacityOption = firstNode.type === 'compound'
    && (rest.length === 0 || rest.every(node => node.type === 'compound'))

  const triggerChange = (style: Changes.ChangeElementStyle['style']) => {
    const targets = nodes.map(node => node.data.element.id)
    invariant(hasAtLeast(targets, 1), 'At least one target is required')
    diagramApi.getState().triggerChangeElementStyle({
      op: 'change-element-style',
      style,
      targets
    })
  }

  return (
    <Stack gap={'xs'}>
      <div>
        <Text fz={rem(9)} fw={'500'} c={'dimmed'}>
          ELEMENT{rest.length > 0 ? 'S' : ``}
        </Text>
        <Text size="xs" c={rest.length > 0 ? 'dimmed' : ''} truncate>
          {rest.length === 0 ? firstNode.data.element.title : `[ multiple ]`}
        </Text>
      </div>
      {showShapeOption && (
        <ShapeOption
          nodes={nodes}
          onShapeChange={(shape: ElementShape) => {
            triggerChange({ shape })
          }} />
      )}
      <Colors
        nodes={nodes}
        onColorChange={(color: ColorKey | ThemeColorKey) => {
          triggerChange({ color })
        }} />

      {showOpacityOption && (
        <div key={firstNode.id}>
          <Divider label="opacity and border" labelPosition="left" />
          <Space h={'xs'} />
          <OpacityOption
            node={firstNode}
            onOpacityChange={(opacity: number) => {
              triggerChange({ opacity })
            }} />
          <Space h={'sm'} />
          <BorderStyleOption
            node={firstNode}
            onChange={(border: BorderStyle) => {
              triggerChange({ border })
            }}
          />
        </div>
      )}
      <NavigateToOption nodes={nodes} />
    </Stack>
  )
}, (prevProps, nextProps) => shallowEqual(prevProps.selectedNodeIds, nextProps.selectedNodeIds))

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
    <div>
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
    </div>
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
    <div>
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
    </div>
  )
}

function NavigateToOption({
  nodes: [node, ...nodes]
}: {
  nodes: NonEmptyArray<XYNodesData>
}) {
  const isMultiple = nodes.length >= 1
  return (
    <div>
      <Divider label="navigate to" labelPosition="left" />
      {isMultiple && (
        <Text size="xs" c={'dimmed'}>
          {'[ multiple ]'}
        </Text>
      )}
      {!isMultiple && (
        <>
          <Space h={'xs'} />
          <Select
            size="xs"
            variant="filled"
            value={node.data.element.navigateTo ?? null}
            placeholder={'select'}
            data={node.data.element.navigateTo
              ? [{ value: node.data.element.navigateTo, label: node.data.element.navigateTo }]
              : []}
            allowDeselect={true}
            checkIconPosition="right"
          />
        </>
      )}
    </div>
  )
}

function OpacityOption({
  node,
  onOpacityChange
}: {
  node: XYNodesData
  onOpacityChange: (opacity: number) => void
}) {
  let selectedOpacity = node.data.element.style.opacity ?? 100
  const [value, setValue] = useState(selectedOpacity)
  useUpdateEffect(() => {
    setValue(selectedOpacity)
  }, [selectedOpacity])

  return (
    <Slider
      size={'sm'}
      color={'dark'}
      value={value}
      onChange={setValue}
      onChangeEnd={onOpacityChange} />
  )
}

function BorderStyleOption({
  node,
  onChange
}: {
  node: XYNodesData
  onChange: (borderStyle: BorderStyle) => void
}) {
  let selecteBorderStyle = node.data.element.style.border ?? 'dashed'
  const [value, setValue] = useState(selecteBorderStyle)
  useUpdateEffect(() => {
    setValue(selecteBorderStyle)
  }, [selecteBorderStyle])

  return (
    <Box>
      <SegmentedControl
        size="xs"
        fullWidth
        withItemsBorders={false}
        value={value}
        onChange={v => {
          setValue(v as BorderStyle)
          onChange(v as BorderStyle)
        }}
        data={[
          { label: 'Solid', value: 'solid' },
          { label: 'Dashed', value: 'dashed' },
          { label: 'Dotted', value: 'dotted' },
          { label: 'None', value: 'none' }
        ]}
      />
    </Box>
  )
}
