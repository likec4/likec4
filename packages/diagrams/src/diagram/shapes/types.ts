import type Konva from 'konva'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramTheme } from '../types'
import type { Controller, FrameValue, SpringValue, SpringValues } from '@react-spring/konva'
import type { DiagramNode } from '@likec4/core'

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

export interface NodeShapeProps extends KonvaNodeEvents {
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
}

export type OnMouseEvent = Konva.KonvaEventObject<MouseEvent>
export type OnPointerEvent = Konva.KonvaEventObject<PointerEvent>
export type OnClickEvent = Konva.KonvaEventObject<PointerEvent>

export type OnWheelEvent = Konva.KonvaEventObject<WheelEvent>

export type OnNodeClick = (node: DiagramNode, event: OnPointerEvent) => void
export type OnStageClick = (stage: Konva.Stage, event: OnPointerEvent) => void
