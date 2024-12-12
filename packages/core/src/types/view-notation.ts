import type { ElementShape } from './element'
import type { Color } from './theme'

export type ElementNotation = {
  kinds: string[]
  shape: ElementShape
  color: Color
  title: string
}
