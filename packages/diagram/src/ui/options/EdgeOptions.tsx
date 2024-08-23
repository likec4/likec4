import { DefaultRelationshipColor, defaultTheme, type NonEmptyArray, type ThemeColor } from '@likec4/core'
import { CheckIcon, ColorSwatch, Divider, Flex, rem, Stack, Text, Tooltip, TooltipGroup } from '@mantine/core'
import { shallowEqual } from 'fast-equals'
import { memo } from 'react'
import { hasAtLeast, keys, takeWhile } from 'remeda'
import { useDiagramStoreApi, useXYEdgesData } from '../../hooks'
import { type XYFlowEdge } from '../../xyflow/types'

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

type XYEdgeData = Pick<XYFlowEdge, 'id' | 'data'>

export const EdgeOptions = memo<{ selectedEdgeIds: string[] }>(({ selectedEdgeIds }) => {
  const diagramApi = useDiagramStoreApi()
  const edges = useXYEdgesData(selectedEdgeIds)
  if (!hasAtLeast(edges, 1)) {
    return null
  }
  if (edges.length !== selectedEdgeIds.length) {
    throw new Error('EdgeOptions: edges and props.edges should have the same length')
  }
  const [firstEdge, ...rest] = edges

  return (
    <Stack gap={'xs'}>
      <div>
        <Text fz={rem(9)} fw={'500'} c={'dimmed'}>
          RELATIONSHIP{rest.length > 0 ? 'S' : ''}
        </Text>
        <Text size="xs" c={rest.length > 0 ? 'dimmed' : ''} truncate>
          {rest.length === 0 ? firstEdge.data.edge.label : `[ multiple ]`}
        </Text>
      </div>
      {
        /* {showShapeOption && (
        <ShapeOption
          nodes={edges}
          onShapeChange={(shape: ElementShape) => {
            triggerChange({ shape })
          }} />
      )} */
      }
      <Colors
        edges={edges}
        onColorChange={(_color: ColorKey | ThemeColorKey) => {
          // triggerChange({ color })
        }} />
    </Stack>
  )
}, (prevProps, nextProps) => shallowEqual(prevProps.selectedEdgeIds, nextProps.selectedEdgeIds))

function Colors({
  edges: [firstEdge, ...edges],
  onColorChange
}: {
  edges: NonEmptyArray<XYEdgeData>
  onColorChange: (color: ColorKey | ThemeColorKey) => void
}) {
  let selectedColor = (firstEdge.data.edge.color ?? DefaultRelationshipColor) as ThemeColor | null
  takeWhile(edges, edge => {
    const color = edge.data.edge.color ?? DefaultRelationshipColor
    if (color !== selectedColor) {
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
