import type { NonEmptyArray } from './_common'
import type { BorderStyle, ElementShape, Fqn } from './element'
import type { ThemeColor } from './theme'
import type { AutoLayoutDirection, ViewManualLayout } from './view'

export namespace ViewChange {
  export interface ChangeElementStyle {
    op: 'change-element-style'
    style: {
      border?: BorderStyle
      opacity?: number
      shape?: ElementShape
      color?: ThemeColor
    }
    targets: NonEmptyArray<Fqn>
  }

  export interface SaveManualLayout {
    op: 'save-manual-layout'
    layout: ViewManualLayout
  }

  export interface ChangeAutoLayout {
    op: 'change-autolayout'
    layout: {
      direction: AutoLayoutDirection
      nodeSep?: number | null
      rankSep?: number | null
    }
  }
}
export type ViewChange = ViewChange.ChangeElementStyle | ViewChange.SaveManualLayout | ViewChange.ChangeAutoLayout
