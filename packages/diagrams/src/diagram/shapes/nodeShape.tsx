import type { DiagramNode } from '@likec4/core/types'
import { CylinderShape } from './Cylinder'
import { RectangleShape } from './Rectangle'

export function nodeShape({ shape }: DiagramNode) {
  switch (shape) {
    case 'cylinder':
    case 'storage': {
      return CylinderShape
    }
    default: {
      return RectangleShape
    }
  }
}
