import type { DiagramNode } from '@likec4/core/types'
import { CylinderShape } from './Cylinder'
import { RectangleShape } from './Rectangle'
import { QueueShape } from './Queue'
import { unexhaustive } from './utils'
import { BrowserShape } from './Browser'

export function nodeShape({ shape }: DiagramNode) {
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
