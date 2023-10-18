import { Diagram } from '@likec4/diagrams'
import { useWindowSize } from '@react-hookz/web/esm'
import { useLayoutEffect } from 'react'
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
  useLayoutEffect(() => {
    // see ../../likec4.css
    const classname = 'transparent-bg'
    document.body.parentElement?.classList.add(classname)
    return () => {
      document.body.parentElement?.classList.remove(classname)
    }
  }, [])

  if (!diagram) {
    return <DiagramNotFound />
  }

  return (
    <Diagram
      animate={false}
      pannable={false}
      zoomable={false}
      diagram={diagram}
      padding={padding}
      width={width}
      height={height}
    />
  )
}
