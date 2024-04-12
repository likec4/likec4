import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../useTransparentBackground'
import { cssExportVeew } from './view.css'

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
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Box
      className={cssExportVeew}
      style={{
        minWidth: diagram.width + padding * 2,
        minHeight: diagram.height + padding * 2,
        padding
      }}>
      <StaticLikeC4Diagram
        view={diagram}
        fitView={false}
        fitViewPadding={0}
        initialWidth={diagram.width}
        initialHeight={diagram.height}
        background={'transparent'}
      />
    </Box>
  )
}
