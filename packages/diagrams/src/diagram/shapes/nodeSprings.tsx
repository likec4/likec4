import type { SpringValues } from '@react-spring/konva'
import { to } from '@react-spring/konva'
import type { InterporatedNodeSprings, NodeSprings, NodeSpringsCtrl } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const cache = new WeakMap<any, any>()

// function cacheable<S, T>(spring: S, fn: (spring: S) => T): T {
//   let value = cache.get(spring)
//   console.count('cacheable call')
//   if (!value) {
//     console.count('cache miss')
//     value = fn(spring)
//     cache.set(spring, value)
//   } else {
//     console.count('cache hit')
//   }
//   return value as T
// }

// export function interpolatedNodeSprings(ctrl: NodeSpringsCtrl): InterporatedNodeSprings {
//   return cacheable(ctrl, ({ springs: { opacity, scale, width, height, x, y } }) => ({
//     offsetX: width.to(v => Math.round(v / 2)),
//     offsetY: height.to(v => Math.round(v / 2)),
//     x: to([x, width], (val, w) => Math.round(val + w / 2)),
//     y: to([y, height], (val, h) => Math.round(val + h / 2)),
//     width,
//     height,
//     opacity,
//     scaleX: scale,
//     scaleY: scale
//   }))
// }

export function interpolateNodeSprings({
  opacity,
  scale,
  width,
  height,
  x,
  y
}: SpringValues<NodeSprings>): InterporatedNodeSprings {
  return {
    offsetX: width.to(v => Math.round(v / 2)),
    offsetY: height.to(v => Math.round(v / 2)),
    x: to([x, width], (val, w) => Math.round(val + w / 2)),
    y: to([y, height], (val, h) => Math.round(val + h / 2)),
    width,
    height,
    opacity,
    scaleX: scale,
    scaleY: scale
  }
}
