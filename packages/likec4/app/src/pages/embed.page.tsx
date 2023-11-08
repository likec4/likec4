import { Diagram } from '@likec4/diagrams'
import { useWindowSize } from '@react-hookz/web/esm'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from './useTransparentBackground'

type EmbedPageProps = {
  viewId: string
  padding: number
  transparentBg?: boolean | undefined
}
export function EmbedPage({ viewId, padding, transparentBg = true }: EmbedPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(transparentBg && !!diagram)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
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
