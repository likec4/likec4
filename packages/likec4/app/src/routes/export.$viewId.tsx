import { LikeC4View } from '@likec4/diagram'
import { useWindowSize } from '@react-hookz/web'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
import { useLikeC4View } from '../data'
import { useTransparentBackground } from '../pages/useTransparentBackground'

export const Route = createFileRoute('/export/$viewId')({
  component: ExportPage
})

function ExportPage() {
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
      <LikeC4View
        view={diagram}
        fitViewPadding={0}
      />
    </div>
  )
}
