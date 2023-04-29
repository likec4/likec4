import { useMeasure } from '@react-hookz/web/esm'
import { Diagram, type DiagramProps } from '../diagram'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FlexDiagramProps extends
  Omit<DiagramProps, 'width' | 'height'> {
}

export function FlexDiagram({
  diagram,
  style,
  ...props
}: FlexDiagramProps) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()

  return <div ref={containerRef} style={{
    overflow: 'hidden',
    flex: 1,
    ...style
  }}>
    {measures && (<Diagram
      diagram={diagram}
      width={Math.ceil(measures.width)}
      height={Math.ceil(measures.height)}
      {...props}
    />)}
  </div>
}
