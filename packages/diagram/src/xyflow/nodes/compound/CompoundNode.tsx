import { defaultTheme } from '@likec4/core'
import { Text } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { scale, toHex } from 'khroma'
import { useMemo } from 'react'
import { memo } from 'react-tracked'
import { equals } from 'remeda'
import useTilg from 'tilg'
import { useDiagramStateTracked } from '../../../state'
import { toDomPrecision } from '../../../utils'
import type { CompoundNodeData } from '../../types'
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
  id,
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

  const editor = useDiagramStateTracked()
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
            editor.onNavigateTo(id, e)
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
