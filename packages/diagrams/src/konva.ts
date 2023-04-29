/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rect, Stage, Shape, Text, Group, Path, Circle, Line, Layer } from 'react-konva/es/ReactKonvaCore'

import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import 'konva/lib/shapes/Path'
import 'konva/lib/shapes/Circle'
import 'konva/lib/shapes/Line'

import { animated, type AnimatedProps } from '@react-spring/konva'

import type Konva from 'konva'
import type { KonvaNodeComponent, StageProps } from 'react-konva'

export {
  Stage,
  Group,
  Layer,
  Shape,
  Text,
  Circle,
  Rect
}

export const AnimatedStage: KonvaNodeComponent<Konva.Stage, AnimatedProps<StageProps>> = animated(Stage) as any
export const AnimatedRect: KonvaNodeComponent<Konva.Rect, AnimatedProps<Konva.RectConfig>> = animated(Rect) as any
export const AnimatedGroup: KonvaNodeComponent<Konva.Group, AnimatedProps<Konva.GroupConfig>> = animated(Group) as any
export const AnimatedText: KonvaNodeComponent<Konva.Text, AnimatedProps<Konva.TextConfig>> = animated(Text) as any
export const AnimatedPath: KonvaNodeComponent<Konva.Path, AnimatedProps<Konva.PathConfig>> = animated(Path) as any
export const AnimatedLine: KonvaNodeComponent<Konva.Line, AnimatedProps<Konva.LineConfig>> = animated(Line) as any
