import type { SpringValues, SpringValue, Controller } from '@react-spring/konva'
import type { FrameValue } from '@react-spring/core'
import { to } from '@react-spring/konva'

interface NodeSprings {
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
  x,
  y,
}: SpringValues<NodeSprings>): InterporatedNodeSprings {
  return {
    offsetX: width.to(w => Math.round(w / 2)),
    offsetY: height.to(h => Math.round(h / 2)),
    x: to([x, width], (v, w) => v + Math.round(w / 2)),
    y: to([y, height], (v, h) => v + Math.round(h / 2)),
    width,
    height,
    opacity,
    scaleX: scale,
    scaleY: scale
  }
}
