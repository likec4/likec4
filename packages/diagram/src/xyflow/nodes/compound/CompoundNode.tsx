import { Box, Text } from '@mantine/core'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { deepEqual as eq } from 'fast-equals'
import { memo } from 'react'
import { clamp } from 'remeda'
import useTilg from 'tilg'
import { useDiagramState } from '../../../state'
import type { CompoundXYFlowNode } from '../../types'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import * as css from './CompoundNode.css'

type CompoundNodeProps = Pick<
  NodeProps<CompoundXYFlowNode>,
  'id' | 'data' | 'width' | 'height' | 'selected'
>

const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  // && prev.selected === next.selected
  // && eq(prev.width, next.width)
  // && eq(prev.height, next.height)
  && eq(prev.data.element, next.data.element)
)

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>(function CompoundNode({
  id,
  data: {
    element
  }
}) {
  const { color, style, depth = 1, ...compound } = element
  // const w = toDomPrecision(width ?? compound.width)
  // const h = toDomPrecision(height ?? compound.height)
  const opacity = clamp((style.opacity ?? 100) / 100, {
    min: 0,
    max: 1
  })
  const borderTransparency = clamp(50 - opacity * 50, {
    min: 0,
    max: 50
  })

  const { isHovered, isDimmed, hasOnNavigateTo } = useDiagramState(s => ({
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  const isnavigable = !!compound.navigateTo && hasOnNavigateTo

  return (
    <Box
      className={clsx(
        css.container,
        'likec4-compound-node',
        opacity < 1 && 'likec4-compound-transparent',
        isDimmed && css.dimmed
      )}
      mod={{
        'compound-depth': depth,
        'likec4-color': color,
        hovered: isHovered
      }}
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
        className={clsx(
          css.compoundBody,
          opacity < 1 && css.transparent,
          'likec4-compound'
        )}
        style={opacity < 1
          ? {
            ...assignInlineVars({
              [css.varBorderTransparency]: `${borderTransparency}%`,
              [css.varOpacity]: opacity.toFixed(2)
            }),
            borderStyle: style.border ?? 'dashed'
          }
          : undefined}
      >
        <Text
          component="div"
          className={clsx(
            css.title,
            isnavigable && css.titleWithNavigation,
            'likec4-compound-title'
          )}>
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
}, isEqualProps)
