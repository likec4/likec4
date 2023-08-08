/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramView } from '@likec4/core'
import { useMeasure } from '@react-hookz/web/esm'
import { Diagram, type DiagramProps } from '../diagram'

export interface EmbeddedDiagramProps<
  Views extends Record<string, DiagramView>,
  Id = keyof Views & string
> extends Omit<DiagramProps, 'diagram' | 'width' | 'height'> {
  views: Views
  viewId: Id
  diagramClassName?: string | undefined
}

export function EmbeddedDiagram<Views extends Record<string, DiagramView>>({
  animate = false,
  interactive = false,
  zoomable = false,
  pannable = false,
  className,
  diagramClassName,
  padding = 10,
  views,
  viewId,
  ...props
}: EmbeddedDiagramProps<Views>) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()

  const diagram = views[viewId]
  const w = Math.ceil(diagram?.width ?? 10)
  const h = Math.ceil(diagram?.height ?? 10)

  return (
    <div
      un-position='relative'
      un-w='100%'
      un-h='auto'
      un-display='flex'
      un-mx='auto'
      un-box='border-box'
      style={{
        aspectRatio: `${w} / ${h}`,
        maxWidth: w
      }}
      // uno-position="relative"
      // uno-display="flex"
      // uno-w="full"
      // uno-h="auto"
      // uno-aspectratio={`${w} / ${h}`}

      // style={{
      //   position: 'relative',
      //   display: 'flex',
      //   aspectRatio: `${w} / ${h}`,
      //   width: '100%',
      //   height: 'auto',
      //   marginLeft: 'auto',
      //   marginRight: 'auto',
      //   maxWidth: w,
      //   boxSizing: 'border-box'
      // }}
      // className={className}
    >
      <div ref={containerRef} style={{ flex: '1 1 100%', overflow: 'hidden' }}>
        {!diagram && (
          <div style={{ margin: '1rem 0', padding: '1rem', background: '#AA00005b' }}>
            Diagram not found
          </div>
        )}
        {measures && diagram && (
          <Diagram
            interactive={interactive}
            animate={animate}
            className={diagramClassName}
            diagram={diagram}
            width={Math.ceil(measures.width)}
            height={Math.ceil(measures.height)}
            pannable={pannable}
            zoomable={zoomable}
            padding={padding}
            {...props}
          />
        )}
      </div>
    </div>
  )
}
