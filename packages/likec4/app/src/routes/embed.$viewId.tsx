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
        left: '50%',
        boxSizing: 'border-box',
        padding,
        transform: 'translateX(-50%)',
        aspectRatio: `${diagram.width + padding * 2} / ${diagram.height + padding * 2}`,
        width: '100vw',
        maxWidth: diagram.width + padding * 2,
        height: 'auto',
        maxHeight: '100vh'
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
