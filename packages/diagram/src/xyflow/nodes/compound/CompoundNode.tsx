import { Box, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { memo } from 'react'
import { clamp } from 'remeda'
import { useDiagramState } from '../../../state'
import type { CompoundXYFlowNode } from '../../types'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import { compoundBody, container, indicator, navigateBtn, title } from './CompoundNode.css'
import * as css from './CompoundNode.css'

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

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>(function CompoundNode({
  id,
  data: {
    element
  }
}) {
  // useTilg()
  const { color, style, depth = 1, ...compound } = element
  // const w = toDomPrecision(width ?? compound.width)
  // const h = toDomPrecision(height ?? compound.height)
  const opacity = style.opacity ?? 100

  const { isHovered, hasOnNavigateTo } = useDiagramState(s => ({
    isHovered: s.hoveredNodeId === id,
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  const isnavigable = !!compound.navigateTo && hasOnNavigateTo

  const transparency = clamp(100 - opacity, {
    min: 0,
    max: 98
  })

  return (
    <Box
      className={clsx(css.container, 'likec4-compound-node')}
      mod={{
        'compound-depth': depth,
        'likec4-color': color,
        'likec4-shape': compound.shape,
        'likec4-navigable': isnavigable,
        hovered: isHovered
      }}
      style={assignInlineVars({
        [css.varTransparency]: transparency + '%'
      })}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg className={css.indicator}>
        <rect
          x={0}
          y={0}
          width={'100%'}
          height={'100%'}
          rx={6}
        />
      </svg>
      <div
        className={clsx(css.compoundBody, opacity < 100 && css.transparent, 'likec4-compound')}
        style={{
          borderStyle: opacity < 100 ? style.border : undefined
        }}
      >
        <Text
          component="div"
          className={clsx(css.title, 'likec4-compound-title')}>
          {compound.title}
        </Text>
      </div>
      {isnavigable && <NavigateToBtn xynodeId={id} className={css.navigateBtn} />}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
    </Box>
  )
})
