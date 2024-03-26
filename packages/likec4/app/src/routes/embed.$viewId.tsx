import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4'
import { DiagramNotFound } from '../components'
import { useTransparentBackground } from '../useTransparentBackground'

export const Route = createFileRoute('/embed/$viewId')({
  component: EmbedPage
})

function EmbedPage() {
  const { padding = 20 } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Box
      pos={'absolute'}
      style={{
        top: 0,
        left: 0,
        boxSizing: 'border-box',
        padding,
        width: '100vw',
        height: '100vh'
      }}
    >
      <StaticLikeC4Diagram
        view={diagram}
        fitViewPadding={0}
        background={'transparent'}
      />
    </Box>
  )
}
