import type { DiagramInitialPosition, DiagramViews } from '../diagram/types'

export interface DiagramViewsProps<ViewId extends string> {
  /**
   * Defined views
   */
  views: DiagramViews<ViewId>

  /**
   * View to display
   */
  viewId: ViewId
}

export interface DiagramDiscloseProps<ViewId extends string> extends DiagramViewsProps<ViewId> {
  /**
   * render diagram at this initial position
   * and animate to fill the screen
   */
  initialPosition: DiagramInitialPosition
}
