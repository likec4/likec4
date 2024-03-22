import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../useTransparentBackground'

export const Route = createFileRoute('/embed/$viewId')({
  component: EmbedPage
})

function EmbedPage() {
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Box
      pos={'absolute'}
      style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <StaticLikeC4Diagram
        view={diagram}
      />
    </Box>
  )
}
