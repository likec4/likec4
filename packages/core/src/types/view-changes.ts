import type { NonEmptyArray, XYPosition } from './_common'
import type { BorderStyle, ElementShape, Fqn } from './element'
import type { ThemeColor } from './theme'
import type { EdgeId } from './view'

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
    nodes: Record<Fqn, {
      x: number
      y: number
      width: number
      height: number
    }>
    edges: Record<EdgeId, {
      controlPoints: XYPosition[]
    }>
  }
}
export type ViewChangeOp = ViewChanges.ChangeElementStyle | ViewChanges.SaveManualLayout
