import { invariant } from '@likec4/core'
import { useKeyboardEvent, useMeasure } from '@react-hookz/web/esm'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade'
import type { HTMLAttributes } from 'react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Diagram } from '../../../diagram/Diagram'
import type {
  DiagramInitialPosition,
  DiagramPaddings,
  DiagramView,
  OnEdgeClick,
  OnNodeClick,
  OnStageClick
} from '../../../diagram/types'
import { CloseButton } from './CloseButton'

// prettier-ignore
export interface FullscreenDiagramProps extends HTMLAttributes<HTMLDivElement> {

  diagram: DiagramView

  /**
   * The padding inside the canvas
   * This padding is consistent and does not change on auto-zooming
   *
   * @default [20, 20, 20, 20]
   */
  padding?: DiagramPaddings | undefined

  /**
   * The CSS styles for the diagram canvas
   */
  styleDiagram?: CSSProperties | undefined

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

  onNodeClick?: OnNodeClick | undefined
  onStageClick?: OnStageClick | undefined
  onEdgeClick?: OnEdgeClick | undefined

}

const DefaultPadding = [30, 30, 30, 30] satisfies DiagramPaddings

const StyleOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--likec4-browser-overlay-bg, rgba(18,18,18,0.9))',
  backdropFilter: 'var(--likec4-browser-backdrop, blur(4px))',
  zIndex: 'var(--likec4-overlay-z-index, 100)',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  border: '0 solid transparent'
} satisfies CSSProperties

const StyleContainer = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  touchAction: 'pan-x pan-y pinch-zoom'
} satisfies CSSProperties

// function processRenderViewTitle(
//   renderViewTitle: FullscreenDiagramProps['renderViewTitle'],
//   view: DiagramView
// ) {
//   if (renderViewTitle === undefined) {
//     return <FullscreenDiagramTitle>{view.title}</FullscreenDiagramTitle>
//   }
//   if (renderViewTitle === null) {
//     return null
//   }
//   let title: ReactNode = null
//   if (is(Function, renderViewTitle)) {
//     title = renderViewTitle(view)
//   }
//   if (title !== null && typeof title === 'string') {
//     title = <FullscreenDiagramTitle>{title}</FullscreenDiagramTitle>
//   }
//   return title
// }

export function FullscreenDiagram({
  diagram,
  initialPosition,
  padding,
  style,
  styleDiagram,
  closeOnEsc = true,
  closeOnOutsideClick,
  onNodeClick,
  onEdgeClick,
  onStageClick,
  onClose,
  children,
  ...props
}: FullscreenDiagramProps) {
  if (onStageClick && closeOnOutsideClick === true) {
    throw new Error('onStageClick cannot be used with closeOnOutsideClick')
  }
  if (closeOnEsc || closeOnOutsideClick) {
    invariant(onClose, 'onClose is required when closeOnEsc or closeOnOutsideClick')
  }

  const overlayRef = useRef<HTMLDivElement>(null)
  const [measures, containerRef] = useMeasure<HTMLDivElement>()

  useEffect(() => {
    const target = overlayRef.current
    if (!target) {
      return
    }
    disableBodyScroll(target)
    return () => {
      enableBodyScroll(target)
    }
  }, [])

  // Close on ESC
  useKeyboardEvent(
    closeOnEsc && 'Escape',
    () => {
      onClose?.()
    },
    [],
    { eventOptions: { passive: true } }
  )

  return (
    <div
      ref={overlayRef}
      style={{
        ...StyleOverlay,
        ...style
      }}
      {...props}
    >
      <div
        ref={containerRef}
        style={{
          ...StyleContainer
        }}
      >
        {measures && (
          <Diagram
            animate
            pannable
            zoomable
            diagram={diagram}
            width={measures.width}
            height={measures.height}
            initialPosition={initialPosition}
            padding={padding ?? DefaultPadding}
            style={styleDiagram}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onStageClick={onStageClick ?? (closeOnOutsideClick ? onClose : undefined)}
          />
        )}
      </div>
      {children}
      {onClose && <CloseButton onClick={() => onClose()} />}
    </div>
  )
}
FullscreenDiagram.displayName = 'FullscreenDiagram'
