import type { DiagramNode } from '../types'
import { RectangleShape } from './Rectangle'
import { CylinderShape } from './Cylinder'
import { QueueShape } from './Queue'
import { BrowserShape } from './Browser'
import { PersonShape } from './Person'
import type { ShapeComponent } from './types'
import { MobileShape } from './Mobile'

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
  }
  // @ts-expect-error - this should be unreachable code if all shapes are handled
  throw new Error(`Unknown shape: ${shape}`)
}
