import { defaultTheme } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { scale, toHex } from 'khroma'
import { memo, useMemo } from 'react'
import { useDiagramState } from '../../../state'
import { vars } from '../../../theme.css'
import type { CompoundXYFlowNode } from '../../types'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import { cssCompound, cssContainer, cssIndicator, cssNavigateBtn, cssTitle } from './CompoundNode.css'

type CompoundNodeProps = Pick<
  NodeProps<CompoundXYFlowNode>,
  'id' | 'data' | 'width' | 'height' | 'selected'
>

// @ts-ignore
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
  }
}) {
  // useTilg()
  const { color, depth = 0, ...compound } = element
  const colors = useMemo(() => {
    const colors = defaultTheme.elements[color]
    return {
      fill: compoundColor(colors.fill, depth),
      stroke: compoundColor(colors.stroke, depth)
    }
  }, [color, depth])

  // const w = toDomPrecision(width ?? compound.width)
  // const h = toDomPrecision(height ?? compound.height)

  const { isHovered, hasOnNavigateTo } = useDiagramState(s => ({
    isHovered: s.hoveredNodeId === id,
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  const isnavigable = !!compound.navigateTo && hasOnNavigateTo

  return (
    <Box
      className={clsx(cssContainer, 'likec4-compound-node')}
      style={assignInlineVars({ fill: vars.element.fill, stroke: vars.element.stroke }, {
        fill: colors.fill,
        stroke: colors.stroke
      })}
      mod={{
        'likec4-color': color,
        'likec4-shape': compound.shape,
        'likec4-navigable': isnavigable,
        hovered: isHovered
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg className={cssIndicator}>
        <rect
          x={0}
          y={0}
          width={'100%'}
          height={'100%'}
          rx={6}
        />
      </svg>
      <div className={clsx(cssCompound, 'likec4-compound')}>
        <Text
          component="div"
          className={clsx(cssTitle, 'likec4-compound-title')}>
          {compound.title}
        </Text>
      </div>
      {isnavigable && <NavigateToBtn xynodeId={id} className={cssNavigateBtn} />}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
    </Box>
  )
})
