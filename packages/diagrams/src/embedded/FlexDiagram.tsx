import { useMeasure } from '@react-hookz/web/esm'
import { Diagram, type DiagramProps } from '../diagram'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FlexDiagramProps extends
  Omit<DiagramProps, 'width' | 'height'> {
  diagramClassName?: string | undefined
}

export function FlexDiagram({
  className,
  diagramClassName,
  diagram,
  style,
  ...props
}: FlexDiagramProps) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()

  return <div
    ref={containerRef}
    className={className}
    style={{
      overflow: 'hidden',
      flex: '1 1 auto',
      ...style
    }}>
    {measures && (<Diagram
      className={diagramClassName}
      diagram={diagram}
      width={measures.width}
      height={measures.height}
      {...props}
    />)}
  </div>
}
