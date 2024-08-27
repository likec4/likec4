import type { RequireAtLeastOne } from 'type-fest'
import type { BorderStyle, ElementKind, ElementShape } from './element'
import type { ThemeColor } from './theme'

export type ElementNotation = {
  kinds: ElementKind[]
  shape: ElementShape
  color: ThemeColor
  title: string
}
