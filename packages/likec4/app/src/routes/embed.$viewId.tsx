import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { RenderIcon } from '../components/RenderIcon'
import { useLikeC4DiagramView, useTransparentBackground } from '../hooks'

export const Route = createFileRoute('/embed/$viewId')({
  component: EmbedPage,
})

function EmbedPage() {
  const { padding = 20 } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4DiagramView(viewId)

  useTransparentBackground(!!diagram)

  if (!diagram) {
    throw notFound()
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
        aspectRatio: `${diagram.bounds.width + padding * 2} / ${diagram.bounds.height + padding * 2}`,
        width: '100vw',
        maxWidth: diagram.bounds.width + padding * 2,
        height: 'auto',
        maxHeight: '100vh',
      }}
    >
      <StaticLikeC4Diagram
        view={diagram}
        fitView={true}
        background={'transparent'}
        renderIcon={RenderIcon}
        initialWidth={diagram.bounds.width}
        initialHeight={diagram.bounds.height} />
    </Box>
  )
}
