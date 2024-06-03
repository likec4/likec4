import KonvaCore from 'konva/lib/Core'
import { Circle, Ellipse, Group, Image, Layer, Line, Path, Rect, Stage, Text } from 'react-konva/es/ReactKonvaCore'

import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import 'konva/lib/shapes/Path'
import 'konva/lib/shapes/Circle'
import 'konva/lib/shapes/Line'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Ellipse'

import type Konva from 'konva'
import type { KonvaNodeEvents, StageProps } from 'react-konva'

import { animated } from '@react-spring/konva'
import type { FluidValue } from '@react-spring/shared'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

// by default Konva prevent some events when node is dragging
// it improve the performance and work well for 95% of cases
// we need to enable all events on Konva, even when we are dragging a node
// so it triggers touchmove correctly
KonvaCore.hitOnDragEnabled = true
KonvaCore.capturePointerEventsEnabled = true
KonvaCore.dragButtons = [0, 2]

export { Circle, Ellipse, Group, Image, KonvaCore, Layer, Line, Path, Rect, Stage, Text }

/**
 * Partially copied from @react-spring/konva
 * to fix the recursive type errors
 */

// prettier-ignore
type AnimatedLeaf<T> =
  | Exclude<T, object | void>
  | Extract<T, ReadonlyArray<number | string>> extends infer U ? [U] extends [never] ? never
  : FluidValue<U | Exclude<T, object | void>>
  : never

// prettier-ignore
type AnimatedProp<T> = [T, T] extends [infer _T, infer DT] ? DT extends void ? undefined
  : [DT] extends [never] ? never
  : DT extends object ? DT
  : DT | AnimatedLeaf<T>
  : never

type AnimatedProps<Props extends object> = {
  [P in keyof Props]: P extends 'ref' | 'key' ? Props[P] : AnimatedProp<Props[P]>
}

type AnimatedNode<
  Node extends Konva.Node,
  Props extends Konva.NodeConfig
> = ForwardRefExoticComponent<KonvaNodeEvents & AnimatedProps<Props> & RefAttributes<Node>>

export type AnimatedStageComponent = AnimatedNode<Konva.Stage, StageProps>
export type AnimatedGroupComponent = AnimatedNode<Konva.Group, Konva.GroupConfig>
export type AnimatedRectComponent = AnimatedNode<Konva.Rect, Konva.RectConfig>
export type AnimatedCircleComponent = AnimatedNode<Konva.Circle, Konva.CircleConfig>
export type AnimatedLineComponent = AnimatedNode<Konva.Line, Konva.LineConfig>
export type AnimatedTextComponent = AnimatedNode<Konva.Text, Konva.TextConfig>
export type AnimatedPathComponent = AnimatedNode<Konva.Path, Konva.PathConfig>
export type AnimatedEllipseComponent = AnimatedNode<Konva.Ellipse, Konva.EllipseConfig>

// @ts-expect-error invalid konva typings
export const AnimatedStage: AnimatedStageComponent = /* @__PURE__ */ animated(Stage)
// @ts-expect-error invalid konva typings
export const AnimatedRect: AnimatedRectComponent = /* @__PURE__ */ animated(Rect)
// @ts-expect-error invalid konva typings
export const AnimatedGroup: AnimatedGroupComponent = /* @__PURE__ */ animated(Group)
// @ts-expect-error invalid konva typings
export const AnimatedText: AnimatedTextComponent = /* @__PURE__ */ animated(Text)
// @ts-expect-error invalid konva typings
export const AnimatedPath: AnimatedPathComponent = /* @__PURE__ */ animated(Path)
// @ts-expect-error invalid konva typings
export const AnimatedLine: AnimatedLineComponent = /* @__PURE__ */ animated(Line)
// @ts-expect-error invalid konva typings
export const AnimatedCircle: AnimatedCircleComponent = /* @__PURE__ */ animated(Circle)
// @ts-expect-error invalid konva typings
export const AnimatedEllipse: AnimatedEllipseComponent = /* @__PURE__ */ animated(Ellipse)
