import type { DeploymentNodeKind } from './deployments'
import type { ElementKind, ElementShape } from './element'
import type { Color } from './theme'

export type ElementNotation = {
  kinds: string[]
  shape: ElementShape
  color: Color
  title: string
}
