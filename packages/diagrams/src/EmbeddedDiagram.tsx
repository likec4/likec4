import { useMeasure } from '@react-hookz/web/esm'
import type { DiagramProps } from './diagram'
import { Diagram } from './diagram'

export type EmbeddedDiagramProps = Omit<DiagramProps, 'width' | 'height' | 'pannable' | 'zoomable' | 'zoomBy'>

export function EmbeddedDiagram({
  diagram,
  ...props
}: EmbeddedDiagramProps) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()
  const w = Math.ceil(diagram.width)
  const h = Math.ceil(diagram.height)

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
        diagram={diagram}
        width={measures.width}
        height={measures.height}
        pannable={false}
        zoomable={false}
        {...props}
      />}
  </div>
}
