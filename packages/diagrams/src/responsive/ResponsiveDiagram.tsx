import { useMeasure } from '@react-hookz/web/esm'
import { forwardRef } from 'react'
import { Diagram } from '../diagram/Diagram'
import type { DiagramApi, DiagramProps } from '../diagram/types'

export type ResponsiveDiagramProps = Omit<DiagramProps, 'width' | 'height'> & {
  diagramClassName?: string | undefined
}
export type { DiagramApi }

/**
 * Automatically resize to fit its container,
 * while maintaining the aspect ratio of the diagram.
 */
export const ResponsiveDiagram = /* @__PURE__ */ forwardRef<DiagramApi, ResponsiveDiagramProps>(
  ({ diagram, animate = false, className, diagramClassName, style, ...props }, ref) => {
    const [measures, containerRef] = useMeasure<HTMLDivElement>()
    const w = diagram.width,
      h = diagram.height

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          aspectRatio: `${w} / ${h}`,
          width: '100%',
          height: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: 0,
          maxWidth: w,
          boxSizing: 'border-box',
          ...style
        }}
        className={className}
      >
        <div ref={containerRef} style={{ flex: '1 1 100%', overflow: 'hidden' }}>
          {measures && (
            <Diagram
              ref={ref}
              width={Math.floor(measures.width)}
              height={Math.floor(measures.height)}
              diagram={diagram}
              className={diagramClassName}
              animate={animate}
              {...props}
            />
          )}
        </div>
      </div>
    )
  }
)
ResponsiveDiagram.displayName = 'ResponsiveDiagram'
