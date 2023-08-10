import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { NodeSpringValues } from '../springs'
import type { DiagramNode, DiagramTheme } from '../types'

export interface NodeShapeProps extends KonvaNodeEvents {
  id?: string
  node: DiagramNode
  theme: DiagramTheme
  springs: NodeSpringValues
}

export type ShapeComponent = (props: NodeShapeProps) => JSX.Element
