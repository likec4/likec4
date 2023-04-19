import { to, type SpringValues, type SpringValue, type Controller } from '@react-spring/konva'
import type { FrameValue } from '@react-spring/core'

export interface NodeSprings {
  x: number
  y: number
  opacity: number
  scale: number
  width: number
  height: number
}

export type NodeSpringsCtrl = Controller<NodeSprings>

export type InterporatedNodeSprings = SpringValues<Omit<NodeSprings, 'x' | 'y' | 'scale'>> & {
  scaleX: SpringValue<number>
  scaleY: SpringValue<number>
  x: FrameValue<number>
  y: FrameValue<number>
  offsetX: FrameValue<number>
  offsetY: FrameValue<number>
}

export function interpolateNodeSprings({
  opacity,
  scale,
  width,
  height,
  ...input
}: SpringValues<NodeSprings>): InterporatedNodeSprings {
  return {
    offsetX: width.to(w => Math.round(w / 2)),
    offsetY: height.to(h => Math.round(h / 2)),
    x: to([input.x, width], (v, w) => v + Math.round(w / 2)),
    y: to([input.y, height], (v, h) => v + Math.round(h / 2)),
    width,
    height,
    opacity,
    scaleX: scale,
    scaleY: scale
  }
}
