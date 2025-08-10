import {
  type Color,
  type ElementShape,
  type ElementStyle,
  DefaultPaddingSize,
  DefaultShapeSize,
  DefaultTextSize,
} from '@likec4/core/types'
import type {
  Node as RFNode,
} from '@xyflow/react'
import type { Base } from './types'

/**
 * Calculates the sizes (text/shape/padding) for the node based on the style.
 *
 * For example, if the style has only `textSize` and no `size`, the `size` will be set to `textSize`.
 */
export function calcLikec4Sizes({
  size,
  padding,
  textSize,
}: ElementStyle) {
  if (!size && !!textSize) {
    size = textSize
  }
  if (!textSize && !!size) {
    textSize = size
  }
  if (!padding && !!size) {
    padding = size
  }
  size ??= DefaultShapeSize
  textSize ??= DefaultTextSize
  padding ??= DefaultPaddingSize
  return {
    size,
    padding,
    textSize,
  }
}

type NodeRequiredData = Base.NodeData & {
  color: Color
  shape: ElementShape
  style?: ElementStyle
}
export function nodeDomAttributes({
  color,
  shape,
  style,
  dimmed = false,
  hovered = false,
}: NodeRequiredData): NonNullable<RFNode['domAttributes']> {
  const {
    size,
    padding,
    textSize,
  } = calcLikec4Sizes(style ?? {})
  return {
    'data-likec4-color': color,
    'data-likec4-shape': shape,
    'data-likec4-shape-size': size,
    'data-likec4-spacing': padding,
    'data-likec4-text-size': textSize,
    'data-likec4-hovered': hovered,
    ...(dimmed !== false && {
      'data-likec4-dimmed': dimmed,
    }),
  } as any // TODO: fix types
}

type CompoundNodeRequiredData = Base.NodeData & {
  color: Color
  depth: number
  style?: ElementStyle
}
export function compoundDomAttributes({
  color,
  style,
  depth,
  dimmed = false,
  hovered = false,
}: CompoundNodeRequiredData): NonNullable<RFNode['domAttributes']> {
  return {
    'data-likec4-color': color,
    'data-compound-depth': depth,
    'data-likec4-hovered': hovered,
    ...(dimmed !== false && {
      'data-likec4-dimmed': dimmed,
    }),
  } as any // TODO: fix types
}
