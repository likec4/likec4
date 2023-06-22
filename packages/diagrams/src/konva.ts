/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rect, Stage, Shape, Text, Group, Path, Circle, Line, Layer } from 'react-konva/es/ReactKonvaCore'
import KonvaCore from 'konva/lib/Core'

import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import 'konva/lib/shapes/Path'
import 'konva/lib/shapes/Circle'
import 'konva/lib/shapes/Line'

import { animated, type AnimatedProps } from '@react-spring/konva'

import type Konva from 'konva'
import type { KonvaNodeComponent, StageProps } from 'react-konva'

// by default Konva prevent some events when node is dragging
// it improve the performance and work well for 95% of cases
// we need to enable all events on Konva, even when we are dragging a node
// so it triggers touchmove correctly
KonvaCore.hitOnDragEnabled = true
KonvaCore.capturePointerEventsEnabled = true

export {
  KonvaCore,
  Stage,
  Group,
  Layer,
  Shape,
  Text,
  Circle,
  Rect
}

export const AnimatedStage: KonvaNodeComponent<Konva.Stage, AnimatedProps<StageProps>> = /* @__PURE__ */ animated(Stage) as any
export const AnimatedRect: KonvaNodeComponent<Konva.Rect, AnimatedProps<Konva.RectConfig>> = /* @__PURE__ */ animated(Rect) as any
export const AnimatedGroup: KonvaNodeComponent<Konva.Group, AnimatedProps<Konva.GroupConfig>> = /* @__PURE__ */ animated(Group) as any
export const AnimatedText: KonvaNodeComponent<Konva.Text, AnimatedProps<Konva.TextConfig>> = /* @__PURE__ */ animated(Text) as any
export const AnimatedPath: KonvaNodeComponent<Konva.Path, AnimatedProps<Konva.PathConfig>> = /* @__PURE__ */ animated(Path) as any
export const AnimatedLine: KonvaNodeComponent<Konva.Line, AnimatedProps<Konva.LineConfig>> = /* @__PURE__ */ animated(Line) as any
export const AnimatedCircle: KonvaNodeComponent<Konva.Circle, AnimatedProps<Konva.CircleConfig>> = /* @__PURE__ */ animated(Circle) as any
