import { Diagram } from '@likec4/diagrams'
import { useWindowSize } from '@react-hookz/web/esm'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'

type ExportPageProps = {
  viewId: string
  padding: number
}
export function EmbedPage({ viewId, padding }: ExportPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return <Diagram diagram={diagram} padding={padding} width={width} height={height} />
}
