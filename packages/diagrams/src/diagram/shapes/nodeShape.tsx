import type { DiagramNode } from '@likec4/core'
import { RectangleShape } from './Rectangle'
import { CylinderShape } from './Cylinder'
import { QueueShape } from './Queue'
import { unexhaustive } from './utils'
import { BrowserShape } from './Browser'
import type { NodeShapeProps } from './types'

type ShapeComponent = (props: NodeShapeProps) => JSX.Element

export function nodeShape({ shape }: DiagramNode): ShapeComponent {
  switch (shape) {
    case 'cylinder':
    case 'storage': {
      return CylinderShape
    }
    case 'queue': {
      return QueueShape
    }
    case 'browser': {
      return BrowserShape
    }
    case 'rectangle':
    case 'person': {
      return RectangleShape
    }
  }
  // @ts-expect-error - this should be unreachable
  unexhaustive(shape)
}
