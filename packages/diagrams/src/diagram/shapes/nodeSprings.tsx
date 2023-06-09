import type { SpringValues } from '@react-spring/konva'
import { to } from '@react-spring/konva'
import type { InterporatedNodeSprings, NodeSprings } from './types'

export function interpolateNodeSprings({
  opacity,
  scale,
  width,
  height,
  x,
  y,
}: SpringValues<NodeSprings>): InterporatedNodeSprings {
  return {
    offsetX: width.to(w => Math.round(w / 2)),
    offsetY: height.to(h => Math.round(h / 2)),
    x: to([x, width], (val, w) => Math.round(val + w / 2)),
    y: to([y, height], (val, h) => Math.round(val + h / 2)),
    width,
    height,
    opacity,
    scaleX: scale,
    scaleY: scale
  }
}
