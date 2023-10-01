import { Diagram } from '@likec4/diagrams'
import { useLikeC4View } from '../data'
import { useLayoutEffect } from 'react'
import styles from './export.module.css'

type ExportPageProps = {
  viewId: string
}
export function ExportPage({ viewId }: ExportPageProps) {
  const diagram = useLikeC4View(viewId)

  useLayoutEffect(() => {
    const classname = styles.exportpage ?? ''
    document.body.parentElement?.classList.add(classname)
    return () => {
      document.body.parentElement?.classList.remove(classname)
    }
  }, [])

  return (
    <Diagram
      animate={false}
      pannable={false}
      zoomable={false}
      diagram={diagram}
      padding={0}
      width={diagram.width}
      height={diagram.height}
    />
  )
}
