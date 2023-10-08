import { Diagram } from '@likec4/diagrams'
import { useLikeC4View } from '../data'
import { useLayoutEffect } from 'react'
import styles from './export.module.css'
import { DiagramNotFound } from '../components'

type ExportPageProps = {
  viewId: string
  padding: number
}
export function ExportPage({ viewId, padding }: ExportPageProps) {
  const diagram = useLikeC4View(viewId)

  useLayoutEffect(() => {
    const classname = styles.exportpage ?? ''
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
      width={diagram.width + padding * 2}
      height={diagram.height + padding * 2}
    />
  )
}
