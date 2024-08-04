import type { NonEmptyArray, XYPoint } from './_common'
import type { BorderStyle, ElementShape, Fqn } from './element'
import type { ThemeColor } from './theme'
import type { EdgeId, ViewManualLayout } from './view'

export namespace ViewChanges {
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
}
export type ViewChangeOp = ViewChanges.ChangeElementStyle | ViewChanges.SaveManualLayout
