import type { DiagramView } from '@likec4/core/types'
import { useMeasure } from '@react-hookz/web/esm'
import type { DiagramProps } from './diagram'
import { Diagram } from './diagram'

export interface EmbeddedDiagramProps extends Omit<DiagramProps, 'width' | 'height' | 'id' | 'diagram' | 'pannable' | 'zoomable' | 'zoomBy'> {
  diagram: DiagramView
}

export function EmbeddedDiagram({
  diagram,
  ...props
}: EmbeddedDiagramProps) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()
  const w = Math.ceil(diagram.width)
  const h = Math.ceil(diagram.height)

  // const width = measures?.width ?? diagram.width
  // const height = measures?.height ?? diagram.height

  return <div
    ref={containerRef}
    style={{
      aspectRatio: `${w} / ${h}`,
      margin: '0 auto',
      ...(w > h ? {
        width: '100%',
        height: 'auto',
        maxWidth: diagram.width,
      } : {
        width: 'auto',
        height: '100%',
        maxHeight: diagram.height
      })
    }}>
    {measures &&
      <Diagram
        id={diagram.id}
        diagram={diagram}
        width={measures.width}
        height={measures.height}
        pannable={false}
        zoomable={false}
        {...props}
      />}
  </div>
}
