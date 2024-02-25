import { LikeC4Diagram, LikeC4View } from '@likec4/diagram'
import { Box } from '@radix-ui/themes'
import { useWindowSize } from '@react-hookz/web'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../pages/useTransparentBackground'

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
      position={'absolute'}
      style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
    >
      <LikeC4Diagram
        view={diagram}
        readonly
        disableBackground
      />
    </Box>
  )
}
