import type { DiagramNode } from '@likec4/core/types'
import { CylinderShape } from './Cylinder'
import { RectangleShape } from './Rectangle'
import { QueueShape } from './Queue'

export function nodeShape({ shape }: DiagramNode) {
  switch (shape) {
    case 'cylinder':
    case 'storage': {
      return CylinderShape
    }
    case 'queue': {
      return QueueShape
    }
    case 'rectangle':
    case 'person':
    case 'browser': {
      return RectangleShape
    }
  }
  // @ts-expect-error - this should be unreachable
  throw new Error('Unexpected shape: ' + shape)
}
