/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMeasure } from '@react-hookz/web/esm'
import { forwardRef } from 'react'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramApi, LikeC4DiagramProps } from './types'

export type ResponsiveDiagramProps = Omit<LikeC4DiagramProps, 'width' | 'height'> & {
  diagramClassName?: string | undefined
}

export const ResponsiveDiagram = /* @__PURE__ */ forwardRef<
  LikeC4DiagramApi,
  ResponsiveDiagramProps
>(({ diagram, className, diagramClassName, ...props }, ref) => {
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
        boxSizing: 'border-box'
      }}
      className={className}
    >
      <div ref={containerRef} style={{ flex: '1 1 100%', overflow: 'hidden' }}>
        {measures && (
          <LikeC4Diagram
            ref={ref}
            width={Math.floor(measures.width)}
            height={Math.floor(measures.height)}
            diagram={diagram}
            className={diagramClassName}
            {...props}
          />
        )}
      </div>
    </div>
  )
})
