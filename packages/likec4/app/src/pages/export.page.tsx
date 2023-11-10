import { Diagram } from '@likec4/diagrams'
import { useWindowSize } from '@react-hookz/web/esm'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from './useTransparentBackground'

type ExportPageProps = {
  viewId: string
  padding: number
}
export function ExportPage({ viewId, padding }: ExportPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(!!diagram)

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
