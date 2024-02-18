import { defaultTheme } from '@likec4/core'
import { Image, Text } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { scale, toHex } from 'khroma'
import { memo, useMemo } from 'react'
import { equals } from 'remeda'
import { toDomPrecision } from '../../../utils'
import { useLikeC4ViewState, useLikeC4ViewTriggers } from '../../likec4view_.state'
import type { CompoundNodeData, CompoundXYFlowNode } from '../../types'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import classes from './compound.module.css'

type CompoundNodeProps = Pick<
  NodeProps<CompoundNodeData>,
  'id' | 'data' | 'width' | 'height' | 'selected'
>
const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  && prev.selected === next.selected
  && prev.width === next.width
  && prev.height === next.height
  && equals(prev.data, next.data)
)

const compoundColor = (color: string, depth: number) =>
  toHex(
    scale(color, {
      l: -35 - 5 * depth,
      s: -15 - 5 * depth
    })
  )

export const CompoundNode = memo<CompoundNodeProps>(function CompoundNodeInner({
  data: {
    element
  },
  width,
  height
}) {
  // useTilg()
  const { color, depth = 0, ...compound } = element
  const colors = useMemo(() => {
    const colors = defaultTheme.elements[color]
    return {
      ...colors,
      fill: compoundColor(colors.fill, depth),
      stroke: compoundColor(colors.stroke, depth)
    }
  }, [color, depth])

  const w = toDomPrecision(width ?? compound.width)
  const h = toDomPrecision(height ?? compound.height)

  const editor = useLikeC4ViewState()
  const trigger = useLikeC4ViewTriggers()

  const isNavigatable = editor.hasOnNavigateTo && !!compound.navigateTo

  return (
    <div
      className={classes.container}
      data-likec4-color={color}
      data-likec4-shape={compound.shape}
      data-likec4-navigatable={isNavigatable}
      style={{
        // @ts-expect-error
        '--likec4-element-fill': colors.fill,
        '--likec4-element-stroke': colors.stroke
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg className={classes.indicator} viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <rect
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          rx={6}
        />
      </svg>
      <div
        className={clsx(classes.compound)}
      >
        <Text component="div" className={classes.title}>{compound.title}</Text>
      </div>
      {isNavigatable && (
        <NavigateToBtn
          onClick={(e) => {
            trigger.onNavigateTo(element, e)
          }}
          className={classes.navigateBtn} />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
    </div>
  )
}, isEqualProps)
