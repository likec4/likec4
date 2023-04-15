/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramNode, DiagramView } from '@likec4/core/types'
import { useMeasure, useToggle } from '@react-hookz/web/esm'
import { useCallback, useMemo, type CSSProperties } from 'react'
import invariant from 'tiny-invariant'
import { LazyDiagramBrowser } from '../browser/lazy'
import { LazyDiagram } from '../diagram/lazy'
import type { DiagramPaddings } from '../diagram/types'
import { cssEmbeddedContainer } from './embedded.css'

export interface EmbeddedDiagramProps<Views extends Record<any, DiagramView>, Id = (keyof Views & string)> {
  views: Views
  viewId: Id
  className?: string | undefined
  diagramClassName?: string | undefined
  padding?: DiagramPaddings
}

export function EmbeddedDiagram<Views extends Record<any, DiagramView>>({
  className,
  diagramClassName,
  padding = 8,
  views,
  viewId
}: EmbeddedDiagramProps<Views>) {
  const [measures, containerRef] = useMeasure<HTMLDivElement>()

  const diagram = views[viewId]
  invariant(diagram, `View with id "${viewId}" not found`)
  const w = Math.ceil(diagram.width)
  const h = Math.ceil(diagram.height)

  const style = useMemo((): CSSProperties => ({
    position: 'relative',
    display: 'flex',
    aspectRatio: `${w} / ${h}`,
    margin: '0 auto',
    ...(w > h ? {
      width: '100%',
      height: 'auto',
      maxWidth: w,
    } : {
      width: 'auto',
      height: '100%',
      maxHeight: h
    }),
  }), [w, h])

  const [isBrowserOpen, toggleBrowser] = useToggle(false)

  const onNodeClick = useCallback((_node: DiagramNode) => {
    toggleBrowser(true)
  }, [])

  return <>
    <div className={className} style={style}>
      <div
        ref={containerRef}
        className={cssEmbeddedContainer}
        style={{ flex: '1 1 100%', overflow: 'hidden' }}
      >
        {measures && (
          <LazyDiagram
            animate
            className={diagramClassName}
            diagram={diagram}
            width={Math.floor(measures.width)}
            height={Math.floor(measures.height)}
            pannable={false}
            zoomable={false}
            padding={padding}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
      {/* <div className={cssMagnifyingGlass}>
        <MagnifyingGlassPlus width={24} />
      </div> */}
      {isBrowserOpen && (
        <LazyDiagramBrowser
          views={views}
          selected={viewId}
          onClose={toggleBrowser}
        />
      )}
    </div>
  </>
}
