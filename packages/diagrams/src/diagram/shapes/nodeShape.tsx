import type { DiagramNode } from '@likec4/core'
import { RectangleShape } from './Rectangle'
import { CylinderShape } from './Cylinder'
import { QueueShape } from './Queue'
import { unexhaustive } from './utils'
import { BrowserShape } from './Browser'
import { PersonShape } from './Person'
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
    case 'person': {
      return PersonShape
    }
    case 'rectangle': {
      return RectangleShape
    }
  }
  // @ts-expect-error - this should be unreachable
  unexhaustive(shape)
}
