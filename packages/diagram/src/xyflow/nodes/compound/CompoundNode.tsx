import { defaultTheme } from '@likec4/core'
import { Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { scale, toHex } from 'khroma'
import { useMemo } from 'react'
import { memo } from 'react-tracked'
import { useDiagramState } from '../../../state'
import { vars } from '../../../theme'
import type { CompoundXYFlowNode } from '../../types'
import { toDomPrecision } from '../../utils'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import { cssCompound, cssContainer, cssIndicator, cssNavigateBtn, cssTitle } from './CompoundNode.css'

type CompoundNodeProps = Pick<
  NodeProps<CompoundXYFlowNode>,
  'id' | 'data' | 'width' | 'height' | 'selected'
>
const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  && prev.selected === next.selected
  && prev.width === next.width
  && prev.height === next.height
  && eq(prev.data, next.data)
)

const compoundColor = (color: string, depth: number) =>
  toHex(
    scale(color, {
      l: -35 - 5 * depth,
      s: -15 - 5 * depth
    })
  )

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>(function CompoundNode({
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

  const diagramState = useDiagramState()
  const isnavigable = diagramState.hasOnNavigateTo && !!compound.navigateTo

  return (
    <div
      className={cssContainer}
      data-likec4-color={color}
      data-likec4-shape={compound.shape}
      data-likec4-navigable={isnavigable}
      style={assignInlineVars({ fill: vars.element.fill, stroke: vars.element.stroke }, {
        fill: colors.fill,
        stroke: colors.stroke
      })}
    >
      <Handle
        // @ts-expect-error
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg className={cssIndicator} viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <rect
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          rx={6}
        />
      </svg>
      <div
        className={clsx(cssCompound)}
      >
        <Text component="div" className={cssTitle}>{compound.title}</Text>
      </div>
      {isnavigable && <NavigateToBtn xynodeId={id} className={cssNavigateBtn} />}
      <Handle
        // @ts-expect-error
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
    </div>
  )
}, isEqualProps)
