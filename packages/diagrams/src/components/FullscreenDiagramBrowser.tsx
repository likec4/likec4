import { invariant } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web'
import type { HTMLAttributes } from 'react'
import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { DiagramInitialPosition, DiagramNode, DiagramViews } from '../diagram/types'
import { useViewIdFromHash } from '../hooks/useViewIdFromHash'
import { FullscreenDiagram, FullscreenDiagramTitle } from './primitives'

export interface FullscreenDiagramBrowserProps<ViewId extends string>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'chilren'>
{
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
  initialPosition?: DiagramInitialPosition | undefined

  /**
   * @default true
   */
  closeOnEsc?: boolean | undefined
  /**
   * @default true
   */
  closeOnOutsideClick?: boolean | undefined

  onClose?: (() => void) | undefined
}

export function FullscreenDiagramBrowser<ViewId extends string>({
  initialViewId,
  views,
  initialPosition,
  onClose,
  closeOnEsc,
  closeOnOutsideClick,
  ...props
}: FullscreenDiagramBrowserProps<ViewId>) {
  const viewsRef = useSyncedRef(views)
  const [viewId, setViewId] = useViewIdFromHash({
    initialViewId,
    onReturnToInitial: () => {
      onClose?.()
    }
  })
  const diagram = views[viewId]
  invariant(diagram, `View "${viewId}" not found in views`)

  const onNodeClick = useCallback(
    (node: DiagramNode) => {
      if (node.navigateTo && node.navigateTo in viewsRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setViewId(node.navigateTo as any)
      }
    },
    [viewsRef, setViewId]
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
