import { Diagram } from '@likec4/diagrams'
import { useWindowSize } from '@react-hookz/web/esm'
import { useEffect } from 'react'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'

type ExportPageProps = {
  viewId: string
  padding: number
}
export function ExportPage({ viewId, padding }: ExportPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  // To get the transparent background
  // We need to add a class to the HTML element
  useEffect(() => {
    const htmlEl = document.body.parentElement
    if (!htmlEl) return
    // see ../../likec4.css
    const classname = 'transparent-bg'
    htmlEl.classList.add(classname)
    return () => {
      htmlEl.classList.remove(classname)
    }
  }, [])

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Diagram
      animate={false}
      pannable={false}
      zoomable={false}
      maxZoom={1}
      minZoom={1}
      diagram={diagram}
      padding={padding}
      width={width}
      height={height}
    />
  )
}
