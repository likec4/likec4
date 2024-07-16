import type { LikeC4Theme } from '../types/theme'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'

export const defaultTheme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a'
} satisfies LikeC4Theme

export { ElementColors, RelationshipColors }
