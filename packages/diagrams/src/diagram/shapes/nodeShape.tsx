import type { DiagramNode } from '../types'
import { RectangleShape } from './Rectangle'
import { CylinderShape } from './Cylinder'
import { QueueShape } from './Queue'
import { BrowserShape } from './Browser'
import { PersonShape } from './Person'
import type { ShapeComponent } from './types'
import { MobileShape } from './Mobile'
import { nonexhaustive } from '@likec4/core'

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
    case 'mobile': {
      return MobileShape
    }
    default: {
      return nonexhaustive(shape)
    }
  }
}
