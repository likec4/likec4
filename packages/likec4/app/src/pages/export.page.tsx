import { Diagram } from '@likec4/diagrams'
import { useIsomorphicLayoutEffect, useWindowSize } from '@react-hookz/web/esm'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import styles from './export.module.css'

type ExportPageProps = {
  viewId: string
  padding: number
}
export function ExportPage({ viewId, padding }: ExportPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  useIsomorphicLayoutEffect(() => {
    const classname = styles.html ?? ''
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
