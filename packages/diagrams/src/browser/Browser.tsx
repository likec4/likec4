/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramNode, DiagramView } from '@likec4/core/types'
import { useMeasure } from '@react-hookz/web/esm'
import { useCallback, useState } from 'react'
import invariant from 'tiny-invariant'
import {
  Dialog,
  DialogContent
} from '../components/ui/dialog'
import { LazyDiagram } from '../diagram/lazy'
import { browserContent, dialogContent } from './browser.css'

export interface DiagramBrowserProps<Views extends Record<any, DiagramView>, Id = (keyof Views & string)> {
  views: Views
  selected: Id
  onClose?: (() => void) | undefined
}


export function DiagramBrowser<Views extends Record<any, DiagramView>>({
  views,
  selected,
  onClose
}: DiagramBrowserProps<Views>): JSX.Element {

  const [viewId, setViewId] = useState(selected)

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (navigateTo && navigateTo in views) {
      setViewId(navigateTo)
    }
  }, [views])

  const onOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose()
    }
  }

  const [measures, cntainerRef] = useMeasure<HTMLDivElement>()

  const diagram = views[viewId]
  invariant(diagram, `View with id "${viewId}" not found`)

  return <Dialog defaultOpen modal onOpenChange={onOpenChange}>
    <DialogContent className={dialogContent}>
      <div ref={cntainerRef} className={browserContent}>
        {measures && (
          <LazyDiagram
            animate
            interactive
            diagram={diagram}
            width={Math.floor(measures.width)}
            height={Math.floor(measures.height)}
            padding={10}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
    </DialogContent>
  </Dialog >
}
