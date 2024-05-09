import { LikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../useTransparentBackground'
import { cssExportView } from './view.css'

// const asPadding = (v: unknown) => {
//   const parsed = typeof v === 'string' ? parseFloat(v) : undefined
//   if (parsed && isFinite(parsed) && isNaN(parsed) === false) {
//     return Math.round(parsed)
//   }
//   return undefined
// }

export const Route = createFileRoute('/export/$viewId')({
  component: ExportPage
})

function ExportPage() {
  const { padding = 20 } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground()

  if (!diagram) {
    throw notFound()
  }

  return (
    <Box
      className={cssExportView}
      style={{
        minWidth: diagram.width + padding * 2,
        minHeight: diagram.height + padding * 2,
        padding
      }}>
      <LikeC4Diagram
        view={diagram}
        readonly
        fitView={false}
        fitViewPadding={0}
        pannable={false}
        zoomable={false}
        controls={false}
        background={'transparent'}
        showElementLinks={false}
        nodesSelectable={false}
        nodesDraggable={false}
        initialWidth={diagram.width}
        initialHeight={diagram.height} />
    </Box>
  )
}
