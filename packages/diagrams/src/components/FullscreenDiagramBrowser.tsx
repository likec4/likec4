import { invariant } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web/esm'
import type { HTMLAttributes } from 'react'
import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { DiagramInitialPosition, DiagramNode, DiagramViews } from '../diagram/types'
import { useViewId } from '../hooks/useViewId'
import { FullscreenDiagram, FullscreenDiagramTitle } from './primitives'

export interface FullscreenDiagramBrowserProps<ViewId extends string>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'chilren'> {
  /**
   * Defined views
   */
  views: DiagramViews<ViewId>

  /**
   * View to display
   */
  initialViewId: ViewId

  /**
   * render diagram at this initial position
   * and animate to fill the screen
   */
  initialPosition: DiagramInitialPosition

  onClose: () => void
}

export function FullscreenDiagramBrowser<ViewId extends string>({
  initialViewId,
  views,
  initialPosition,
  onClose,
  ...props
}: FullscreenDiagramBrowserProps<ViewId>) {
  const viewsRef = useSyncedRef(views)
  const [viewId, setViewId] = useViewId({ initialViewId })
  const diagram = views[viewId]
  invariant(diagram, `View "${viewId}" not found in views`)

  const onNodeClick = useCallback(
    (node: DiagramNode) => {
      if (node.navigateTo && node.navigateTo in viewsRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setViewId(node.navigateTo as any)
      }
    },
    [viewsRef]
  )

  return createPortal(
    <FullscreenDiagram
      diagram={diagram}
      initialPosition={initialPosition}
      closeOnEsc
      closeOnOutsideClick
      onNodeClick={onNodeClick}
      onClose={onClose}
      {...props}
    >
      <FullscreenDiagramTitle>{diagram.title}</FullscreenDiagramTitle>
    </FullscreenDiagram>,
    document.body,
    'FullscreenDiagramBrowser'
  )
}
FullscreenDiagramBrowser.displayName = 'FullscreenDiagramBrowser'
