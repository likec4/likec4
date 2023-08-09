import type { SpringValues } from '@react-spring/konva'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { NodeSprings } from '../springs'
import type { DiagramNode, LikeC4Theme } from '../types'

export interface NodeShapeProps extends KonvaNodeEvents {
  id?: string
  node: DiagramNode
  theme: LikeC4Theme
  springs: SpringValues<NodeSprings>
}

export type ShapeComponent = (props: NodeShapeProps) => JSX.Element
